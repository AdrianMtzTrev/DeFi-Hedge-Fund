import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface UserPortfolioProps {
  depositedAmount: number;
  currentValue: number;
  totalEarnings: number;
  apy: number;
}

export function UserPortfolio({ depositedAmount, currentValue, totalEarnings, apy }: UserPortfolioProps) {
  const percentageGain = depositedAmount > 0 ? ((currentValue - depositedAmount) / depositedAmount) * 100 : 0;
  const isPositive = percentageGain >= 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-gray-900 dark:text-gray-100">Your Portfolio</h2>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Total Balance</p>
          <p className="text-gray-900 dark:text-gray-100">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Deposited</p>
            <p className="text-gray-700 dark:text-gray-300">${depositedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Total Earnings</p>
            <div className="flex items-center gap-2">
              <p className={`${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${Math.abs(totalEarnings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 dark:text-gray-400">Performance</p>
            <p className={`${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}{percentageGain.toFixed(2)}%
            </p>
          </div>
          <Progress value={Math.min(Math.abs(percentageGain), 100)} className="h-2" />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">Current APY</p>
            <p className="text-green-600 dark:text-green-400">{apy.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
