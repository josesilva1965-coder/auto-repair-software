import React from 'react';

interface PieChartProps {
  data: { name: string; value: number; color: string }[];
}

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  if (totalValue === 0) {
    return <p className="text-center text-brand-gray-500 dark:text-brand-gray-400 py-16">No data for selected period</p>;
  }
  
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius
  let offset = 0;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="10" className="text-brand-gray-200 dark:text-brand-gray-700" />
          {data.map((item, index) => {
            const percentage = (item.value / totalValue);
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const strokeDashoffset = -offset;
            offset += percentage * circumference;
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={item.color}
                strokeWidth="10"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
      </div>
      <div className="flex-shrink-0 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center text-sm">
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="font-medium text-brand-gray-700 dark:text-brand-gray-300">{item.name}:</span>
            <span className="ml-1 text-brand-gray-500 dark:text-brand-gray-400">{item.value} ({((item.value / totalValue) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};