'use client';

import React, { useState } from 'react';
import { Sliders } from 'lucide-react';

const PREVENTIVE_COST = 35000;
const FAILURE_COST = 500000;
const MAINTENANCE_INTERVAL = 20; // cycles

interface WhatIfAnalyzerProps {
  currentRul?: number;
}

export function WhatIfAnalyzer({ currentRul = 50 }: WhatIfAnalyzerProps) {
  const [scenario1Rul, setScenario1Rul] = useState(40);
  const [scenario2Rul, setScenario2Rul] = useState(60);

  const calculateCost = (maintenanceRul: number, failureRul: number = 0) => {
    // If we don't perform maintenance and RUL drops below 0, we have a failure
    const requiresMaintenance = maintenanceRul > 0;
    const costIfFail = requiresMaintenance ? PREVENTIVE_COST : FAILURE_COST;
    return costIfFail;
  };

  const cost1 = calculateCost(scenario1Rul);
  const cost2 = calculateCost(scenario2Rul);
  const savings = FAILURE_COST - Math.min(cost1, cost2);

  return (
    <div className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sliders size={20} className="text-aerospace-accent" />
        <h3 className="text-xl font-bold text-white">What-If Cost Analyzer</h3>
      </div>

      <div className="space-y-8">
        {/* Scenario 1 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-white">Scenario A: Maintenance at {scenario1Rul} cycles RUL</label>
            <span className="text-2xl font-bold text-aerospace-accent">{scenario1Rul}</span>
          </div>
          <input
            type="range"
            min="0"
            max="125"
            value={scenario1Rul}
            onChange={(e) => setScenario1Rul(parseInt(e.target.value))}
            className="w-full h-2 bg-aerospace-dark rounded-lg appearance-none cursor-pointer accent-aerospace-accent"
          />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 mb-1">Cost if performed:</div>
              <div className="text-green-400 font-bold">${PREVENTIVE_COST.toLocaleString()}</div>
            </div>
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 mb-1">Cost if not performed:</div>
              <div className="text-red-400 font-bold">${FAILURE_COST.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-aerospace-accent/20"></div>

        {/* Scenario 2 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-white">Scenario B: Maintenance at {scenario2Rul} cycles RUL</label>
            <span className="text-2xl font-bold text-aerospace-accent">{scenario2Rul}</span>
          </div>
          <input
            type="range"
            min="0"
            max="125"
            value={scenario2Rul}
            onChange={(e) => setScenario2Rul(parseInt(e.target.value))}
            className="w-full h-2 bg-aerospace-dark rounded-lg appearance-none cursor-pointer accent-aerospace-accent"
          />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 mb-1">Cost if performed:</div>
              <div className="text-green-400 font-bold">${PREVENTIVE_COST.toLocaleString()}</div>
            </div>
            <div className="bg-black/40 rounded p-3">
              <div className="text-gray-400 mb-1">Cost if not performed:</div>
              <div className="text-red-400 font-bold">${FAILURE_COST.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-aerospace-accent/20 pt-6">
          <div className="bg-aerospace-accent/10 border border-aerospace-accent/30 rounded-lg p-4">
            <div className="text-sm text-gray-300 mb-2">Optimal Strategy:</div>
            <div className="text-2xl font-bold text-aerospace-accent mb-3">
              Perform maintenance when RUL ≤ {Math.min(scenario1Rul, scenario2Rul)} cycles
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-400">Expected Cost:</div>
                <div className="text-lg font-bold text-green-400">${Math.min(cost1, cost2).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Potential Savings:</div>
                <div className="text-lg font-bold text-aerospace-accent">${savings.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
