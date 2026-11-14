import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { StatusIndicator } from '../components/StatusBadge';
import { useAstra } from '../context/AstraContext';
import { HealthParameterKey } from '../types/astra';
import {
  PARAMETER_META,
  evaluateHealthReading,
  generateAnalyticsInsights,
} from '../utils/analysisEngine';

const PARAMETER_OPTIONS: HealthParameterKey[] = [
  'heartRate',
  'spo2',
  'temperature',
  'respiratoryRate',
  'systolicBp',
];

export const HealthAnalytics: React.FC = () => {
  const { state, selectAstronaut } = useAstra();
  const [selectedParam, setSelectedParam] = useState<HealthParameterKey>('heartRate');
  const [sampleLimit, setSampleLimit] = useState<number>(20);
  const [animateEntrance, setAnimateEntrance] = useState(true);

  useEffect(() => {
    setAnimateEntrance(true);
    const t = window.setTimeout(() => setAnimateEntrance(false), 600);
    return () => window.clearTimeout(t);
  }, [selectedParam, state.selectedAstronautId]);

  const selectedAstronaut = useMemo(
    () =>
      state.astronauts.find((a) => a.id === state.selectedAstronautId) ?? state.astronauts[0] ?? null,
    [state.astronauts, state.selectedAstronautId]
  );

  const readings = useMemo(() => {
    if (!selectedAstronaut) return [];
    const sorted = state.readings
      .filter((r) => r.astronautId === selectedAstronaut.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return sampleLimit > 0 ? sorted.slice(-sampleLimit) : sorted;
  }, [selectedAstronaut, state.readings, sampleLimit]);

  const baselineValue = useMemo(() => {
    if (!selectedAstronaut) return 0;
    const map: Record<HealthParameterKey, number> = {
      heartRate: selectedAstronaut.baseline.restingHeartRate,
      spo2: selectedAstronaut.baseline.normalSpo2,
      temperature: selectedAstronaut.baseline.normalTemp,
      respiratoryRate: selectedAstronaut.baseline.normalRespRate,
      systolicBp: selectedAstronaut.baseline.normalSystolicBp,
    };
    return map[selectedParam];
  }, [selectedAstronaut, selectedParam]);

  const stats = useMemo(() => {
    if (readings.length === 0) {
      return { latest: 0, avg: 0, min: 0, max: 0, delta: 0 };
    }
    const vals = readings.map((r) => r[selectedParam]);
    const latest = vals[vals.length - 1];
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return {
      latest,
      avg,
      min: Math.min(...vals),
      max: Math.max(...vals),
      delta: latest - baselineValue,
    };
  }, [readings, selectedParam, baselineValue]);

  const insights = useMemo(() => {
    if (!selectedAstronaut) return [];
    return generateAnalyticsInsights(
      selectedAstronaut,
      readings,
      selectedParam,
      state.settings.thresholds
    );
  }, [selectedAstronaut, readings, selectedParam, state.settings.thresholds]);

  const chartData = useMemo(() => {
    return readings.map((r) => {
      const d = new Date(r.timestamp);
      return {
        label: `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        value: r[selectedParam],
        baseline: baselineValue,
        source: r.source,
      };
    });
  }, [readings, selectedParam, baselineValue]);

  if (!selectedAstronaut) {
    return (
      <div className="astra-card p-8 text-center text-sm text-[#718096]">
        No astronauts found.
      </div>
    );
  }

  const meta = PARAMETER_META[selectedParam];

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <section className="astra-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="analytics-astro" className="block text-[11px] text-[#718096] mb-1">
              Astronaut
            </label>
            <select
              id="analytics-astro"
              value={selectedAstronaut.id}
              onChange={(e) => selectAstronaut(e.target.value)}
              className="text-sm font-medium text-[#172B45] bg-[#F5F7FA] border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
            >
              {state.astronauts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="analytics-param" className="block text-[11px] text-[#718096] mb-1">
              Health Parameter
            </label>
            <select
              id="analytics-param"
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value as HealthParameterKey)}
              className="text-sm font-medium text-[#172B45] bg-[#F5F7FA] border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
            >
              {PARAMETER_OPTIONS.map((key) => (
                <option key={key} value={key}>
                  {PARAMETER_META[key].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#F5F7FA] border border-slate-200/70 p-1 rounded-lg self-start lg:self-end">
          {[
            { label: 'Last 10', val: 10 },
            { label: 'Last 20', val: 20 },
            { label: 'All Recorded', val: 0 },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSampleLimit(opt.val)}
              className={`astra-btn px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                sampleLimit === opt.val
                  ? 'bg-white text-[#172B45] shadow-xs border border-slate-200/60'
                  : 'text-[#718096] hover:text-[#172B45]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Summary Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Latest Reading</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <AnimatedNumber
              value={stats.latest}
              decimals={meta.decimals}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
            <span className="text-xs font-mono text-[#718096]">{meta.unit}</span>
          </div>
          <div className="text-xs font-mono tabular-nums text-[#718096] mt-1.5">
            {stats.delta >= 0
              ? `+${stats.delta.toFixed(meta.decimals)}`
              : stats.delta.toFixed(meta.decimals)}{' '}
            {meta.unit} vs baseline
          </div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Personal Baseline</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <AnimatedNumber
              value={baselineValue}
              decimals={meta.decimals}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
            <span className="text-xs font-mono text-[#718096]">{meta.unit}</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">{selectedAstronaut.name}</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Window Average</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <AnimatedNumber
              value={stats.avg}
              decimals={1}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
            <span className="text-xs font-mono text-[#718096]">{meta.unit}</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">{readings.length} samples analyzed</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Min / Max Range</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#172B45] mt-2">
            {stats.min.toFixed(meta.decimals)}–{stats.max.toFixed(meta.decimals)}
          </div>
          <div className="text-xs text-[#718096] mt-1.5">{meta.unit} span</div>
        </div>
      </section>

      {/* Main Comparison Chart */}
      <section className="astra-card astra-card-surface p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#172B45]">
              {meta.label} Over Time vs Personal Baseline
            </h3>
            <p className="text-xs text-[#718096]">
              Solid blue line shows observed readings · Dashed grey line marks {selectedAstronaut.name}
              &apos;s baseline ({baselineValue} {meta.unit})
            </p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#718096' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#718096' }} />
              <Tooltip
                contentStyle={{
                  fontSize: '12px',
                  borderRadius: '8px',
                  borderColor: '#E2E8F0',
                }}
              />
              <ReferenceLine
                y={baselineValue}
                stroke="#718096"
                strokeDasharray="5 5"
                label={{ value: 'Baseline', fontSize: 11, fill: '#718096', position: 'insideTopRight' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={`${meta.label} (${meta.unit})`}
                stroke="#2878C7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2878C7' }}
                isAnimationActive={animateEntrance}
                animationDuration={450}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Computed Insights + Historical Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 astra-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#172B45]">Data-Driven Analysis Insights</h3>
          <ul className="space-y-2.5 text-sm text-[#172B45]">
            {insights.map((text, idx) => (
              <li key={idx} className="pb-2.5 last:pb-0 border-b last:border-b-0 border-slate-100 leading-relaxed">
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7 astra-card p-5">
          <h3 className="text-sm font-semibold text-[#172B45] mb-3">
            Historical Readings ({meta.label})
          </h3>
          <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F5F7FA] text-[#718096] border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Timestamp</th>
                  <th className="py-2.5 px-3 font-medium text-right">Reading</th>
                  <th className="py-2.5 px-3 font-medium text-right">Baseline Delta</th>
                  <th className="py-2.5 px-3 font-medium">Source</th>
                  <th className="py-2.5 px-3 font-medium">Parameter Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...readings].reverse().map((r) => {
                  const evalRes = evaluateHealthReading(
                    r,
                    selectedAstronaut,
                    [],
                    state.settings.thresholds
                  ).parameters[selectedParam];
                  const deltaSign = evalRes.delta > 0 ? '+' : '';
                  return (
                    <tr key={r.id} className="hover:bg-[#F5F7FA]/70">
                      <td className="py-2 px-3 font-mono tabular-nums text-[#718096] whitespace-nowrap">
                        {new Date(r.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right font-semibold text-[#172B45]">
                        {evalRes.value.toFixed(meta.decimals)} {meta.unit}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right text-[#718096]">
                        {deltaSign}
                        {evalRes.delta.toFixed(meta.decimals)} {meta.unit}
                      </td>
                      <td className="py-2 px-3 font-mono text-[#718096]">{r.source}</td>
                      <td className="py-2 px-3">
                        <StatusIndicator status={evalRes.status} compact />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
