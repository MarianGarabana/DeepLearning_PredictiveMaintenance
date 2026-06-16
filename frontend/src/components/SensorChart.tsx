'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SensorChartProps {
  sensors: number[][];
  title?: string;
  maxCycles?: number;
}

const SENSOR_NAMES = [
  'T24', 'T30', 'T50', 'P24', 'P30', 'P50', 'Ps30', 'Phi', 'NC', 'ND',
  'Nf', 'NRf', 'NRc', 'BPR', 'farB', 'htBleed', 'Nf_dmd', 'PCNfR_dmd',
  'W31', 'W32', 'DSM'
];

export function SensorChart({ sensors, title = 'Sensor Time Series (Last 30 Cycles)', maxCycles = 30 }: SensorChartProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!sensors || sensors.length === 0) {
      setData([]);
      return;
    }

    // Transform sensor data for Recharts
    const chartData = sensors.slice(-maxCycles).map((sensorRow, idx) => {
      const point: any = { cycle: idx + 1 };
      // Include first 5 sensors for readability
      [0, 1, 2, 5, 10].forEach((sensorIdx) => {
        if (sensorIdx < sensorRow.length) {
          point[SENSOR_NAMES[sensorIdx]] = Math.round(sensorRow[sensorIdx] * 100) / 100;
        }
      });
      return point;
    });
    setData(chartData);
  }, [sensors, maxCycles]);

  return (
    <div className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      {data.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No sensor data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="cycle" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0f1e',
                border: '1px solid #00d4ff',
                borderRadius: '4px',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line type="monotone" dataKey="T24" stroke="#00d4ff" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="T30" stroke="#f59e0b" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="T50" stroke="#10b981" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="P24" stroke="#8b5cf6" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="NC" stroke="#ec4899" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
