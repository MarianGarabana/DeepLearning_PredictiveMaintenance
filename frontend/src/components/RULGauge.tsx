'use client';

import React, { useEffect, useState } from 'react';
import { Gauge, AlertCircle } from 'lucide-react';

interface RULGaugeProps {
  rul: number;
  ciLower?: number;
  ciUpper?: number;
  animate?: boolean;
}

export function RULGauge({ rul, ciLower, ciUpper, animate = true }: RULGaugeProps) {
  const [displayRul, setDisplayRul] = useState(0);
  const maxRul = 125;
  const percentage = Math.min((displayRul / maxRul) * 100, 100);

  // Determine status color
  const getColor = (value: number) => {
    if (value < 30) return 'text-red-500';
    if (value < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getGaugeColor = (value: number) => {
    if (value < 30) return '#ef4444';
    if (value < 80) return '#f59e0b';
    return '#10b981';
  };

  const getStatusText = (value: number) => {
    if (value < 30) return 'CRITICAL';
    if (value < 80) return 'WARNING';
    return 'OK';
  };

  useEffect(() => {
    if (!animate) {
      setDisplayRul(rul);
      return;
    }

    const start = displayRul;
    const diff = rul - start;
    const steps = Math.abs(diff) > 50 ? 30 : 15;
    const increment = diff / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayRul(rul);
        clearInterval(timer);
      } else {
        setDisplayRul(start + increment * step);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [rul, animate, displayRul]);

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* SVG Gauge */}
      <div className="relative w-64 h-64">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Background arc */}
          <circle cx="100" cy="100" r="85" fill="none" stroke="#1e3a5f" strokeWidth="8" />

          {/* Gauge arc (colored based on value) */}
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke={getGaugeColor(displayRul)}
            strokeWidth="8"
            strokeDasharray={`${(percentage / 100) * 534} 534`}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '100px 100px',
              transition: animate ? 'stroke-dasharray 0.3s ease' : 'none',
            }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100, 125].map((val) => {
            const angle = (val / 125) * 180;
            const rad = ((angle - 90) * Math.PI) / 180;
            const x1 = 100 + 85 * Math.cos(rad);
            const y1 = 100 + 85 * Math.sin(rad);
            const x2 = 100 + 95 * Math.cos(rad);
            const y2 = 100 + 95 * Math.sin(rad);
            return (
              <g key={val}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#666" strokeWidth="1" />
                <text
                  x={100 + 110 * Math.cos(rad)}
                  y={100 + 110 * Math.sin(rad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-400"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Center circle */}
          <circle cx="100" cy="100" r="15" fill="#0a0f1e" stroke="#00d4ff" strokeWidth="2" />

          {/* Needle */}
          <g>
            <line
              x1="100"
              y1="100"
              x2={100 + 65 * Math.cos(((percentage / 100) * 180 - 90) * (Math.PI / 180))}
              y2={100 + 65 * Math.sin(((percentage / 100) * 180 - 90) * (Math.PI / 180))}
              stroke={getGaugeColor(displayRul)}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                transition: animate ? 'stroke 0.3s ease' : 'none',
              }}
            />
          </g>
        </svg>
      </div>

      {/* Display values */}
      <div className="text-center">
        <div className={`text-5xl font-bold ${getColor(displayRul)} mb-2`}>
          {displayRul.toFixed(1)}
        </div>
        <div className="text-gray-400 text-sm mb-2">Cycles Remaining</div>
        <div className={`inline-block px-4 py-2 rounded-full font-bold ${
          getStatusText(displayRul) === 'OK'
            ? 'bg-green-500/20 text-green-400'
            : getStatusText(displayRul) === 'WARNING'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {getStatusText(displayRul)}
        </div>
      </div>

      {/* Confidence interval */}
      {ciLower !== undefined && ciUpper !== undefined && (
        <div className="text-xs text-gray-400 text-center">
          <div className="flex items-center gap-1 justify-center mb-1">
            <AlertCircle size={14} />
            <span>95% Confidence Interval</span>
          </div>
          <div>{ciLower.toFixed(1)} — {ciUpper.toFixed(1)} cycles</div>
        </div>
      )}
    </div>
  );
}
