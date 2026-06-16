'use client';

import Link from 'next/link';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft } from 'lucide-react';

// Mock performance data
const METRICS = [
  { label: 'RMSE', value: 13.57, unit: 'cycles' },
  { label: 'MAE', value: 9.97, unit: 'cycles' },
  { label: 'NASA Score', value: 782, unit: 'points' },
];

const TRAINING_DATA = [
  { epoch: 1, train_loss: 450, val_loss: 420 },
  { epoch: 5, train_loss: 320, val_loss: 350 },
  { epoch: 10, train_loss: 280, val_loss: 310 },
  { epoch: 15, train_loss: 210, val_loss: 270 },
  { epoch: 20, train_loss: 180, val_loss: 250 },
  { epoch: 25, train_loss: 150, val_loss: 240 },
  { epoch: 30, train_loss: 130, val_loss: 235 },
  { epoch: 35, train_loss: 110, val_loss: 232 },
  { epoch: 40, train_loss: 95, val_loss: 230 },
  { epoch: 45, train_loss: 85, val_loss: 228 },
];

const PREDICTION_DATA = [
  { actual: 120, predicted: 118 },
  { actual: 100, predicted: 102 },
  { actual: 80, predicted: 82 },
  { actual: 60, predicted: 58 },
  { actual: 40, predicted: 42 },
  { actual: 20, predicted: 22 },
  { actual: 0, predicted: 2 },
  { actual: 95, predicted: 93 },
  { actual: 75, predicted: 77 },
  { actual: 50, predicted: 48 },
  { actual: 30, predicted: 32 },
  { actual: 10, predicted: 12 },
];

const MODEL_COMPARISON = [
  { name: 'SimpleRNN', rmse: 15.9, mae: 11.22, color: '#ef4444' },
  { name: 'GRU', rmse: 13.57, mae: 9.97, color: '#10b981' },
  { name: 'LSTM', rmse: 13.71, mae: 10.26, color: '#f59e0b' },
  { name: 'LSTM+Att', rmse: 14.52, mae: 10.33, color: '#8b5cf6' },
];

export default function PerformancePage() {
  return (
    <main className="min-h-screen bg-aerospace-darker p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-aerospace-accent hover:text-aerospace-accent/80 transition mb-4">
            <ArrowLeft size={20} />
            Back to Fleet
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Model Performance</h1>
          <p className="text-gray-400">LSTM + Attention architecture evaluation on NASA CMAPSS FD001</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {METRICS.map((metric) => (
            <div key={metric.label} className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">{metric.label}</div>
              <div className="text-3xl font-bold text-aerospace-accent mb-1">{metric.value}</div>
              <div className="text-xs text-gray-500">{metric.unit}</div>
            </div>
          ))}
        </div>

        {/* Model Comparison */}
        <div className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Architecture Comparison</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">RMSE by Model</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={MODEL_COMPARISON}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0f1e',
                      border: '1px solid #00d4ff',
                      borderRadius: '4px',
                    }}
                  />
                  <Bar dataKey="rmse" fill="#00d4ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">MAE by Model</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={MODEL_COMPARISON}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0f1e',
                      border: '1px solid #00d4ff',
                      borderRadius: '4px',
                    }}
                  />
                  <Bar dataKey="mae" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Training History */}
        <div className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Training History</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={TRAINING_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="epoch" stroke="#888" label={{ value: 'Epoch', position: 'insideBottomRight', offset: -5 }} />
              <YAxis stroke="#888" label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0f1e',
                  border: '1px solid #00d4ff',
                  borderRadius: '4px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="train_loss" stroke="#00d4ff" name="Training Loss" strokeWidth={2} />
              <Line type="monotone" dataKey="val_loss" stroke="#f59e0b" name="Validation Loss" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Predicted vs Actual */}
        <div className="bg-aerospace-dark border border-aerospace-accent/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Predicted vs Actual RUL</h2>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="actual" stroke="#888" name="Actual RUL" label={{ value: 'Actual RUL (cycles)', position: 'insideBottomRight', offset: -5 }} />
              <YAxis stroke="#888" name="Predicted RUL" label={{ value: 'Predicted RUL (cycles)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0f1e',
                  border: '1px solid #00d4ff',
                  borderRadius: '4px',
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter name="Predictions" data={PREDICTION_DATA} fill="#00d4ff" />
              {/* Perfect prediction line */}
              <Line type="monotone" dataKey="actual" stroke="#888" name="Perfect Prediction" strokeDasharray="5 5" />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-400">
            <p>59% of predictions within ±10 cycles | 92% within ±25 cycles</p>
          </div>
        </div>
      </div>
    </main>
  );
}
