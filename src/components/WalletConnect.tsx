import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface WalletConnectProps {
  onConnect: (address: string, balance: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  address: string | null;
}

// Arbitrum Sepolia Network Configuration
const ARBITRUM_SEPOLIA = {
  chainId: '0x66eee', // 421614 in hex
  chainName: 'Arbitrum Sepolia Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://sepolia.arbiscan.io'],
};

export function WalletConnect({ onConnect, onDisconnect, isConnected, address }: WalletConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);

  // Check current chain ID
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const checkChain = async () => {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setCurrentChainId(chainId);
        } catch (error) {
          console.error('Error checking chain:', error);
        }
      };

      checkChain();

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        setCurrentChainId(chainId);
        window.location.reload(); // Reload page on chain change
      });

      return () => {
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, []);

  const switchToArbitrumSepolia = async () => {
    try {
      // Try to switch to Arbitrum Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_SEPOLIA.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add Arbitrum Sepolia network
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ARBITRUM_SEPOLIA],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Arbitrum Sepolia network:', addError);
          toast.error('Error adding Arbitrum Sepolia network');
          return false;
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        toast.error('Network switch rejected');
        return false;
      } else {
        console.error('Error switching to Arbitrum Sepolia:', switchError);
        toast.error('Error switching to Arbitrum Sepolia');
        return false;
      }
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        // First, ensure we're on Arbitrum Sepolia
        const switched = await switchToArbitrumSepolia();
        if (!switched) {
          setIsLoading(false);
          return;
        }

        // Wait a bit for the network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        
        // Get balance
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        });
        
        // Convert balance from wei to ETH
        const ethBalance = (parseInt(balance, 16) / 1e18).toFixed(4);
        
        toast.success('Wallet connected to Arbitrum Sepolia');
        onConnect(account, ethBalance);
      } else {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Connection rejected');
      } else {
        toast.error('Error connecting wallet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isOnArbitrumSepolia = currentChainId === ARBITRUM_SEPOLIA.chainId;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <Card className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-700 dark:text-green-400">{formatAddress(address)}</span>
          </div>
        </Card>
        {!isOnArbitrumSepolia && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={switchToArbitrumSepolia}
            className="text-xs"
          >
            Switch to Arbitrum Sepolia
          </Button>
        )}
        <Button variant="outline" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connectWallet} disabled={isLoading} className="gap-2">
      <Wallet className="w-4 h-4" />
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
