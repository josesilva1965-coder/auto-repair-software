import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '../Icon';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  chartData: number[];
}

const MiniBarChart: React.FC<{ data: number[] }> = ({ data }) => {
    const maxValue = Math.max(...data, 1);
    return (
        <div className="flex items-end h-8 w-20 gap-px">
            {data.map((value, index) => (
                <div key={index} 
                     className="flex-1 bg-brand-lime/50 rounded-sm"
                     style={{ height: `${(value / maxValue) * 100}%` }}
                />
            ))}
        </div>
    );
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType, chartData }) => {
  const changeColor = changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const ChangeIcon = changeType === 'increase' ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="bg-white dark:bg-brand-gray-800 p-4 rounded-xl shadow-sm hover:shadow-lg dark:hover:shadow-brand-gray-900/50 transition-all duration-300 border border-brand-gray-200 dark:border-brand-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="text-right">
            <p className="text-sm font-medium text-brand-gray-500 dark:text-brand-gray-400 truncate">{title}</p>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
            <p className="text-3xl font-semibold text-brand-gray-900 dark:text-brand-gray-100">{value}</p>
            {changeType !== 'neutral' && (
              <div className={`mt-1 flex items-center text-xs font-medium ${changeColor}`}>
                  <ChangeIcon className="h-4 w-4 mr-1" />
                  <span>{change}</span>
              </div>
            )}
        </div>
        <div className="flex-shrink-0">
            {chartData.length > 0 && <MiniBarChart data={chartData} />}
        </div>
      </div>
    </div>
  );
};