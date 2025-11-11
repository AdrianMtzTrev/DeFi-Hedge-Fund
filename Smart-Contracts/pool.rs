//!
//! Stylus Hello World
//!
//! The following contract implements the Counter example from Foundry.
//!
//! ```
//! contract Counter {
//!     uint256 public number;
//!     function setNumber(uint256 newNumber) public {
//!         number = newNumber;
//!     }
//!     function increment() public {
//!         number++;
//!     }
//! }
//! ```
//!
//! The program is ABI-equivalent with Solidity, which means you can call it from both Solidity and Rust.
//! To do this, run `cargo stylus export-abi`.
//!
//! Note: this code is a template-only and has not been audited.
//!

// Allow `cargo stylus export-abi` to generate a main function.
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

/// Use an efficient WASM allocator.
#[global_allocator]
static ALLOC: mini_alloc::MiniAlloc = mini_alloc::MiniAlloc::INIT;

/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::{U256, Address}, prelude::*, call::RawCall, contract::address};
use alloy_sol_types::{sol, SolCall};

// Define ERC20 interface for encoding calls
sol! {
    interface IERC20 {
        function transferFrom(address from, address to, uint256 amount) external returns (bool);
        function transfer(address to, uint256 amount) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
    }
}

// Define some persistent storage using the Solidity ABI.
// `Counter` will be the entrypoint.
sol_storage! {
    #[entrypoint]
    pub struct Vault {
        address asset; // The ERC-20 token address this vault holds
        uint256 total_shares; // Total shares minted
        uint256 total_assets; // Total assets held by the vault
        mapping(address => uint256) balance_of; // User balances (address => shares)
    }
}

macro_rules! require {
    ($condition:expr, $message:expr) => {
        if !$condition {
            panic!("{}", $message);
        }
    };
}

/// Declare that `Counter` is a contract with the following external methods.
#[external]
impl Vault {
    /// Initialize the vault with an ERC-20 token address
    pub fn initialize(&mut self, asset: Address){
        require!(self.asset.get() == Address::ZERO, "Already initialized");
        self.asset.set(asset);
    }

    /// Helper: Convert assets to shares
    fn convert_to_shares(&self, assets: U256) -> U256 {
        return assets * self.total_shares.get() / self.total_assets.get();
    }

    pub fn total_assets(&self) -> Result<U256, Vec<u8>> {
        // Get the address of the asset this vault holds
        let asset_address = self.asset.get();
        
        // Get our own contract's address
        let contract_address = address();

        // 1. Encode the calldata for the ERC-20 'balanceOf' call
        //    Nota: ¡Debe ser 'balanceOfCall' (minúscula)
        let calldata = IERC20::balanceOfCall {
            account: contract_address,
        }.abi_encode();

        // 2. Make the external call to the asset contract
        let result = RawCall::new()
            .call(asset_address, &calldata); // This returns a Result<Vec<u8>, Vec<u8>>

        // 3. Handle the result
        match result {
            Ok(data) => {
                // 4. Decode the successful return data
                //    Nota: ¡Debe ser 'balanceOfCall' (minúscula)
                let decoded = IERC20::balanceOfCall::abi_decode_returns(&data, true)
                    .map_err(|e| e.to_string().into_bytes())?; // Handle decoding error
                
                // The 'BalanceOfReturn' struct has one field, '_0', for the first return value
                Ok(decoded._0)
            }
            Err(e) => {
                // The call itself failed (reverted), pass the error along
                Err(e)
            }
        }
    }
}
