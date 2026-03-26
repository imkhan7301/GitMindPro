import React, { useMemo } from 'react';

interface ActivityHeatmapProps {
  /** ISO date strings of activities (analyses, PR reviews, etc.) */
  dates: string[];
  /** Number of weeks to show (default: 20) */
  weeks?: number;
}

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const cellColor = (count: number): string => {
  if (count === 0) return '#1e1b4b10';
  if (count === 1) return '#4338ca40';
  if (count === 2) return '#4338ca70';
  if (count <= 4) return '#4338ca99';
  return '#4338cacc';
};

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ dates, weeks = 20 }) => {
  const { grid, monthLabels, totalCount, streak } = useMemo(() => {
    // Build a count map from dates
    const countMap: Record<string, number> = {};
    for (const d of dates) {
      const key = new Date(d).toISOString().slice(0, 10);
      countMap[key] = (countMap[key] || 0) + 1;
    }

    // Build grid: weeks × 7 days, ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const cols: { date: string; count: number; dayOfWeek: number }[][] = [];
    const labels: { text: string; col: number }[] = [];
    let lastMonth = -1;
    let currentDate = new Date(startDate);

    let col: { date: string; count: number; dayOfWeek: number }[] = [];
    let colIdx = 0;

    while (currentDate <= today) {
      const key = currentDate.toISOString().slice(0, 10);
      const month = currentDate.getMonth();
      const dow = currentDate.getDay();

      if (dow === 0 && col.length > 0) {
        cols.push(col);
        col = [];
        colIdx++;
      }

      if (dow === 0 && month !== lastMonth) {
        labels.push({ text: MONTHS[month], col: colIdx });
        lastMonth = month;
      }

      col.push({ date: key, count: countMap[key] || 0, dayOfWeek: dow });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (col.length > 0) cols.push(col);

    // Calculate streak
    let streakCount = 0;
    const checkDate = new Date(today);
    while (true) {
      const key = checkDate.toISOString().slice(0, 10);
      if (countMap[key]) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      grid: cols,
      monthLabels: labels,
      totalCount: dates.length,
      streak: streakCount,
    };
  }, [dates, weeks]);

  if (dates.length === 0) return null;

  const cellSize = 11;
  const cellGap = 2;
  const step = cellSize + cellGap;
  const svgWidth = grid.length * step + 30;
  const svgHeight = 7 * step + 20;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Activity</h3>
        <div className="flex items-center gap-4">
          {streak > 0 && (
            <span className="text-[10px] font-bold text-amber-400">
              🔥 {streak} day streak
            </span>
          )}
          <span className="text-[10px] text-slate-600">{totalCount} analyses</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="block">
          {/* Day labels */}
          {DAYS.map((label, i) => (
            label ? (
              <text
                key={`day-${i}`}
                x={0}
                y={i * step + 28}
                className="fill-slate-600"
                fontSize="9"
                fontFamily="monospace"
              >
                {label}
              </text>
            ) : null
          ))}

          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={`month-${i}`}
              x={m.col * step + 28}
              y={10}
              className="fill-slate-600"
              fontSize="9"
              fontFamily="monospace"
            >
              {m.text}
            </text>
          ))}

          {/* Cells */}
          {grid.map((week, wi) => (
            week.map(cell => (
              <rect
                key={cell.date}
                x={wi * step + 28}
                y={cell.dayOfWeek * step + 16}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={cellColor(cell.count)}
                className="transition-colors"
              >
                <title>{cell.date}: {cell.count} {cell.count === 1 ? 'analysis' : 'analyses'}</title>
              </rect>
            ))
          ))}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[9px] text-slate-600">Less</span>
        {[0, 1, 2, 3, 5].map(n => (
          <div
            key={n}
            className="w-[10px] h-[10px] rounded-sm"
            style={{ backgroundColor: cellColor(n) }}
          />
        ))}
        <span className="text-[9px] text-slate-600">More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
