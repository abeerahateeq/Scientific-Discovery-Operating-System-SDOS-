import React, { useState, useMemo } from 'react';
import { SpssVariable } from '../../types';
import { Calculator, BarChart2, TrendingUp, AlertTriangle, CheckCircle2, Filter, Layers } from 'lucide-react';

interface SpssQuickStatsProps {
  variables: SpssVariable[];
  rows: Record<string, any>[];
  datasetTitle?: string;
}

export interface NumericVariableStats {
  name: string;
  label: string;
  validCount: number;
  missingCount: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
}

export default function SpssQuickStats({ variables, rows, datasetTitle }: SpssQuickStatsProps) {
  const [selectedVarName, setSelectedVarName] = useState<string>('all');

  // Compute stats for all numeric columns
  const numericStats = useMemo(() => {
    const stats: NumericVariableStats[] = [];

    // Identify numeric variables or columns with numeric content
    variables.forEach((v) => {
      const isExplicitNumeric = v.type === 'Numeric' || v.measure === 'Scale';
      
      // Extract values for this variable (check both v.name and v.label)
      const rawValues = rows.map((r) => {
        if (r[v.name] !== undefined) return r[v.name];
        if (r[v.label] !== undefined) return r[v.label];
        return undefined;
      });

      // Filter numeric values and count missings
      let missingCount = 0;
      const validNumbers: number[] = [];

      rawValues.forEach((val) => {
        if (val === undefined || val === null || val === '' || isNaN(Number(val))) {
          missingCount++;
        } else {
          validNumbers.push(Number(val));
        }
      });

      // Only include if it's explicitly numeric or has valid numbers
      if (isExplicitNumeric || validNumbers.length > 0) {
        if (validNumbers.length === 0) {
          stats.push({
            name: v.name,
            label: v.label || v.name,
            validCount: 0,
            missingCount,
            mean: 0,
            median: 0,
            stdDev: 0,
            variance: 0,
            min: 0,
            max: 0,
            range: 0,
          });
        } else {
          const n = validNumbers.length;
          const sum = validNumbers.reduce((acc, curr) => acc + curr, 0);
          const mean = sum / n;

          // Median calculation
          const sorted = [...validNumbers].sort((a, b) => a - b);
          const mid = Math.floor(n / 2);
          const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

          // Variance and Standard Deviation (Sample formula: sum((x - mean)^2) / (n - 1))
          const variance =
            n > 1
              ? validNumbers.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (n - 1)
              : 0;
          const stdDev = Math.sqrt(variance);

          const min = sorted[0];
          const max = sorted[sorted.length - 1];
          const range = max - min;

          stats.push({
            name: v.name,
            label: v.label || v.name,
            validCount: n,
            missingCount,
            mean,
            median,
            stdDev,
            variance,
            min,
            max,
            range,
          });
        }
      }
    });

    return stats;
  }, [variables, rows]);

  const displayedStats = useMemo(() => {
    if (selectedVarName === 'all') return numericStats;
    return numericStats.filter((s) => s.name === selectedVarName);
  }, [numericStats, selectedVarName]);

  const totalMissingAcrossDataset = numericStats.reduce((sum, s) => sum + s.missingCount, 0);

  return (
    <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-md">
      {/* Header with Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Quick Stats Summary Widget
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                {numericStats.length} Numeric Variables
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">
              Auto-calculated central tendency, dispersion, and data completeness metrics for ingested cases (N = {rows.length}).
            </p>
          </div>
        </div>

        {/* Variable Filter Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#07080A] border border-slate-800 rounded-lg px-2.5 py-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedVarName}
              onChange={(e) => setSelectedVarName(e.target.value)}
              className="bg-transparent text-slate-200 text-[11px] font-mono focus:outline-none cursor-pointer"
            >
              <option value="all">All Numeric Variables ({numericStats.length})</option>
              {numericStats.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.label})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dataset Completeness Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <div className="p-2 rounded-lg bg-[#07080A] border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Total Cases (N):</span>
          <span className="text-white font-bold">{rows.length}</span>
        </div>
        <div className="p-2 rounded-lg bg-[#07080A] border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Numeric Measures:</span>
          <span className="text-indigo-400 font-bold">{numericStats.length}</span>
        </div>
        <div className="p-2 rounded-lg bg-[#07080A] border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Total Missing Values:</span>
          <span className={`font-bold ${totalMissingAcrossDataset > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {totalMissingAcrossDataset}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-[#07080A] border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Data Integrity:</span>
          <span className="text-emerald-400 font-bold">
            {rows.length > 0 ? `${Math.round(((rows.length * variables.length - totalMissingAcrossDataset) / (rows.length * variables.length || 1)) * 100)}%` : '100%'}
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      {displayedStats.length === 0 ? (
        <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
          No numeric variables detected in this dataset. Upload or inspect columns to configure.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedStats.map((stat) => (
            <div
              key={stat.name}
              className="bg-[#07080A] border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 flex flex-col gap-2.5 transition-all shadow-sm group"
            >
              {/* Card Title & Label */}
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                      {stat.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400">
                      Scale
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans line-clamp-1 mt-0.5">
                    {stat.label}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    stat.missingCount === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {stat.missingCount === 0 ? '100% Valid' : `${stat.missingCount} Missing`}
                  </span>
                </div>
              </div>

              {/* Central Tendency & Dispersion Matrix */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">Mean (x̄)</span>
                  <span className="text-white font-bold text-xs mt-0.5">
                    {stat.mean.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">Median (M)</span>
                  <span className="text-indigo-300 font-bold text-xs mt-0.5">
                    {stat.median.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">Std. Deviation (s)</span>
                  <span className="text-emerald-400 font-bold text-xs mt-0.5">
                    {stat.stdDev.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">Missing Cases</span>
                  <span className={`font-bold text-xs mt-0.5 ${stat.missingCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {stat.missingCount} <span className="text-[9px] text-slate-500 font-normal">/ {rows.length}</span>
                  </span>
                </div>
              </div>

              {/* Min, Max, Range Bar */}
              <div className="bg-slate-950 p-2 rounded border border-slate-900 text-[10px] font-mono flex items-center justify-between text-slate-400">
                <span>Min: <b className="text-slate-200">{stat.min.toFixed(2)}</b></span>
                <span>Max: <b className="text-slate-200">{stat.max.toFixed(2)}</b></span>
                <span>Range: <b className="text-slate-200">{stat.range.toFixed(2)}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
