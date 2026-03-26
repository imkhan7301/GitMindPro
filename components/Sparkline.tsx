import React from 'react';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 80,
  height = 24,
  color = '#818cf8',
  className = '',
}) => {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Trend indicator: compare last to first
  const trending = values[values.length - 1] > values[0] ? '#34d399' : values[values.length - 1] < values[0] ? '#f87171' : color;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={trending}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on the latest value */}
      {(() => {
        const lastX = padding + ((values.length - 1) / (values.length - 1)) * (width - padding * 2);
        const lastY = height - padding - ((values[values.length - 1] - min) / range) * (height - padding * 2);
        return <circle cx={lastX} cy={lastY} r="2" fill={trending} />;
      })()}
    </svg>
  );
};

export default Sparkline;
