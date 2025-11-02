import { ethers } from 'ethers';

// Arbitrum Sepolia RPC
export const ARBITRUM_SEPOLIA_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

// Common ERC20 ABI (para leer balances de tokens)
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

// Vault ABI (contrato del fondo)
export const VAULT_ABI = [
  'function initialize(address asset) external',
  'function deposit(uint256 assets, address receiver) external returns (uint256)',
  'function withdraw(uint256 assets, address receiver, address owner) external returns (uint256)',
  'function convertToShares(uint256 assets) external view returns (uint256)',
  'function convertToSharesOneToOne(uint256 assets) external view returns (uint256)',
  'function redeem(uint256 shares, address receiver, address owner) external',
  'function totalAssets() external view returns (uint256)',
  'function asset() external view returns (address)', // Obtener el asset configurado
  'function paused() external view returns (bool)', // Verificar si está pausado
  'function minDeposit() external view returns (uint256)', // Cantidad mínima si existe
];

// Token addresses en Arbitrum Sepolia (algunos ejemplos comunes)
export const COMMON_TOKENS = {
  WETH: '0xC556bA1b7A9B15F36B5b2e8C5e8bD4C5e8bD4C5', // Placeholder - actualiza con direcciones reales
  USDC: '0x75faf114eafb1BDbe2F0316DF893fd58cE90b5b1', // USDC en Arbitrum Sepolia
  USDT: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Placeholder
};

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
  }

  async connectWallet(): Promise<ethers.JsonRpcSigner | null> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      console.error('MetaMask no está instalado');
      return null;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      this.signer = signer;
      return signer;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<string> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
      ]);

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error(`Error getting balance for token ${tokenAddress}:`, error);
      return '0';
    }
  }

  async getTokenDecimals(tokenAddress: string): Promise<number> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const decimals = await contract.decimals();
      return Number(decimals);
    } catch (error) {
      console.error(`Error getting decimals for token ${tokenAddress}:`, error);
      return 18; // Default
    }
  }

  async getTokenAllowance(
    walletAddress: string,
    tokenAddress: string,
    spenderAddress: string
  ): Promise<bigint> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const allowance = await contract.allowance(walletAddress, spenderAddress);
      return allowance;
    } catch (error) {
      console.error(`Error getting allowance for token ${tokenAddress}:`, error);
      return BigInt(0);
    }
  }

  async getTokenBalances(walletAddress: string, tokenAddresses: string[]): Promise<TokenBalance[]> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    const balances: TokenBalance[] = [];

    for (const tokenAddress of tokenAddresses) {
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
        const [balance, decimals, symbol, name] = await Promise.all([
          contract.balanceOf(walletAddress),
          contract.decimals(),
          contract.symbol(),
          contract.name(),
        ]);

        const formattedBalance = ethers.formatUnits(balance, decimals);

        balances.push({
          address: tokenAddress,
          symbol,
          name,
          balance: formattedBalance,
          decimals: Number(decimals),
        });
      } catch (error) {
        console.error(`Error getting balance for token ${tokenAddress}:`, error);
      }
    }

    return balances;
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<any[]> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    try {
      // Usar Arbiscan API para obtener transacciones
      const response = await fetch(
        `https://api-sepolia.arbiscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        return data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  async sendTransaction(to: string, value: string): Promise<string | null> {
    if (!this.signer) {
      throw new Error('Billetera no conectada');
    }

    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
      });

      const receipt = await tx.wait();
      return receipt?.hash || tx.hash;
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async approveToken(
    tokenAddress: string,
    spender: string,
    amount: string
  ): Promise<string | null> {
    if (!this.signer) {
      throw new Error('Billetera no conectada');
    }

    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      
      // Obtener decimals del token
      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      
      // Aprobar una cantidad grande (máximo uint256) para evitar aprobar múltiples veces
      const maxApproval = ethers.MaxUint256;
      
      const tx = await tokenContract.approve(spender, maxApproval);
      const receipt = await tx.wait();
      
      return receipt?.hash || tx.hash;
    } catch (error: any) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  async depositToVault(
    vaultAddress: string,
    assets: string,
    receiver: string,
    tokenAddress?: string,
    tokenDecimals: number = 18
  ): Promise<string | null> {
    if (!this.signer) {
      throw new Error('Billetera no conectada');
    }

    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, this.signer);
      const assetsWei = ethers.parseUnits(assets, tokenDecimals);
      
      // Si es un token ERC20, verificar que el contrato tenga allowance suficiente
      if (tokenAddress) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
        const userAddress = await this.signer.getAddress();
        
        // Verificar allowance nuevamente (por si acaso)
        const allowance = await tokenContract.allowance(userAddress, vaultAddress);
        
        if (allowance < assetsWei) {
          throw new Error(`Allowance insuficiente. Tienes: ${ethers.formatUnits(allowance, tokenDecimals)}, necesitas: ${assets}`);
        }
        
        // Verificar balance del usuario
        const balance = await tokenContract.balanceOf(userAddress);
        if (balance < assetsWei) {
          throw new Error(`Balance insuficiente. Tienes: ${ethers.formatUnits(balance, tokenDecimals)}, intentas depositar: ${assets}`);
        }
      }
      
      // Intentar estimar el gas primero para ver si hay algún error
      // Esto detectará el error ANTES de enviar la transacción
      try {
        console.log('Estimando gas para la transacción...');
        const gasEstimate = tokenAddress
          ? await contract.deposit.estimateGas(assetsWei, receiver)
          : await contract.deposit.estimateGas(assetsWei, receiver, { value: assetsWei });
        
        console.log('Gas estimado:', gasEstimate.toString());
        
        // Validar que el gas estimado sea razonable
        if (gasEstimate > 1000000n) {
          console.warn('Gas estimado muy alto:', gasEstimate.toString());
        }
      } catch (estimateError: any) {
        console.error('Error al estimar gas:', estimateError);
        
        // Si falla la estimación, el contrato rechazará la transacción
        // Extraer el motivo específico del error
        let errorDetails = '';
        
        if (estimateError.reason) {
          errorDetails = estimateError.reason;
        } else if (estimateError.data) {
          errorDetails = `Error de datos: ${estimateError.data}`;
        } else if (estimateError.message) {
          errorDetails = estimateError.message;
        }
        
        // Mensaje más específico basado en el tipo de error
        if (errorDetails.includes('require(false)') || errorDetails.includes('revert')) {
          throw new Error('El contrato rechazará el depósito. Posibles causas:\n' +
            '1. El contrato no está inicializado con LINK\n' +
            '2. Cantidad mínima no cumplida\n' +
            '3. El contrato está pausado\n' +
            '4. Falta alguna validación del contrato\n\n' +
            'Verifica el código del contrato Vault.');
        } else if (errorDetails) {
          throw new Error(`El contrato rechazará la transacción: ${errorDetails}`);
        } else {
          throw new Error('Error al estimar gas. El contrato probablemente rechazará la transacción.');
        }
      }
      
      // Llamar a deposit - si es token, no enviamos value; si es ETH, enviamos value
      // El contrato Vault debería transferir los tokens automáticamente con safeTransferFrom
      console.log(`Enviando transacción de depósito: ${assets} tokens (${assetsWei.toString()} wei)`);
      
      const tx = tokenAddress 
        ? await contract.deposit(assetsWei, receiver, {
            gasLimit: 500000 // Gas limit suficiente
          }) // Token ERC20
        : await contract.deposit(assetsWei, receiver, { 
            value: assetsWei,
            gasLimit: 500000
          }); // ETH
      
      console.log('Transacción enviada, hash:', tx.hash);
      console.log('Esperando confirmación...');
      
      // Esperar a que la transacción se mine
      const receipt = await tx.wait();
      
      // CRÍTICO: Verificar si la transacción fue exitosa
      if (!receipt) {
        throw new Error('No se recibió el receipt de la transacción.');
      }
      
      if (receipt.status === 0 || receipt.status === null) {
        // La transacción fue revertida
        console.error('Transacción revertida. Receipt:', receipt);
        
        // Intentar obtener más información del error
        let revertReason = 'Razón desconocida';
        if (receipt.logs && receipt.logs.length > 0) {
          console.log('Logs de la transacción:', receipt.logs);
        }
        
        throw new Error('❌ La transacción fue revertida por el contrato.\n\n' +
          'Posibles causas:\n' +
          '1. El contrato Vault no está inicializado con LINK\n' +
          '2. El contrato tiene validaciones que no se cumplen\n' +
          '3. Cantidad mínima o máxima no cumplida\n' +
          '4. El contrato está pausado o bloqueado\n' +
          '5. Problema con el allowance del token\n\n' +
          `Hash de transacción: ${receipt.hash}\n` +
          'Revisa la transacción en Arbiscan para más detalles.');
      }
      
      console.log('✅ Transacción exitosa. Hash:', receipt.hash);
      return receipt.hash;
    } catch (error: any) {
      console.error('Error depositing to vault:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Mejorar mensajes de error con más información
      if (error.reason) {
        // Intentar decodificar el error si es posible
        let errorMessage = `Error del contrato: ${error.reason}`;
        
        // Mensajes comunes de errores en Vaults
        if (error.reason.includes('require(false)') || error.reason.includes('revert')) {
          errorMessage = `El contrato rechazó la transacción. Posibles causas:\n` +
            `- El contrato no está inicializado con LINK\n` +
            `- Cantidad mínima no cumplida\n` +
            `- El contrato está pausado\n` +
            `- Verifica el código del contrato para más detalles`;
        }
        
        throw new Error(errorMessage);
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error(`El contrato rechazará la transacción. Verifica:\n` +
          `1. Que el contrato esté inicializado con LINK (${tokenAddress})\n` +
          `2. Que tengas suficiente balance y allowance\n` +
          `3. Que no haya restricciones en el contrato`);
      } else if (error.message) {
        throw error;
      } else if (error.data) {
        throw new Error(`Error: ${JSON.stringify(error.data)}`);
      } else {
        throw new Error('Error desconocido al depositar. Verifica la consola del navegador para más detalles.');
      }
    }
  }

  async withdrawFromVault(
    vaultAddress: string,
    assets: string,
    receiver: string,
    owner: string
  ): Promise<string | null> {
    if (!this.signer) {
      throw new Error('Billetera no conectada');
    }

    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, this.signer);
      const assetsWei = ethers.parseEther(assets);
      
      const tx = await contract.withdraw(assetsWei, receiver, owner);
      const receipt = await tx.wait();
      
      return receipt?.hash || tx.hash;
    } catch (error: any) {
      console.error('Error withdrawing from vault:', error);
      throw error;
    }
  }

  async getVaultTotalAssets(vaultAddress: string): Promise<string> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, this.provider);
      const totalAssets = await contract.totalAssets();
      return ethers.formatEther(totalAssets);
    } catch (error) {
      console.error('Error getting vault total assets:', error);
      return '0';
    }
  }

  async getVaultAsset(vaultAddress: string): Promise<string | null> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, this.provider);
      const asset = await contract.asset();
      return asset;
    } catch (error) {
      console.error('Error getting vault asset:', error);
      // Si falla, puede ser que el contrato no esté inicializado
      return null;
    }
  }

  async checkVaultInitialized(vaultAddress: string, expectedAsset: string): Promise<{ initialized: boolean; currentAsset: string | null; error?: string; details?: any }> {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    }

    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, this.provider);
      const details: any = {};
      
      // Verificar si está pausado
      try {
        const paused = await contract.paused();
        details.paused = paused;
        if (paused) {
          return { 
            initialized: false, 
            currentAsset: null,
            error: 'El contrato Vault está pausado. No se pueden realizar depósitos.',
            details
          };
        }
      } catch (e) {
        // Si paused() no existe, ignoramos el error
      }
      
      // Intentar obtener cantidad mínima
      try {
        const minDeposit = await contract.minDeposit();
        details.minDeposit = minDeposit.toString();
      } catch (e) {
        // Si minDeposit() no existe, ignoramos
      }
      
      // Intentar obtener el asset
      try {
        const asset = await contract.asset();
        const assetLower = asset.toLowerCase();
        const expectedLower = expectedAsset.toLowerCase();
        
        details.currentAsset = asset;
        
        if (assetLower === expectedLower) {
          return { initialized: true, currentAsset: asset, details };
        } else {
          return { 
            initialized: false, 
            currentAsset: asset,
            error: `El contrato está inicializado con ${asset}, pero necesitas ${expectedAsset}`,
            details
          };
        }
      } catch (assetError: any) {
        // Si asset() falla, el contrato probablemente no está inicializado
        console.error('Error calling asset():', assetError);
        return { 
          initialized: false, 
          currentAsset: null,
          error: 'El contrato Vault no está inicializado. Necesitas llamar a initialize() primero.',
          details
        };
      }
    } catch (error: any) {
      console.error('Error checking vault initialization:', error);
      return { 
        initialized: false, 
        currentAsset: null,
        error: `Error al verificar el contrato: ${error.message || 'Error desconocido'}` 
      };
    }
  }

  async initializeVault(vaultAddress: string, assetAddress: string): Promise<string | null> {
    if (!this.signer) {
      throw new Error('Billetera no conectada');
    }

    try {
      const contract = new ethers.Contract(vaultAddress, VAULT_ABI, this.signer);
      
      // Intentar estimar el gas primero
      try {
        const gasEstimate = await contract.initialize.estimateGas(assetAddress);
        console.log('Gas estimado para initialize:', gasEstimate.toString());
      } catch (estimateError: any) {
        console.error('Error al estimar gas para initialize:', estimateError);
        
        if (estimateError.reason) {
          throw new Error(`No puedes inicializar el contrato: ${estimateError.reason}\n\nProbablemente no tienes permisos de owner/admin.`);
        } else if (estimateError.message) {
          throw new Error(`Error al estimar gas: ${estimateError.message}`);
        } else {
          throw new Error('El contrato rechazará la inicialización. Verifica que tengas permisos de owner.');
        }
      }
      
      const tx = await contract.initialize(assetAddress, {
        gasLimit: 500000
      });
      
      console.log('Transacción de inicialización enviada, hash:', tx.hash);
      const receipt = await tx.wait();
      
      if (receipt.status === 0 || receipt.status === null) {
        throw new Error('La transacción de inicialización fue revertida. Probablemente no tienes permisos de owner/admin del contrato.');
      }
      
      console.log('✅ Contrato inicializado exitosamente');
      return receipt.hash;
    } catch (error: any) {
      console.error('Error initializing vault:', error);
      
      // Mejorar mensajes de error
      if (error.reason) {
        throw new Error(`Error al inicializar: ${error.reason}`);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Error desconocido al inicializar el contrato.');
      }
    }
  }
}

export const blockchainService = new BlockchainService();

