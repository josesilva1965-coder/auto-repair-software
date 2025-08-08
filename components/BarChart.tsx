
import React from 'react';
import { useLocalization } from '../services/localization';

interface BarChartProps {
  data: { name: string; value: number }[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const { formatCurrency } = useLocalization();
  const maxValue = Math.max(...data.map(item => item.value), 1); // Avoid division by zero

  return (
    <div className="w-full h-64 flex items-end space-x-2 rtl:space-x-reverse">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center group">
          <div className="w-full h-full flex items-end">
            <div
              className="w-full bg-brand-blue/20 dark:bg-blue-500/30 rounded-t-md hover:bg-brand-blue/40 dark:hover:bg-blue-500/50 transition-all duration-300"
              style={{
                height: `${(item.value / maxValue) * 100}%`,
                minHeight: item.value > 0 ? '2px' : '0px'
              }}
            >
              <div className="text-center text-xs font-bold text-white bg-brand-blue/80 dark:bg-blue-900/80 rounded-md py-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-8">
                {formatCurrency(item.value)}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-brand-gray-500 dark:text-brand-gray-400 font-medium">
            {item.name}
          </div>
        </div>
      ))}
    </div>
  );
};
