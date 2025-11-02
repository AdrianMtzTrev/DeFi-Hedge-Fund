import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp } from 'lucide-react';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'yield';
  amount: number;
  timestamp: Date;
  hash?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownToLine className="w-4 h-4" />;
      case 'withdraw':
        return <ArrowUpFromLine className="w-4 h-4" />;
      case 'yield':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'withdraw':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'yield':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="p-6">
      <h2 className="text-gray-900 dark:text-gray-100 mb-4">Transaction History</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No transactions yet
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(transaction.type)}`}>
                    {getIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-gray-100 capitalize">{transaction.type}</p>
                    <p className="text-gray-500 dark:text-gray-400">{formatDate(transaction.timestamp)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`${transaction.type === 'withdraw' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                    {transaction.type === 'withdraw' ? '-' : '+'}${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {transaction.hash && (
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${transaction.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                    >
                      {transaction.hash.substring(0, 6)}...{transaction.hash.substring(transaction.hash.length - 4)}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
