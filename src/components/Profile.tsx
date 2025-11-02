import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { User, Wallet, TrendingUp, Coins, ArrowRight, ExternalLink } from 'lucide-react';
import { blockchainService, TokenBalance } from '../utils/blockchain';
import { toast } from 'sonner';

interface ProfileProps {
  address: string | null;
  ethBalance: string;
}

interface Investment {
  token: string;
  symbol: string;
  amount: string;
  value: number;
  timestamp: Date;
  txHash: string;
}

export function Profile({ address, ethBalance }: ProfileProps) {
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);

  useEffect(() => {
    if (address) {
      loadProfileData();
    }
  }, [address]);

  const loadProfileData = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // Cargar balances de tokens comunes
      const tokenAddresses = Object.values({
        USDC: '0x75faf114eafb1BDbe2F0316DF893fd58cE90b5b1',
        // Agrega más tokens aquí cuando tengas las direcciones reales
      }).filter(addr => addr.startsWith('0x'));

      const balances = await blockchainService.getTokenBalances(address, tokenAddresses);
      setTokenBalances(balances);

      // Cargar historial de transacciones
      const transactions = await blockchainService.getTransactionHistory(address, 50);
      
      // Convertir transacciones relevantes en inversiones
      const investmentData: Investment[] = transactions
        .filter(tx => tx.to && tx.to.toLowerCase() !== address.toLowerCase())
        .slice(0, 10)
        .map(tx => ({
          token: 'ETH',
          symbol: 'ETH',
          amount: tx.value,
          value: parseFloat(tx.value) * 2500, // Precio aproximado (actualizar con precio real)
          timestamp: tx.timestamp,
          txHash: tx.hash,
        }));

      setInvestments(investmentData);

      // Calcular valor total del portafolio
      const ethValue = parseFloat(ethBalance) * 2500;
      const tokenValue = balances.reduce((sum, token) => {
        return sum + (token.usdValue || 0);
      }, 0);
      setTotalPortfolioValue(ethValue + tokenValue);

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Error al cargar datos del perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const openExplorer = (hash: string) => {
    window.open(`https://sepolia.arbiscan.io/tx/${hash}`, '_blank');
  };

  if (!address) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Conecta tu billetera para ver tu perfil</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Perfil */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Perfil</h2>
              <p className="text-gray-600 dark:text-gray-400">{formatAddress(address)}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open(`https://sepolia.arbiscan.io/address/${address}`, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Ver en Arbiscan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Balance ETH</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {parseFloat(ethBalance).toFixed(4)} ETH
            </p>
            <p className="text-sm text-gray-500">
              ${(parseFloat(ethBalance) * 2500).toFixed(2)} USD
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Valor Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${totalPortfolioValue.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Portfolio completo</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Coins className="w-4 h-4" />
              <span className="text-sm">Tokens</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {tokenBalances.length + 1}
            </p>
            <p className="text-sm text-gray-500">Activos en cartera</p>
          </div>
        </div>
      </Card>

      {/* Mis Tokens */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Mis Activos
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando activos...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* ETH */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  ETH
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Ethereum</p>
                  <p className="text-sm text-gray-500">ETH</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {parseFloat(ethBalance).toFixed(4)}
                </p>
                <p className="text-sm text-gray-500">
                  ${(parseFloat(ethBalance) * 2500).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Otros tokens */}
            {tokenBalances.map((token) => (
              <div
                key={token.address}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {token.symbol.substring(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{token.name}</p>
                    <p className="text-sm text-gray-500">{token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {parseFloat(token.balance).toFixed(4)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {token.usdValue ? `$${token.usdValue.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            ))}

            {tokenBalances.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No se encontraron tokens adicionales
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Inversiones a través del fondo */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Inversiones en el Fondo
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando inversiones...</p>
          </div>
        ) : investments.length > 0 ? (
          <div className="space-y-3">
            {investments.map((investment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Depósito de {investment.symbol}
                    </p>
                    <p className="text-sm text-gray-500">
                      {investment.timestamp.toLocaleDateString()} {investment.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {investment.amount} {investment.symbol}
                    </p>
                    <p className="text-sm text-gray-500">${investment.value.toFixed(2)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openExplorer(investment.txHash)}
                    className="gap-2"
                  >
                    Ver
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Aún no has realizado inversiones en el fondo</p>
            <p className="text-sm text-gray-400 mt-2">
              Usa la función de depósito para comenzar a invertir
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

