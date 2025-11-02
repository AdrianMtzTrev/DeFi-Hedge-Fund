import { Card } from './ui/card';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

interface PoolStatsProps {
  totalValueLocked: number;
  totalUsers: number;
  currentAPY: number;
  monthlyYield: number;
}

export function PoolStats({ totalValueLocked, totalUsers, currentAPY, monthlyYield }: PoolStatsProps) {
  const stats = [
    {
      title: 'Total Value Locked',
      value: `$${totalValueLocked.toLocaleString()}`,
      icon: DollarSign,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-white dark:bg-gray-800'
    },
    {
      title: 'Active Users',
      value: totalUsers.toLocaleString(),
      icon: Users,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-white dark:bg-gray-800'
    },
    {
      title: 'Current APY',
      value: `${currentAPY.toFixed(2)}%`,
      icon: TrendingUp,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-white dark:bg-gray-800'
    },
    {
      title: 'Monthly Yield',
      value: `$${monthlyYield.toLocaleString()}`,
      icon: Activity,
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
      iconBg: 'bg-white dark:bg-gray-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={`p-6 ${stat.bgColor} ${stat.borderColor}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{stat.title}</p>
                <p className={`${stat.iconColor}`}>{stat.value}</p>
              </div>
              <div className={`p-3 ${stat.iconColor} ${stat.iconBg} rounded-lg`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
