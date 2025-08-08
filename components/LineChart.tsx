import React from 'react';
import { useLocalization } from '../services/localization';

interface LineChartProps {
  data: { name: string; value: number }[];
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const { formatCurrency } = useLocalization();

  const width = 500;
  const height = 250;
  const padding = 30;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const xScale = width / (data.length - 1);
  const yScale = (height - padding * 2) / maxValue;

  const points = data.map((d, i) => `${i * xScale},${height - padding - d.value * yScale}`).join(' ');
  const areaPoints = `0,${height - padding} ${points} ${width},${height-padding}`;

  return (
    <div className="w-full h-64">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Y-axis labels */}
        <text x={padding - 10} y={padding} textAnchor="end" className="text-xs fill-brand-gray-400">{formatCurrency(maxValue)}</text>
        <text x={padding - 10} y={height - padding} textAnchor="end" className="text-xs fill-brand-gray-400">{formatCurrency(0)}</text>

        {/* Gradient for area fill */}
        <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cce135" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#cce135" stopOpacity="0" />
            </linearGradient>
        </defs>
        
        {/* Area fill */}
        <polyline points={areaPoints} fill="url(#areaGradient)" />

        {/* Line */}
        <polyline points={points} fill="none" stroke="#b8c92e" strokeWidth="2" />
        
        {/* Data points and labels */}
        {data.map((d, i) => (
            <g key={i}>
                 <circle cx={i * xScale} cy={height - padding - d.value * yScale} r="3" fill="#b8c92e" />
                <text x={i * xScale} y={height - padding + 15} textAnchor="middle" className="text-xs fill-brand-gray-500 dark:fill-brand-gray-400 font-medium">
                    {d.name}
                </text>
            </g>
        ))}
      </svg>
    </div>
  );
};
