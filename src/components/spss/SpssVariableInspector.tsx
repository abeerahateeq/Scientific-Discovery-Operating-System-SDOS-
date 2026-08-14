import React, { useState } from 'react';
import { SpssVariable } from '../../types';
import { Database, Edit3, Check, Sparkles, Sliders, Tag, Hash, Type, HelpCircle, Save } from 'lucide-react';

interface SpssVariableInspectorProps {
  variables: SpssVariable[];
  onUpdateVariables: (updatedVars: SpssVariable[]) => void;
  rows?: Record<string, any>[];
}

export default function SpssVariableInspector({
  variables,
  onUpdateVariables,
  rows = []
}: SpssVariableInspectorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempLabel, setTempLabel] = useState<string>('');
  const [tempMeasure, setTempMeasure] = useState<SpssVariable['measure']>('Scale');
  const [tempType, setTempType] = useState<SpssVariable['type']>('Numeric');
  const [tempDecimals, setTempDecimals] = useState<number>(2);

  const startEditing = (idx: number) => {
    setEditingIndex(idx);
    setTempLabel(variables[idx].label || variables[idx].name);
    setTempMeasure(variables[idx].measure || 'Scale');
    setTempType(variables[idx].type || 'Numeric');
    setTempDecimals(variables[idx].decimals ?? 2);
  };

  const saveEditing = (idx: number) => {
    const updated = [...variables];
    updated[idx] = {
      ...updated[idx],
      label: tempLabel.trim() || updated[idx].name,
      measure: tempMeasure,
      type: tempType,
      decimals: tempDecimals
    };
    onUpdateVariables(updated);
    setEditingIndex(null);
  };

  const autoDetectAllColumnTypes = () => {
    if (!rows || rows.length === 0) return;

    const detected: SpssVariable[] = variables.map((v) => {
      // Sample values from rows
      const values = rows
        .map((r) => r[v.name] !== undefined ? r[v.name] : r[v.label])
        .filter((x) => x !== undefined && x !== null && x !== '');

      const numericCount = values.filter((x) => typeof x === 'number' || (!isNaN(Number(x)) && x !== '')).length;
      const isPredominantlyNumeric = values.length > 0 && numericCount / values.length >= 0.8;

      const uniqueValues = new Set(values).size;
      const isCategorical = uniqueValues <= 5 || !isPredominantlyNumeric;

      return {
        ...v,
        type: isPredominantlyNumeric ? 'Numeric' : 'String',
        measure: isPredominantlyNumeric ? (isCategorical && uniqueValues <= 4 ? 'Nominal' : 'Scale') : 'Nominal',
        decimals: isPredominantlyNumeric ? (values.some((x) => String(x).includes('.')) ? 2 : 0) : 0,
      };
    });

    onUpdateVariables(detected);
  };

  return (
    <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Variable Inspector & Schema Definition
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                {variables.length} Columns Profiled
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">
              Auto-detects data types from ingested datasets. Edit custom variable labels, measurement levels, and formatting.
            </p>
          </div>
        </div>

        {/* Auto-detect button */}
        <button
          onClick={autoDetectAllColumnTypes}
          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Re-Detect Column Types</span>
        </button>
      </div>

      {/* Variables Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
              <th className="p-2.5 border-r border-slate-800">Variable Name</th>
              <th className="p-2.5 border-r border-slate-800">Auto-Detected Type</th>
              <th className="p-2.5 border-r border-slate-800">Measurement Scale</th>
              <th className="p-2.5 border-r border-slate-800">Defined Label</th>
              <th className="p-2.5 border-r border-slate-800">Decimals</th>
              <th className="p-2.5 border-r border-slate-800">Value Codes</th>
              <th className="p-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v, idx) => {
              const isEditing = editingIndex === idx;

              return (
                <tr
                  key={idx}
                  className={`border-b border-slate-800/50 transition-colors ${
                    isEditing ? 'bg-indigo-950/20' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Name */}
                  <td className="p-2.5 font-bold text-indigo-400 border-r border-slate-800">
                    <div className="flex items-center gap-1.5">
                      {v.type === 'Numeric' ? (
                        <Hash className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <Type className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{v.name}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="p-2.5 border-r border-slate-800">
                    {isEditing ? (
                      <select
                        value={tempType}
                        onChange={(e) => setTempType(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Numeric">Numeric</option>
                        <option value="String">String (Categorical)</option>
                        <option value="Date">Date</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.type === 'Numeric' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {v.type}
                      </span>
                    )}
                  </td>

                  {/* Measure */}
                  <td className="p-2.5 border-r border-slate-800">
                    {isEditing ? (
                      <select
                        value={tempMeasure}
                        onChange={(e) => setTempMeasure(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Scale">Scale (Continuous)</option>
                        <option value="Nominal">Nominal (Discrete)</option>
                        <option value="Ordinal">Ordinal (Ranked)</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.measure === 'Scale'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : v.measure === 'Nominal'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {v.measure}
                      </span>
                    )}
                  </td>

                  {/* Defined Label */}
                  <td className="p-2.5 border-r border-slate-800 text-slate-200">
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempLabel}
                        onChange={(e) => setTempLabel(e.target.value)}
                        placeholder="Enter descriptive label..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 font-sans"
                        autoFocus
                      />
                    ) : (
                      <span className="font-sans text-slate-300">
                        {v.label || <span className="text-slate-500 italic">No label defined</span>}
                      </span>
                    )}
                  </td>

                  {/* Decimals */}
                  <td className="p-2.5 border-r border-slate-800 text-slate-300">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        max={6}
                        value={tempDecimals}
                        onChange={(e) => setTempDecimals(Number(e.target.value))}
                        className="w-16 bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-[11px]"
                      />
                    ) : (
                      v.decimals ?? 0
                    )}
                  </td>

                  {/* Value Codes */}
                  <td className="p-2.5 border-r border-slate-800 text-[10px] text-slate-400">
                    {v.values && v.values.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {v.values.map((val, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            {val.code} = {val.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600">None</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-2.5 text-center">
                    {isEditing ? (
                      <button
                        onClick={() => saveEditing(idx)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(idx)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                        title="Edit variable label & properties"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-400" />
                        <span>Edit Label</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
