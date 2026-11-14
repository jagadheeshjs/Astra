import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
import { HeartPulse, Play, PlusCircle, Square } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { AvatarInitials, StatusIndicator } from '../components/StatusBadge';
import { useAstra } from '../context/AstraContext';
import { evaluateHealthReading } from '../utils/analysisEngine';

export const LiveHealthMonitoring: React.FC = () => {
  const {
    state,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    triggerSimulatedStep,
    selectAstronaut,
    addManualReading,
  } = useAstra();

  const [animateEntrance, setAnimateEntrance] = useState(true);

  const selectedAstronaut = useMemo(
    () =>
      state.astronauts.find((a) => a.id === state.selectedAstronautId) ?? state.astronauts[0] ?? null,
    [state.astronauts, state.selectedAstronautId]
  );

  useEffect(() => {
    setAnimateEntrance(true);
    const t = window.setTimeout(() => setAnimateEntrance(false), 650);
    return () => window.clearTimeout(t);
  }, [selectedAstronaut?.id]);

  const astroReadings = useMemo(() => {
    if (!selectedAstronaut) return [];
    return state.readings
      .filter((r) => r.astronautId === selectedAstronaut.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedAstronaut, state.readings]);

  const latestReading = astroReadings[astroReadings.length - 1];

  const analysis = useMemo(() => {
    if (!selectedAstronaut || !latestReading) return null;
    return evaluateHealthReading(
      latestReading,
      selectedAstronaut,
      astroReadings.slice(0, -1),
      state.settings.thresholds
    );
  }, [selectedAstronaut, latestReading, astroReadings, state.settings.thresholds]);

  const [manualHr, setManualHr] = useState<string>('70');
  const [manualSpo2, setManualSpo2] = useState<string>('98.0');
  const [manualTemp, setManualTemp] = useState<string>('36.7');
  const [manualResp, setManualResp] = useState<string>('15');
  const [manualSys, setManualSys] = useState<string>('118');
  const [manualDia, setManualDia] = useState<string>('76');
  const [manualSavedFeedback, setManualSavedFeedback] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAstronaut) return;
    addManualReading(selectedAstronaut.id, {
      heartRate: Number(manualHr),
      spo2: Number(manualSpo2),
      temperature: Number(manualTemp),
      respiratoryRate: Number(manualResp),
      systolicBp: Number(manualSys),
      diastolicBp: Number(manualDia),
    });
    setManualSavedFeedback(true);
    window.setTimeout(() => setManualSavedFeedback(false), 2500);
  };

  const chartData = useMemo(() => {
    return astroReadings.slice(-16).map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      heartRate: r.heartRate,
      spo2: r.spo2,
      temperature: r.temperature,
      respiratoryRate: r.respiratoryRate,
    }));
  }, [astroReadings]);

  if (!selectedAstronaut) {
    return (
      <div className="astra-card p-8 text-center text-sm text-[#718096]">
        No astronauts available. Add an astronaut in Astronaut Profiles to start monitoring.
      </div>
    );
  }

  const parameterCards = analysis
    ? [
        {
          key: 'heartRate',
          title: 'Heart Rate',
          numValue: latestReading.heartRate,
          decimals: 0,
          secondaryValue: null as number | null,
          unit: 'BPM',
          eval: analysis.parameters.heartRate,
        },
        {
          key: 'spo2',
          title: 'Blood Oxygen (SpO2)',
          numValue: latestReading.spo2,
          decimals: 1,
          secondaryValue: null,
          unit: '%',
          eval: analysis.parameters.spo2,
        },
        {
          key: 'temperature',
          title: 'Body Temperature',
          numValue: latestReading.temperature,
          decimals: 1,
          secondaryValue: null,
          unit: '°C',
          eval: analysis.parameters.temperature,
        },
        {
          key: 'respiratoryRate',
          title: 'Respiratory Rate',
          numValue: latestReading.respiratoryRate,
          decimals: 0,
          secondaryValue: null,
          unit: 'br/min',
          eval: analysis.parameters.respiratoryRate,
        },
        {
          key: 'systolicBp',
          title: 'Blood Pressure',
          numValue: latestReading.systolicBp,
          decimals: 0,
          secondaryValue: latestReading.diastolicBp,
          unit: 'mmHg',
          eval: analysis.parameters.systolicBp,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Control Strip with Live Monitoring Heartbeat Indicator */}
      <section className="astra-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <AvatarInitials
            initials={selectedAstronaut.initials}
            color={selectedAstronaut.avatarColor}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label htmlFor="live-astro-select" className="sr-only">
                Select Astronaut
              </label>
              <select
                id="live-astro-select"
                value={selectedAstronaut.id}
                onChange={(e) => selectAstronaut(e.target.value)}
                className="text-sm font-semibold text-[#172B45] bg-[#F5F7FA] border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2878C7]"
              >
                {state.astronauts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code}) — {a.role}
                  </option>
                ))}
              </select>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border ${
                  isMonitoring
                    ? 'bg-[#EEF8FD] border-[#B6E2F7] text-[#172B45] astra-live-glow'
                    : 'bg-[#F5F7FA] border-slate-200 text-[#718096]'
                }`}
              >
                <HeartPulse
                  className={`w-3.5 h-3.5 ${
                    isMonitoring ? 'text-[#2878C7] astra-heartbeat-active' : 'text-[#718096]'
                  }`}
                />
                <span>LIVE MONITORING: {isMonitoring ? 'ON' : 'PAUSED'}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#718096] mt-1.5">
              <span>
                Data Source:{' '}
                <strong className="font-mono font-medium text-[#172B45]">
                  {latestReading?.source ?? 'SIMULATED'}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Last Updated:{' '}
                <span className="font-mono tabular-nums">
                  {latestReading
                    ? new Date(latestReading.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '—'}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Interval: {state.settings.monitoringIntervalSec}s (No physical sensors)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={triggerSimulatedStep}
            className="astra-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#172B45] bg-white border border-slate-300 rounded-lg hover:bg-[#F5F7FA]"
          >
            <span>Simulate Step</span>
          </button>

          {isMonitoring ? (
            <button
              type="button"
              onClick={stopMonitoring}
              className="astra-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#C53B3B] hover:bg-[#AE3131] rounded-lg"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Monitoring</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startMonitoring}
              className="astra-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Monitoring</span>
            </button>
          )}
        </div>
      </section>

      {/* Smooth Transition when Switching Astronauts */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAstronaut.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Parameter Cards: Clean White Surfaces with Restrained Border Accents Only on Affected Indicators */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {parameterCards.map((card) => {
              const deltaSign = card.eval.delta > 0 ? '+' : '';
              const borderHighlight =
                card.eval.status === 'WARNING'
                  ? 'border-[#E8B8B8]'
                  : card.eval.status === 'ATTENTION'
                    ? 'border-[#EED1A2]'
                    : 'border-[#E2E8F0]';
              const valueColor =
                card.eval.status === 'WARNING'
                  ? 'text-[#B83232]'
                  : card.eval.status === 'ATTENTION'
                    ? 'text-[#A86211]'
                    : 'text-[#172B45]';

              return (
                <div
                  key={card.key}
                  className={`astra-card-surface bg-white border ${borderHighlight} rounded-xl p-4 shadow-[0_1px_2px_rgba(23,43,69,0.04)] flex flex-col justify-between gap-3 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-[#718096]">{card.title}</span>
                    <StatusIndicator status={card.eval.status} compact />
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-semibold font-mono tabular-nums ${valueColor}`}>
                        <AnimatedNumber value={card.numValue} decimals={card.decimals} />
                        {card.secondaryValue !== null && (
                          <>
                            /<AnimatedNumber value={card.secondaryValue} decimals={0} />
                          </>
                        )}
                      </span>
                      <span className="text-xs font-mono text-[#718096]">{card.unit}</span>
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-[#718096] mt-1">
                      Baseline {card.eval.baseline} {card.unit} ({deltaSign}
                      {card.eval.delta})
                    </div>
                  </div>

                  <div className="text-[11px] text-[#718096] pt-2 border-t border-slate-100 leading-relaxed">
                    {card.eval.sustainedTrend ? 'Sustained trend detected · ' : ''}
                    {card.eval.status === 'NORMAL'
                      ? 'Within configured demo range.'
                      : card.eval.explanation}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Charts + Manual Entry Split */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8 space-y-4">
              <div className="astra-card astra-card-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#172B45]">
                      Heart Rate vs Personal Baseline ({selectedAstronaut.baseline.restingHeartRate}{' '}
                      BPM)
                    </h3>
                    <p className="text-xs text-[#718096]">
                      Dashed line indicates personal resting baseline
                    </p>
                  </div>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#718096' }} />
                      <YAxis domain={[45, 130]} tick={{ fontSize: 11, fill: '#718096' }} />
                      <Tooltip />
                      <ReferenceLine
                        y={selectedAstronaut.baseline.restingHeartRate}
                        stroke="#718096"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Baseline',
                          fontSize: 10,
                          fill: '#718096',
                          position: 'right',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        name="Heart Rate (BPM)"
                        stroke="#2878C7"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        isAnimationActive={animateEntrance}
                        animationDuration={450}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="astra-card astra-card-surface p-5">
                  <h3 className="text-sm font-semibold text-[#172B45] mb-1">
                    SpO2 vs Baseline ({selectedAstronaut.baseline.normalSpo2}%)
                  </h3>
                  <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 12, left: -14, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#718096' }} />
                        <YAxis domain={[89, 100]} tick={{ fontSize: 10, fill: '#718096' }} />
                        <Tooltip />
                        <ReferenceLine
                          y={selectedAstronaut.baseline.normalSpo2}
                          stroke="#718096"
                          strokeDasharray="4 4"
                        />
                        <Line
                          type="monotone"
                          dataKey="spo2"
                          name="SpO2 (%)"
                          stroke="#55B9E8"
                          strokeWidth={2}
                          dot={{ r: 2.5 }}
                          isAnimationActive={animateEntrance}
                          animationDuration={450}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="astra-card astra-card-surface p-5">
                  <h3 className="text-sm font-semibold text-[#172B45] mb-1">
                    Body Temp vs Baseline ({selectedAstronaut.baseline.normalTemp}°C)
                  </h3>
                  <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 12, left: -14, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#718096' }} />
                        <YAxis domain={[35.5, 38.8]} tick={{ fontSize: 10, fill: '#718096' }} />
                        <Tooltip />
                        <ReferenceLine
                          y={selectedAstronaut.baseline.normalTemp}
                          stroke="#718096"
                          strokeDasharray="4 4"
                        />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          name="Temp (°C)"
                          stroke="#1F8A5B"
                          strokeWidth={2}
                          dot={{ r: 2.5 }}
                          isAnimationActive={animateEntrance}
                          animationDuration={450}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Reading Entry Form */}
            <div className="xl:col-span-4 astra-card p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#172B45]">Manual Health Reading Entry</h3>
                <p className="text-xs text-[#718096] mt-0.5">
                  Recorded readings are labeled <span className="font-mono">MANUAL</span> and evaluated
                  immediately by the analysis engine.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#172B45] mb-1">
                      Heart Rate (BPM)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={200}
                      required
                      value={manualHr}
                      onChange={(e) => setManualHr(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#172B45] mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={75}
                      max={100}
                      required
                      value={manualSpo2}
                      onChange={(e) => setManualSpo2(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#172B45] mb-1">
                      Body Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={33}
                      max={41}
                      required
                      value={manualTemp}
                      onChange={(e) => setManualTemp(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#172B45] mb-1">
                      Resp Rate (br/min)
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={45}
                      required
                      value={manualResp}
                      onChange={(e) => setManualResp(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#172B45] mb-1">
                      Systolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      min={70}
                      max={210}
                      required
                      value={manualSys}
                      onChange={(e) => setManualSys(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#172B45] mb-1">
                      Diastolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      min={40}
                      max={130}
                      required
                      value={manualDia}
                      onChange={(e) => setManualDia(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="astra-btn w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Record Manual Reading</span>
                </button>

                {manualSavedFeedback && (
                  <p className="text-xs font-medium text-[#1E7E53]">
                    Manual reading saved for {selectedAstronaut.name} and analyzed.
                  </p>
                )}
              </form>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-[#718096] leading-relaxed">
                Disclaimer: Thresholds and status outputs are configurable demonstration rules. ASTRA
                does not diagnose conditions or recommend medical treatment.
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
