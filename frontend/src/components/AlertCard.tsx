'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AlertCardProps {
  rul: number;
  engineId: string;
  onDismiss?: () => void;
}

const PREVENTIVE_COST = 35000;
const FAILURE_COST = 500000;

export function AlertCard({ rul, engineId, onDismiss }: AlertCardProps) {
  if (rul >= 50) return null; // Only show if RUL < 50

  const savings = FAILURE_COST - PREVENTIVE_COST;
  const urgency = rul < 20 ? 'CRITICAL' : rul < 30 ? 'SEVERE' : 'HIGH';

  return (
    <div className="fixed bottom-8 right-8 max-w-md animate-slide-in">
      <div className={`border-l-4 rounded-lg p-6 backdrop-blur-sm ${
        urgency === 'CRITICAL'
          ? 'bg-red-900/20 border-red-500 shadow-lg shadow-red-500/20'
          : urgency === 'SEVERE'
          ? 'bg-orange-900/20 border-orange-500 shadow-lg shadow-orange-500/20'
          : 'bg-yellow-900/20 border-yellow-500 shadow-lg shadow-yellow-500/20'
      }`}>
        <div className="flex items-start gap-4">
          <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-1 ${
            urgency === 'CRITICAL' ? 'text-red-500' : urgency === 'SEVERE' ? 'text-orange-500' : 'text-yellow-500'
          }`} />
          <div className="flex-1">
            <h3 className="font-bold text-white mb-2">{urgency} ALERT: {engineId}</h3>
            <p className="text-sm text-gray-300 mb-4">RUL critically low: {rul.toFixed(1)} cycles remaining</p>
            
            <div className="bg-black/40 rounded p-3 mb-4 space-y-1 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Unplanned failure cost:</span>
                <span className="text-red-400 font-semibold">${FAILURE_COST.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Preventive maintenance:</span>
                <span className="text-green-400 font-semibold">${PREVENTIVE_COST.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-600 pt-1 mt-1 flex justify-between text-gray-200 font-bold">
                <span>Potential savings:</span>
                <span className="text-aerospace-accent">${savings.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-aerospace-accent text-aerospace-darker font-semibold rounded hover:bg-opacity-90 transition text-sm">
                Schedule Maintenance
              </button>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition text-sm"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
