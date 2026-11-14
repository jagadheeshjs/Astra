import React, { useMemo } from 'react';
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
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { StatusIndicator } from '../components/StatusBadge';
import { useAstra } from '../context/AstraContext';

export const EnvironmentalMonitoring: React.FC = () => {
  const { state, simulateEnvironmentalSpike } = useAstra();

  const sortedReadings = useMemo(
    () =>
      [...state.environmentalReadings].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [state.environmentalReadings]
  );

  const latest = sortedReadings[sortedReadings.length - 1];
  const thresholds = state.settings.thresholds;

  const chartData = useMemo(
    () =>
      sortedReadings.slice(-16).map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cabinTemp: r.cabinTemp,
        humidity: r.humidity,
        radiation: r.radiationMsvDay,
      })),
    [sortedReadings]
  );

  const cabinTempStatus =
    latest &&
    (latest.cabinTemp >= thresholds.cabinTempWarningHigh ||
      latest.cabinTemp <= thresholds.cabinTempWarningLow)
      ? 'WARNING'
      : latest && latest.cabinTemp >= thresholds.cabinTempWarningHigh - 1.5
        ? 'ATTENTION'
        : 'NORMAL';
  const humidityStatus =
    latest && latest.humidity >= thresholds.humidityWarningHigh ? 'WARNING' : 'NORMAL';
  const radiationStatus =
    latest && latest.radiationMsvDay >= thresholds.radiationWarningHigh
      ? 'WARNING'
      : latest && latest.radiationMsvDay >= thresholds.radiationWarningHigh * 0.75
        ? 'ATTENTION'
        : 'NORMAL';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="astra-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#718096] mb-1">
            <span className="font-mono font-semibold text-[#2878C7]">SIMULATED TELEMETRY</span>
            <span aria-hidden="true">·</span>
            <span>Habitat Module: {state.settings.mission.name} Cabin</span>
          </div>
          <h2 className="text-base font-semibold text-[#172B45]">
            Spacecraft Cabin Environmental Conditions
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => simulateEnvironmentalSpike('NORMAL')}
            className="astra-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#2878C7]" />
            <span>Simulate Nominal Cabin</span>
          </button>
          <button
            type="button"
            onClick={() => simulateEnvironmentalSpike('WARNING')}
            className="astra-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#C97B18] hover:bg-[#B26A12] rounded-lg"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Threshold Spike</span>
          </button>
        </div>
      </section>

      {/* Environmental Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`astra-card astra-card-surface p-5 ${
            cabinTempStatus === 'WARNING'
              ? 'border-[#E8B8B8]'
              : cabinTempStatus === 'ATTENTION'
                ? 'border-[#EED1A2]'
                : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#718096]">Cabin Temperature (Simulated)</span>
            <StatusIndicator status={cabinTempStatus} compact />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]">
              {latest ? <AnimatedNumber value={latest.cabinTemp} decimals={1} /> : '—'}
            </span>
            <span className="text-xs font-mono text-[#718096]">°C</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5 font-mono tabular-nums">
            Demo limits: {thresholds.cabinTempWarningLow}–{thresholds.cabinTempWarningHigh}°C
          </div>
        </div>

        <div
          className={`astra-card astra-card-surface p-5 ${
            humidityStatus === 'WARNING' ? 'border-[#E8B8B8]' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#718096]">Relative Humidity (Simulated)</span>
            <StatusIndicator status={humidityStatus} compact />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]">
              {latest ? <AnimatedNumber value={latest.humidity} /> : '—'}
            </span>
            <span className="text-xs font-mono text-[#718096]">%</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5 font-mono tabular-nums">
            Demo upper limit: {thresholds.humidityWarningHigh}%
          </div>
        </div>

        <div
          className={`astra-card astra-card-surface p-5 ${
            radiationStatus === 'WARNING'
              ? 'border-[#E8B8B8]'
              : radiationStatus === 'ATTENTION'
                ? 'border-[#EED1A2]'
                : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#718096]">Radiation Monitor (Simulated)</span>
            <StatusIndicator status={radiationStatus} compact />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]">
              {latest ? <AnimatedNumber value={latest.radiationMsvDay} decimals={2} /> : '—'}
            </span>
            <span className="text-xs font-mono text-[#718096]">mSv/day</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5 font-mono tabular-nums">
            Demo threshold: {thresholds.radiationWarningHigh} mSv/day
          </div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Overall Cabin Status</div>
          <div className="mt-2.5">
            <StatusIndicator status={latest?.status ?? 'NORMAL'} />
          </div>
          <div className="text-xs text-[#718096] mt-2 font-mono tabular-nums">
            CO2 (Sim): {latest ? `${latest.co2Ppm} ppm` : '—'}
          </div>
        </div>
      </section>

      {/* Environmental Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="astra-card astra-card-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#172B45]">
                Cabin Temperature &amp; Humidity Trend
              </h3>
              <p className="text-xs text-[#718096]">Simulated environmental readings</p>
            </div>
            <span className="text-[11px] font-mono text-[#718096]">SIMULATED</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis yAxisId="temp" domain={[15, 32]} tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis
                  yAxisId="hum"
                  orientation="right"
                  domain={[25, 80]}
                  tick={{ fontSize: 11, fill: '#718096' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    borderColor: '#E2E8F0',
                  }}
                />
                <ReferenceLine
                  yAxisId="temp"
                  y={thresholds.cabinTempWarningHigh}
                  stroke="#C53B3B"
                  strokeDasharray="4 4"
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="cabinTemp"
                  name="Cabin Temp (°C)"
                  stroke="#2878C7"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="hum"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#55B9E8"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#172B45]">
                Radiation Flux Indicator Trend
              </h3>
              <p className="text-xs text-[#718096]">
                Dashed red line marks configured demonstration limit ({thresholds.radiationWarningHigh}{' '}
                mSv/day)
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#718096]">SIMULATED</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis domain={[0, 2.2]} tick={{ fontSize: 11, fill: '#718096' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    borderColor: '#E2E8F0',
                  }}
                />
                <ReferenceLine
                  y={thresholds.radiationWarningHigh}
                  stroke="#C53B3B"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="radiation"
                  name="Radiation (mSv/day)"
                  stroke="#C97B18"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
};
