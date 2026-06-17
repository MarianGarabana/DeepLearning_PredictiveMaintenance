import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import styles from './SensorChart.module.css';

export interface Series {
  key: string;
  name: string;
  color: string;
}

interface SensorChartProps {
  data: Array<Record<string, number>>;
  series: Series[];
  xKey?: string;
  xLabel?: string;
  height?: number;
  title?: string;
  yDomain?: [number | 'auto', number | 'auto'];
}

const AXIS = '#5f6e83';
const GRID = 'rgba(120,150,190,0.12)';

export function SensorChart({
  data,
  series,
  xKey = 'cycle',
  xLabel,
  height = 240,
  title,
  yDomain,
}: SensorChartProps) {
  return (
    <div className={styles.card}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey={xKey}
              stroke={AXIS}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              label={
                xLabel
                  ? { value: xLabel, position: 'insideBottom', offset: -2, fill: AXIS, fontSize: 11 }
                  : undefined
              }
            />
            <YAxis
              stroke={AXIS}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              domain={yDomain ?? ['auto', 'auto']}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: '#11161f',
                border: '1px solid rgba(120,150,190,0.28)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#9aa9bd' }}
              itemStyle={{ fontFamily: 'var(--font-mono)' }}
              labelFormatter={(v) => `Cycle ${v}`}
            />
            {series.length > 1 && (
              <Legend wrapperStyle={{ fontSize: 12, color: '#9aa9bd' }} iconType="plainline" />
            )}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
