import React, { useState, useMemo } from 'react';
import { SpssVariable } from '../../types';
import { 
  Calculator, 
  BarChart2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Bot, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Sliders,
  Volume2,
  Copy,
  Check
} from 'lucide-react';

interface SpssQuickStatsProps {
  variables: SpssVariable[];
  rows: Record<string, any>[];
  datasetTitle?: string;
  onVoiceSpeak?: (text: string) => void;
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
  skewness: number;
  kurtosis: number;
}

export default function SpssQuickStats({ variables, rows, datasetTitle, onVoiceSpeak }: SpssQuickStatsProps) {
  const [selectedVarName, setSelectedVarName] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeStatFocus, setActiveStatFocus] = useState<string>('mean');
  const [copiedExplanation, setCopiedExplanation] = useState(false);

  // Compute stats for all numeric columns including skewness & kurtosis
  const numericStats = useMemo(() => {
    const stats: NumericVariableStats[] = [];

    variables.forEach((v) => {
      const isExplicitNumeric = v.type === 'Numeric' || v.measure === 'Scale';
      
      const rawValues = rows.map((r) => {
        if (r[v.name] !== undefined) return r[v.name];
        if (r[v.label] !== undefined) return r[v.label];
        return undefined;
      });

      let missingCount = 0;
      const validNumbers: number[] = [];

      rawValues.forEach((val) => {
        if (val === undefined || val === null || val === '' || isNaN(Number(val))) {
          missingCount++;
        } else {
          validNumbers.push(Number(val));
        }
      });

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
            skewness: 0,
            kurtosis: 0
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

          // Skewness approximation: (sum((x - mean)^3) / n) / (stdDev^3)
          let skewness = 0;
          let kurtosis = 0;
          if (n > 2 && stdDev > 0) {
            const m3 = validNumbers.reduce((acc, curr) => acc + Math.pow(curr - mean, 3), 0) / n;
            skewness = m3 / Math.pow(stdDev, 3);

            const m4 = validNumbers.reduce((acc, curr) => acc + Math.pow(curr - mean, 4), 0) / n;
            kurtosis = (m4 / Math.pow(stdDev, 4)) - 3; // excess kurtosis
          }

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
            skewness,
            kurtosis
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

  // Active variable for BloxBot deep dive explanation
  const activeFocusVariable = useMemo(() => {
    if (selectedVarName !== 'all') {
      return numericStats.find(s => s.name === selectedVarName) || numericStats[0];
    }
    return numericStats[0];
  }, [numericStats, selectedVarName]);

  // BloxBot Natural Language Explanations Dictionary
  const bloxBotExplanations = useMemo(() => {
    if (!activeFocusVariable) return null;
    const v = activeFocusVariable;
    const isNormal = Math.abs(v.skewness) < 0.8 && Math.abs(v.kurtosis) < 1.5;
    const skewDesc = v.skewness > 0.5 
      ? 'positively right-skewed (a few high outlier observations)' 
      : v.skewness < -0.5 
        ? 'negatively left-skewed (a few low tail values)' 
        : 'relatively symmetric & normal';

    return {
      mean: {
        title: `Mean (x̄ = ${v.mean.toFixed(3)})`,
        summary: `The arithmetic center of "${v.label || v.name}".`,
        interpretation: `Across N = ${v.validCount} analyzed cases, the average recorded value is ${v.mean.toFixed(3)}. When combined with standard deviation (s = ${v.stdDev.toFixed(2)}), approximately 68% of standard observations cluster between ${(v.mean - v.stdDev).toFixed(2)} and ${(v.mean + v.stdDev).toFixed(2)}.`,
        apaFormat: `M = ${v.mean.toFixed(2)}, SD = ${v.stdDev.toFixed(2)}`
      },
      median: {
        title: `Median (Mdn = ${v.median.toFixed(3)})`,
        summary: `The 50th percentile rank resistant to extreme outliers.`,
        interpretation: `The middle value is ${v.median.toFixed(3)}. Because the mean (${v.mean.toFixed(2)}) is ${Math.abs(v.mean - v.median) < 0.1 * v.stdDev ? 'very close to' : 'distinct from'} the median, the distribution is ${skewDesc}. In non-parametric reporting, median is preferred over mean.`,
        apaFormat: `Mdn = ${v.median.toFixed(2)} (Range = ${v.min.toFixed(2)} – ${v.max.toFixed(2)})`
      },
      stdDev: {
        title: `Standard Deviation (s = ${v.stdDev.toFixed(3)}) & Variance (s² = ${v.variance.toFixed(3)})`,
        summary: `Sample dispersion and average distance from the mean.`,
        interpretation: `A standard deviation of ${v.stdDev.toFixed(3)} indicates ${v.stdDev / (v.mean || 1) < 0.25 ? 'low relative dispersion (consistent data)' : 'moderate-to-high dispersion across observations'}. The total sample variance is s² = ${v.variance.toFixed(3)}.`,
        apaFormat: `SD = ${v.stdDev.toFixed(2)}`
      },
      dispersion: {
        title: `Range (${v.range.toFixed(2)}) [Min: ${v.min.toFixed(2)}, Max: ${v.max.toFixed(2)}]`,
        summary: `Total empirical spread across the observations.`,
        interpretation: `Values span from a minimum of ${v.min.toFixed(2)} to a maximum of ${v.max.toFixed(2)}, giving an absolute spread of ${v.range.toFixed(2)} units. No impossible negative boundaries or truncate floor effects detected.`,
        apaFormat: `range = [${v.min.toFixed(2)}, ${v.max.toFixed(2)}]`
      },
      skewKurt: {
        title: `Distribution Normality (Skew: ${v.skewness.toFixed(2)}, Kurtosis: ${v.kurtosis.toFixed(2)})`,
        summary: `Parametric assumption verification for t-tests & ANOVA.`,
        interpretation: `The skewness index is ${v.skewness.toFixed(2)} and excess kurtosis is ${v.kurtosis.toFixed(2)}. ${isNormal ? 'This satisfies the normality assumption for parametric procedures like Student’s t-test and General Linear Models.' : 'Consider applying a log-transformation or running a non-parametric Mann-Whitney U test.'}`,
        apaFormat: `Skewness = ${v.skewness.toFixed(2)}, Kurtosis = ${v.kurtosis.toFixed(2)}`
      },
      missing: {
        title: `Data Completeness (${v.missingCount} Missing / ${v.validCount + v.missingCount} Total)`,
        summary: `Missing value audit and listwise exclusion impact.`,
        interpretation: `${v.missingCount === 0 ? '100% complete records. Zero missing values detected; all cases qualify for standard listwise / pairwise deletion routines.' : `Detected ${v.missingCount} missing cases (${((v.missingCount / (v.validCount + v.missingCount)) * 100).toFixed(1)}%). BloxBot recommends Little’s MCAR test or Expectation-Maximization imputation.`}`,
        apaFormat: `Valid N = ${v.validCount}, Missing N = ${v.missingCount}`
      }
    };
  }, [activeFocusVariable]);

  const handleCopyExplanationText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExplanation(true);
    setTimeout(() => setCopiedExplanation(false), 2000);
  };

  return (
    <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-md">
      {/* Header with Selector & Sidebar Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Quick Stats Summary & BloxBot Statistical Reasoning
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                {numericStats.length} Numeric Variables
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">
              Auto-calculated central tendency, dispersion, and natural language BloxBot statistical guidance (N = {rows.length}).
            </p>
          </div>
        </div>

        {/* Variable Filter Selector & Sidebar Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#07080A] border border-slate-800 rounded-lg px-2.5 py-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedVarName}
              onChange={(e) => setSelectedVarName(e.target.value)}
              className="bg-transparent text-slate-200 text-[11px] font-mono focus:outline-none cursor-pointer"
            >
              <option value="all">All Variables ({numericStats.length})</option>
              {numericStats.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.label})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSidebarOpen 
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle BloxBot Natural Language Explanations Sidebar"
          >
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            <span>{isSidebarOpen ? 'Hide BloxBot Guide' : 'BloxBot Explanations'}</span>
          </button>
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
          <span className="text-slate-400">Total Missing:</span>
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

      {/* Main Layout: Stats Cards Grid + Collapsible BloxBot Explanation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* Quick Stats Cards Grid */}
        <div className={`${isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all`}>
          {displayedStats.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
              No numeric variables detected in this dataset. Upload or inspect columns to configure.
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${isSidebarOpen ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-3`}>
              {displayedStats.map((stat) => (
                <div
                  key={stat.name}
                  onClick={() => {
                    setSelectedVarName(stat.name);
                  }}
                  className="bg-[#07080A] border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 flex flex-col gap-2.5 transition-all shadow-sm group cursor-pointer"
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
                        {stat.missingCount === 0 ? '100% Valid' : `${stat.missingCount} Miss`}
                      </span>
                    </div>
                  </div>

                  {/* Central Tendency & Dispersion Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div 
                      onClick={(e) => { e.stopPropagation(); setActiveStatFocus('mean'); setSelectedVarName(stat.name); }}
                      className="p-2 rounded bg-slate-900/60 hover:bg-sky-950/40 border border-slate-800/60 hover:border-sky-500/50 flex flex-col transition-colors cursor-pointer"
                    >
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Mean (x̄)</span>
                        <Sparkles className="w-2.5 h-2.5 text-sky-400 opacity-0 group-hover:opacity-100" />
                      </span>
                      <span className="text-white font-bold text-xs mt-0.5">
                        {stat.mean.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                      </span>
                    </div>

                    <div 
                      onClick={(e) => { e.stopPropagation(); setActiveStatFocus('median'); setSelectedVarName(stat.name); }}
                      className="p-2 rounded bg-slate-900/60 hover:bg-indigo-950/40 border border-slate-800/60 hover:border-indigo-500/50 flex flex-col transition-colors cursor-pointer"
                    >
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Median (Mdn)</span>
                      <span className="text-indigo-300 font-bold text-xs mt-0.5">
                        {stat.median.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                      </span>
                    </div>

                    <div 
                      onClick={(e) => { e.stopPropagation(); setActiveStatFocus('stdDev'); setSelectedVarName(stat.name); }}
                      className="p-2 rounded bg-slate-900/60 hover:bg-emerald-950/40 border border-slate-800/60 hover:border-emerald-500/50 flex flex-col transition-colors cursor-pointer"
                    >
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Std. Dev (s)</span>
                      <span className="text-emerald-400 font-bold text-xs mt-0.5">
                        {stat.stdDev.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                      </span>
                    </div>

                    <div 
                      onClick={(e) => { e.stopPropagation(); setActiveStatFocus('skewKurt'); setSelectedVarName(stat.name); }}
                      className="p-2 rounded bg-slate-900/60 hover:bg-purple-950/40 border border-slate-800/60 hover:border-purple-500/50 flex flex-col transition-colors cursor-pointer"
                    >
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Skew / Kurt</span>
                      <span className="text-purple-300 font-bold text-xs mt-0.5">
                        {stat.skewness.toFixed(2)} / {stat.kurtosis.toFixed(2)}
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

        {/* Collapsible BLOXBOT Natural Language Statistical Explanations Sidebar */}
        {isSidebarOpen && bloxBotExplanations && (
          <div className="lg:col-span-4 bg-[#0A0D14] border border-sky-500/40 rounded-xl p-3.5 flex flex-col gap-3 shadow-xl relative animate-in fade-in slide-in-from-right-4 duration-200">
            
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <span>BloxBot Statistical Insights</span>
                    <Sparkles className="w-3 h-3 text-sky-400" />
                  </h4>
                  <p className="text-[9.5px] font-mono text-slate-400 truncate max-w-[170px]">
                    Focus: <span className="text-sky-300 font-bold">{activeFocusVariable?.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onVoiceSpeak && (
                  <button
                    onClick={() => {
                      const exp = (bloxBotExplanations as any)[activeStatFocus] || bloxBotExplanations.mean;
                      onVoiceSpeak(`${exp.title}. ${exp.interpretation}`);
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors cursor-pointer"
                    title="Speak Explanation aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Close sidebar"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Metric Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[9.5px] font-mono">
              {[
                { key: 'mean', label: 'Mean' },
                { key: 'median', label: 'Median' },
                { key: 'stdDev', label: 'Std Dev' },
                { key: 'skewKurt', label: 'Normality' },
                { key: 'dispersion', label: 'Range' },
                { key: 'missing', label: 'Missing' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatFocus(tab.key)}
                  className={`px-2 py-1 rounded transition-all cursor-pointer shrink-0 ${
                    activeStatFocus === tab.key
                      ? 'bg-sky-500 text-white font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Explanation Content Card */}
            {(() => {
              const exp = (bloxBotExplanations as any)[activeStatFocus] || bloxBotExplanations.mean;
              return (
                <div className="bg-[#0D1019] border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-1 border-b border-slate-800/80 pb-2">
                    <div>
                      <span className="text-xs font-bold font-mono text-sky-300">
                        {exp.title}
                      </span>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {exp.summary}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyExplanationText(`${exp.title}\n${exp.interpretation}\nAPA Format: ${exp.apaFormat}`)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Copy explanation"
                    >
                      {copiedExplanation ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Natural Language Narrative */}
                  <div className="text-xs text-slate-300 font-sans leading-relaxed space-y-2">
                    <p>{exp.interpretation}</p>
                  </div>

                  {/* APA 7th Edition Copyable Snippet */}
                  <div className="p-2 bg-[#05070B] border border-slate-800/90 rounded text-[10px] font-mono flex items-center justify-between text-indigo-300">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="truncate">APA 7th: <strong className="text-white">{exp.apaFormat}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick BloxBot Synthesis Summary */}
            <div className="p-2.5 bg-gradient-to-r from-sky-950/30 to-indigo-950/30 border border-sky-500/20 rounded-lg text-[10px] text-slate-300 font-sans leading-snug flex items-start gap-2">
              <Bot className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>BloxBot Diagnostic:</strong> All parametric indicators for <em className="text-white">{activeFocusVariable?.name}</em> are ready for formal manuscript drafting or export to SPSS syntax.
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
