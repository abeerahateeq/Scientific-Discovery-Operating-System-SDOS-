import React from 'react';
import { SpssVariable } from '../../types';
import { Table, Hash, Type, AlertCircle, ArrowUpRight, FileSpreadsheet, Eye } from 'lucide-react';

interface SpssDataPreviewProps {
  variables: SpssVariable[];
  rows: Record<string, any>[];
  datasetTitle?: string;
  onOpenFullDataView?: () => void;
}

export default function SpssDataPreview({
  variables,
  rows,
  datasetTitle,
  onOpenFullDataView
}: SpssDataPreviewProps) {
  // Extract strictly the first 10 rows
  const previewRows = rows.slice(0, 10);

  return (
    <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Ingested Dataset Preview (First 10 Cases)
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                Showing Rows 1–{previewRows.length} of {rows.length}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">
              Verified dataset preview matrix with detected column data types.
            </p>
          </div>
        </div>

        {onOpenFullDataView && (
          <button
            onClick={onOpenFullDataView}
            className="text-[11px] font-mono px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Open Full Data View ({rows.length} Cases)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table Pane */}
      {previewRows.length === 0 ? (
        <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
          No data rows currently loaded. Upload a CSV or run BloxBot auto-runner.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-[360px]">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 shadow-sm z-10">
              <tr>
                <th className="p-2.5 text-slate-500 w-12 border-r border-slate-800 text-center font-bold">
                  #
                </th>
                {variables.map((v, idx) => (
                  <th key={idx} className="p-2.5 text-slate-200 border-r border-slate-800 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-bold">
                      {v.type === 'Numeric' ? (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">123</span>
                      ) : (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">Abc</span>
                      )}
                      <span>{v.name}</span>
                    </div>
                    <span className="block text-[9.5px] text-slate-400 font-normal font-sans line-clamp-1 mt-0.5">
                      {v.label || v.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-2 text-slate-500 border-r border-slate-800 text-center font-bold bg-slate-950/40">
                    {rIdx + 1}
                  </td>
                  {variables.map((v, cIdx) => {
                    const rawVal = row[v.name] !== undefined ? row[v.name] : row[v.label];
                    const isMissing = rawVal === undefined || rawVal === null || rawVal === '';

                    return (
                      <td
                        key={cIdx}
                        className={`p-2 border-r border-slate-800 whitespace-nowrap ${
                          isMissing ? 'text-amber-500/80 italic bg-amber-950/10' : 'text-slate-300'
                        }`}
                      >
                        {isMissing ? 'NaN / Missing' : String(rawVal)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
        <span>
          Columns Profiled: <b className="text-slate-300">{variables.length}</b>
        </span>
        <span>
          Showing top <b className="text-indigo-400">{previewRows.length}</b> records • Remaining: <b className="text-slate-300">{Math.max(0, rows.length - previewRows.length)}</b> rows
        </span>
      </div>
    </div>
  );
}
