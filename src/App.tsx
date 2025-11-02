import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { PoolStats } from './components/PoolStats';
import { UserPortfolio } from './components/UserPortfolio';
import { DepositWithdraw } from './components/DepositWithdraw';
import { TransactionHistory, Transaction } from './components/TransactionHistory';
import { YieldChart } from './components/YieldChart';
import { Profile } from './components/Profile';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Toaster } from './components/ui/sonner';
import { TrendingUp, LayoutDashboard, User } from 'lucide-react';
import { Button } from './components/ui/button';
import { blockchainService } from './utils/blockchain';

function AppContent() {
  // Navigation state
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');

  // Wallet state
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [ethBalance, setEthBalance] = useState('0');

  // Portfolio state
  const [depositedAmount, setDepositedAmount] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // Pool state
  const [totalValueLocked, setTotalValueLocked] = useState(12450000);
  const [totalUsers, setTotalUsers] = useState(3421);
  const [currentAPY, setCurrentAPY] = useState(18.5);
  const [monthlyYield, setMonthlyYield] = useState(186750);

  // Dirección del contrato Vault
  const VAULT_ADDRESS = '0xF2aC145700F1F1eeFD3c8F3923E9D15B18De412f';

  // Cargar Total Value Locked real del contrato
  useEffect(() => {
    const loadVaultTotalAssets = async () => {
      try {
        const totalAssets = await blockchainService.getVaultTotalAssets(VAULT_ADDRESS);
        const totalAssetsUSD = parseFloat(totalAssets) * 2500; // Convertir ETH a USD
        if (totalAssetsUSD > 0) {
          setTotalValueLocked(totalAssetsUSD);
        }
      } catch (error) {
        console.error('Error loading vault total assets:', error);
      }
    };

    if (isConnected) {
      loadVaultTotalAssets();
      // Actualizar cada minuto
      const interval = setInterval(loadVaultTotalAssets, 60000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Transaction history
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Chart data
  const [chartData, setChartData] = useState<Array<{ date: string; value: number }>>([]);

  // Wallet connection handlers
  const handleConnect = async (address: string, balance: string) => {
    setIsConnected(true);
    setWalletAddress(address);
    setEthBalance(balance);
    setWalletBalance(parseFloat(balance) * 2500); // Convert ETH to USD equivalent
    
    // Conectar wallet al servicio blockchain
    await blockchainService.connectWallet();
    
    // Actualizar balance periódicamente
    updateBalance();
  };

  // Actualizar balance desde blockchain
  const updateBalance = async () => {
    if (!walletAddress) return;
    
    try {
      const balance = await blockchainService.getBalance(walletAddress);
      setEthBalance(balance);
      setWalletBalance(parseFloat(balance) * 2500);
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  // Actualizar balance cada 30 segundos
  useEffect(() => {
    if (!isConnected || !walletAddress) return;
    
    const interval = setInterval(updateBalance, 30000);
    return () => clearInterval(interval);
  }, [isConnected, walletAddress]);

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setWalletBalance(0);
    setDepositedAmount(0);
    setCurrentValue(0);
    setTotalEarnings(0);
    setTransactions([]);
    setChartData([]);
  };

  // Deposit handler - ahora con hash de transacción real
  const handleDeposit = async (amount: number, txHash: string) => {
    const newDeposited = depositedAmount + amount;
    const newWalletBalance = walletBalance - amount;
    
    setDepositedAmount(newDeposited);
    setCurrentValue(newDeposited);
    setWalletBalance(newWalletBalance);
    
    // Actualizar balance real de blockchain
    await updateBalance();
    
    // Update pool stats
    setTotalValueLocked(prev => prev + amount);
    
    // Add transaction con hash real
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      amount: amount,
      timestamp: new Date(),
      hash: txHash
    };
    setTransactions(prev => [newTransaction, ...prev]);

    // Update chart data
    updateChartData(newDeposited);
  };

  // Withdraw handler - ahora con hash de transacción real
  const handleWithdraw = async (amount: number, txHash: string) => {
    const newDeposited = depositedAmount - amount;
    const newCurrentValue = currentValue - amount;
    const newWalletBalance = walletBalance + amount;
    
    setDepositedAmount(newDeposited);
    setCurrentValue(newCurrentValue);
    setWalletBalance(newWalletBalance);
    
    // Actualizar balance real de blockchain
    await updateBalance();
    
    // Update pool stats
    setTotalValueLocked(prev => prev - amount);
    
    // Add transaction con hash real
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'withdraw',
      amount: amount,
      timestamp: new Date(),
      hash: txHash
    };
    setTransactions(prev => [newTransaction, ...prev]);

    // Update chart data
    updateChartData(newCurrentValue);
  };

  // Update chart data helper
  const updateChartData = (value: number) => {
    const now = new Date();
    const dateStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setChartData(prev => {
      const newData = [...prev, { date: dateStr, value: value }];
      // Keep only last 10 data points
      return newData.slice(-10);
    });
  };

  // Simulate yield generation
  useEffect(() => {
    if (!isConnected || depositedAmount === 0) return;

    const yieldInterval = setInterval(() => {
      // Calculate yield (APY / 365 / 24 for hourly rate, but we'll simulate every 5 seconds)
      const hourlyRate = currentAPY / 100 / 365 / 24;
      const yieldAmount = depositedAmount * hourlyRate / 720; // Simulated yield every 5 seconds

      setCurrentValue(prev => {
        const newValue = prev + yieldAmount;
        updateChartData(newValue);
        return newValue;
      });
      
      setTotalEarnings(prev => prev + yieldAmount);
      setMonthlyYield(prev => prev + yieldAmount);

      // Occasionally add yield transaction
      if (Math.random() > 0.95) {
        const yieldTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'yield',
          amount: yieldAmount * 10,
          timestamp: new Date()
        };
        setTransactions(prev => [yieldTransaction, ...prev].slice(0, 50)); // Keep last 50 transactions
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(yieldInterval);
  }, [isConnected, depositedAmount, currentAPY]);

  // Initialize chart data when depositing for the first time
  useEffect(() => {
    if (depositedAmount > 0 && chartData.length === 0) {
      const initialData = [];
      for (let i = 0; i < 5; i++) {
        initialData.push({
          date: `${i}h`,
          value: depositedAmount
        });
      }
      setChartData(initialData);
    }
  }, [depositedAmount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900 dark:text-gray-100">DeFi Hedge Fund</h1>
                <p className="text-gray-600 dark:text-gray-400">Automated Yield Optimization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected && (
                <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-700 pr-3">
                  <Button
                    variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('dashboard')}
                    className="gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant={currentView === 'profile' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('profile')}
                    className="gap-2"
                  >
                    <User className="w-4 h-4" />
                    Perfil
                  </Button>
                </div>
              )}
              <ThemeToggle />
              <WalletConnect
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                isConnected={isConnected}
                address={walletAddress}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Pool Stats */}
        <div className="mb-8">
          <PoolStats
            totalValueLocked={totalValueLocked}
            totalUsers={totalUsers}
            currentAPY={currentAPY}
            monthlyYield={monthlyYield}
          />
        </div>

        {!isConnected ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-gray-900 dark:text-gray-100 mb-3">Connect Your Wallet to Get Started</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your crypto wallet to start earning yield on your assets through our automated DeFi strategies.
              </p>
            </div>
          </div>
        ) : currentView === 'profile' ? (
          <Profile address={walletAddress} ethBalance={ethBalance} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <YieldChart data={chartData} />
              <TransactionHistory transactions={transactions} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <UserPortfolio
                depositedAmount={depositedAmount}
                currentValue={currentValue}
                totalEarnings={totalEarnings}
                apy={currentAPY}
              />
              <DepositWithdraw
                walletBalance={walletBalance}
                depositedAmount={depositedAmount}
                walletAddress={walletAddress}
                onDeposit={handleDeposit}
                onWithdraw={handleWithdraw}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">© 2025 DeFi Hedge Fund. All rights reserved.</p>
            <p className="text-gray-500 dark:text-gray-500">Powered by Arbitrum</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
