// Required for the no_std environment (for macros and String)
extern crate alloc;

// --- IMPORTS ---
use openzeppelin_stylus::{
    token::erc20::{
        self,
        extensions::{Erc20Metadata, IErc20Metadata},
        Erc20, IErc20,
    },
    // CHANGED: This is the correct path from the error message
    utils::introspection::erc165::IErc165,
};

// CHANGED: Removed the unused `tx` import
use stylus_sdk::prelude::*;

// Added `Address`, `U256` and fixed the `B32` import path
use alloy_primitives::{Address, U256, U8};
use alloy_primitives::aliases::B32; // This is the correct path

// Add imports for String in no_std
use alloc::string::{String, ToString};

// --- STRUCT DEFINITION ---
#[entrypoint]
#[storage]
struct FundToken {
    erc20: Erc20,
    metadata: Erc20Metadata,
}

// --- MAIN IMPLEMENTATION ---
#[public]
// This line tells Stylus that FundToken implements all these traits
#[implements(IErc20<Error = erc20::Error>, IErc20Metadata, IErc165)]
impl FundToken {
    #[constructor]
    fn constructor(&mut self) -> Result<(), erc20::Error> {
        
        let name: String = "FundToken".to_string();
        let symbol: String = "FND".to_string();

        // Set the metadata
        self.metadata.constructor(name, symbol);

        // This is the new, non-deprecated way to get the tx origin
        let deployer = self.vm().tx_origin();

        // Calculate 100,000 tokens (100,000 * 10^18)
        let initial_supply = U256::from(100000) * U256::from(10).pow(U256::from(18));

        // Mint the tokens to the deployer (which is now your wallet)
        self.erc20._mint(deployer, initial_supply)?;

        Ok(())
    }
}

// --- TRAIT IMPLEMENTATIONS ---

// This block provides the IErc20 functions
#[public]
impl IErc20 for FundToken {
    type Error = erc20::Error;

    fn total_supply(&self) -> U256 {
        self.erc20.total_supply()
    }

    fn balance_of(&self, account: Address) -> U256 {
        self.erc20.balance_of(account)
    }

    fn transfer(
        &mut self,
        to: Address,
        value: U256,
    ) -> Result<bool, Self::Error> {
        self.erc20.transfer(to, value)
    }

    fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.erc20.allowance(owner, spender)
    }

    fn approve(
        &mut self,
        spender: Address,
        value: U256,
    ) -> Result<bool, Self::Error> {
        self.erc20.approve(spender, value)
    }

    fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        value: U256,
    ) -> Result<bool, Self::Error> {
        self.erc20.transfer_from(from, to, value)
    }
}

// This block provides the IErc20Metadata functions
#[public]
impl IErc20Metadata for FundToken {
    fn name(&self) -> String {
        self.metadata.name()
    }

    fn symbol(&self) -> String {
        self.metadata.symbol()
    }

    fn decimals(&self) -> U8 {
        self.metadata.decimals() // This will return 18
    }
}

// This block provides the IErc165 functions
#[public]
impl IErc165 for FundToken {
    fn supports_interface(&self, interface_id: B32) -> bool {
        // We tell the world we support ERC20 and ERC20Metadata
        self.erc20.supports_interface(interface_id)
            || self.metadata.supports_interface(interface_id)
    }
}