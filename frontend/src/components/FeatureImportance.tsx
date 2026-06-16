'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SensorImportance } from '@/lib/types';

interface FeatureImportanceProps {
  sensors: SensorImportance[];
  title?: string;
}

export function FeatureImportance({ sensors, title = 'Top Sensor Drivers' }: FeatureImportanceProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Transform sensor importance data for Recharts
    const chartData = sensors
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
      .map((sensor) => ({
        name: sensor.name,
        importance: Math.round(sensor.importance * 10000) / 10000,
      }));
    setData(chartData);
  }, [sensors]);

  return (
    <div className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      {data.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No sensor data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis type="number" stroke="#888" />
            <YAxis dataKey="name" type="category" stroke="#888" width={95} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0f1e',
                border: '1px solid #00d4ff',
                borderRadius: '4px',
              }}
              formatter={(value) => value.toFixed(4)}
            />
            <Bar dataKey="importance" fill="#00d4ff" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
