import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, HeartPulse, Play } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { OrbitalEarthCard } from '../components/OrbitalEarthCard';
import { AvatarInitials, StatusIndicator } from '../components/StatusBadge';
import { useAstra } from '../context/AstraContext';
import { HealthStatus, NavSection } from '../types/astra';

interface MissionOverviewProps {
  onNavigate: (section: NavSection) => void;
}

const CREW_LINE_COLORS = ['#2878C7', '#55B9E8', '#1F8A5B', '#546E94', '#C97B18'];

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export const MissionOverview: React.FC<MissionOverviewProps> = ({ onNavigate }) => {
  const { state, isMonitoring, selectAstronaut, triggerSimulatedStep } = useAstra();
  const [animateEntrance, setAnimateEntrance] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setAnimateEntrance(false), 750);
    return () => window.clearTimeout(t);
  }, []);

  const astronautSummaries = useMemo(() => {
    return state.astronauts.map((astro) => {
      const astroReadings = state.readings
        .filter((r) => r.astronautId === astro.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const latest = astroReadings[astroReadings.length - 1];
      return {
        astro,
        latest,
      };
    });
  }, [state.astronauts, state.readings]);

  const metrics = useMemo(() => {
    const validReadings = astronautSummaries.map((s) => s.latest).filter(Boolean);
    const avgHr =
      validReadings.length > 0
        ? Math.round(validReadings.reduce((acc, r) => acc + r!.heartRate, 0) / validReadings.length)
        : 0;
    const avgSpo2 =
      validReadings.length > 0
        ? Number(
            (validReadings.reduce((acc, r) => acc + r!.spo2, 0) / validReadings.length).toFixed(1)
          )
        : 0;

    const activeAlerts = state.alerts.filter((a) => a.status !== 'RESOLVED').length;

    let overallStatus: HealthStatus = 'NORMAL';
    if (
      validReadings.some((r) => r?.status === 'WARNING') ||
      state.alerts.some((a) => a.status !== 'RESOLVED' && a.severity === 'WARNING')
    ) {
      overallStatus = 'WARNING';
    } else if (
      validReadings.some((r) => r?.status === 'ATTENTION') ||
      state.alerts.some((a) => a.status !== 'RESOLVED' && a.severity === 'ATTENTION')
    ) {
      overallStatus = 'ATTENTION';
    }

    return {
      crewCount: state.astronauts.length,
      avgHr,
      avgSpo2,
      activeAlerts,
      overallStatus,
    };
  }, [astronautSummaries, state.alerts, state.astronauts.length]);

  const trendData = useMemo(() => {
    const maxLen = Math.max(
      1,
      ...state.astronauts.map((a) =>
        Math.min(12, state.readings.filter((r) => r.astronautId === a.id).length)
      )
    );

    const perAstroTail = state.astronauts.map((a) => ({
      astro: a,
      list: state.readings
        .filter((r) => r.astronautId === a.id)
        .sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime())
        .slice(-12),
    }));

    const rows: Record<string, string | number>[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: Record<string, string | number> = {
        label: `S${i + 1}`,
      };
      perAstroTail.forEach(({ astro, list }) => {
        const item = list[i];
        if (item) {
          row.label = formatTimeShort(item.timestamp);
          row[`hr_${astro.id}`] = item.heartRate;
          row[`spo2_${astro.id}`] = item.spo2;
          row[`temp_${astro.id}`] = item.temperature;
        }
      });
      rows.push(row);
    }
    return rows;
  }, [state.astronauts, state.readings]);

  const sleepTrendData = useMemo(() => {
    const dates = Array.from(new Set(state.sleepRecords.map((s) => s.date))).sort().slice(-7);
    return dates.map((date) => {
      const row: Record<string, string | number> = {
        date: date.slice(5),
      };
      state.astronauts.forEach((astro) => {
        const rec = state.sleepRecords.find((s) => s.astronautId === astro.id && s.date === date);
        if (rec) {
          row[`sleep_${astro.id}`] = rec.durationHours;
        }
      });
      return row;
    });
  }, [state.astronauts, state.sleepRecords]);

  const activeAlertsList = state.alerts.filter((a) => a.status !== 'RESOLVED').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* A. Mission Information + Selective Three.js 3D Earth Orbital View */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 astra-card p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#718096] mb-2">
              <span>Fictional Mission Demonstration</span>
              <span aria-hidden="true">·</span>
              <span>Simulated &amp; Manual Telemetry Only</span>
              <span aria-hidden="true">·</span>
              <span>Not Affiliated with NASA</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-[#172B45] tracking-tight">
                Mission {state.settings.mission.name}
              </h2>
              <StatusIndicator status={metrics.overallStatus} />
            </div>
            <p className="text-sm text-[#718096] mt-2 leading-relaxed">
              Central orbital biomedical telemetry overview comparing simulated and manual crew
              readings against personal resting baselines and demonstration thresholds.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-xs text-[#718096]">Mission Duration</div>
              <div className="text-sm font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                {state.settings.mission.durationDays} Days
              </div>
            </div>
            <div>
              <div className="text-xs text-[#718096]">Current Mission Day</div>
              <div className="text-sm font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                Day {state.settings.mission.currentDay}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#718096]">Crew Monitored</div>
              <div className="text-sm font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                {metrics.crewCount} Astronauts
              </div>
            </div>
            <div>
              <div className="text-xs text-[#718096]">Mission Status</div>
              <div className="text-sm font-semibold text-[#2878C7] mt-1">
                {state.settings.mission.status}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <OrbitalEarthCard
            missionName={state.settings.mission.name}
            altitudeKm={state.settings.mission.orbitAltitudeKm}
            crewStatus={metrics.overallStatus}
            isMonitoring={isMonitoring}
          />
        </div>
      </section>

      {/* B. Health Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="astra-card astra-card-surface p-5 flex flex-col justify-between">
          <div className="text-xs font-medium text-[#718096]">Crew Members Monitored</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#172B45] mt-2">
            <AnimatedNumber value={metrics.crewCount} />
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Active mission roster</div>
        </div>

        <div className="astra-card astra-card-surface p-5 flex flex-col justify-between">
          <div className="text-xs font-medium text-[#718096]">Average Heart Rate</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <AnimatedNumber
              value={metrics.avgHr}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
            <span className="text-xs font-mono text-[#718096]">BPM</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Latest crew mean</div>
        </div>

        <div className="astra-card astra-card-surface p-5 flex flex-col justify-between">
          <div className="text-xs font-medium text-[#718096]">Average SpO2</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <AnimatedNumber
              value={metrics.avgSpo2}
              decimals={1}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
            <span className="text-xs font-mono text-[#718096]">%</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Blood oxygen saturation</div>
        </div>

        <div
          onClick={() => onNavigate('alerts')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('alerts');
            }
          }}
          className="astra-card astra-card-interactive p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="text-xs font-medium text-[#718096]">Active Alerts</div>
          <div className="flex items-baseline justify-between mt-2">
            <AnimatedNumber
              value={metrics.activeAlerts}
              className={`text-2xl font-semibold font-mono tabular-nums ${
                metrics.activeAlerts > 0 ? 'text-[#C53B3B]' : 'text-[#172B45]'
              }`}
            />
            <span className="text-xs font-medium text-[#2878C7]">View alerts</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Unresolved notifications</div>
        </div>

        <div className="astra-card astra-card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#718096]">Overall Crew Health</span>
            {isMonitoring && (
              <HeartPulse className="w-3.5 h-3.5 text-[#2878C7] astra-heartbeat-active" />
            )}
          </div>
          <div className="mt-2.5">
            <StatusIndicator status={metrics.overallStatus} />
          </div>
          <div className="text-xs text-[#718096] mt-2">
            {isMonitoring ? 'Live simulation running' : 'Simulation paused'}
          </div>
        </div>
      </section>

      {/* Active Alerts Preview Banner if any exist */}
      {activeAlertsList.length > 0 && (
        <section className="astra-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#172B45]">
              Recent Active Alerts ({metrics.activeAlerts})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('alerts')}
              className="astra-btn group inline-flex items-center gap-1 text-xs font-medium text-[#2878C7] hover:text-[#2065A9]"
            >
              <span>Manage Alerts</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {activeAlertsList.map((alert) => (
              <div
                key={alert.id}
                className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusIndicator status={alert.severity} compact />
                    <span className="font-medium text-[#172B45]">{alert.astronautName}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-[#718096]">{alert.parameter}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono tabular-nums font-medium text-[#172B45]">
                      {alert.currentValue}
                    </span>
                  </div>
                  <p className="text-xs text-[#718096]">{alert.explanation}</p>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[#718096] shrink-0">
                  {formatDateTime(alert.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* C. Astronaut Overview */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#172B45]">Astronaut Overview</h3>
            <p className="text-xs text-[#718096]">
              Select any crew member card to open live parameter monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerSimulatedStep}
              className="astra-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA]"
            >
              <Play className="w-3 h-3 text-[#2878C7]" />
              <span>Generate Reading</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('profiles')}
              className="astra-btn group inline-flex items-center gap-1 text-xs font-medium text-[#2878C7] hover:text-[#2065A9] px-2 py-1.5"
            >
              <span>All Profiles</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {astronautSummaries.map(({ astro, latest }) => (
            <button
              key={astro.id}
              type="button"
              onClick={() => {
                selectAstronaut(astro.id);
                onNavigate('live');
              }}
              className="astra-card astra-card-interactive text-left p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarInitials initials={astro.initials} color={astro.avatarColor} />
                  <div className="min-w-0">
                    <div className="font-semibold text-[#172B45] truncate">{astro.name}</div>
                    <div className="text-xs text-[#718096] truncate">
                      {astro.code} · {astro.role}
                    </div>
                  </div>
                </div>
                <StatusIndicator status={latest?.status ?? 'NORMAL'} compact />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-slate-100">
                <div>
                  <div className="text-[11px] text-[#718096]">Latest Heart Rate</div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-semibold font-mono tabular-nums text-[#172B45]">
                      {latest ? <AnimatedNumber value={latest.heartRate} /> : '—'}
                    </span>
                    <span className="text-xs font-mono text-[#718096]">BPM</span>
                  </div>
                  <div className="text-[11px] text-[#718096] font-mono tabular-nums mt-0.5">
                    Baseline {astro.baseline.restingHeartRate} BPM
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#718096]">Latest SpO2</div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-semibold font-mono tabular-nums text-[#172B45]">
                      {latest ? <AnimatedNumber value={latest.spo2} decimals={1} /> : '—'}
                    </span>
                    <span className="text-xs font-mono text-[#718096]">%</span>
                  </div>
                  <div className="text-[11px] text-[#718096] font-mono tabular-nums mt-0.5">
                    Baseline {astro.baseline.normalSpo2}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#718096] pt-2.5 border-t border-slate-100">
                <span>Source: {latest?.source ?? 'SIMULATED'}</span>
                <span className="font-mono tabular-nums">
                  {latest ? formatDateTime(latest.timestamp) : 'No readings'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* D. Health Charts */}
      <section className="space-y-3.5">
        <div>
          <h3 className="text-base font-semibold text-[#172B45]">Crew Health &amp; Wellness Trends</h3>
          <p className="text-xs text-[#718096]">
            Updated automatically as new simulated or manual readings are recorded
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Heart Rate Trends */}
          <div className="astra-card astra-card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-[#172B45]">Heart Rate Trends</h4>
                <p className="text-xs text-[#718096]">Beats per minute (BPM)</p>
              </div>
              <span className="text-[11px] font-mono text-[#718096]">SIMULATED / MANUAL</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#718096' }} />
                  <YAxis domain={[50, 130]} tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      borderColor: '#E2E8F0',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {state.astronauts.map((astro, idx) => (
                    <Line
                      key={astro.id}
                      type="monotone"
                      dataKey={`hr_${astro.id}`}
                      name={astro.name}
                      stroke={CREW_LINE_COLORS[idx % CREW_LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                      isAnimationActive={animateEntrance}
                      animationDuration={500}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SpO2 Trends */}
          <div className="astra-card astra-card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-[#172B45]">SpO2 Trends</h4>
                <p className="text-xs text-[#718096]">Blood oxygen saturation (%)</p>
              </div>
              <span className="text-[11px] font-mono text-[#718096]">SIMULATED / MANUAL</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#718096' }} />
                  <YAxis domain={[89, 100]} tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      borderColor: '#E2E8F0',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {state.astronauts.map((astro, idx) => (
                    <Line
                      key={astro.id}
                      type="monotone"
                      dataKey={`spo2_${astro.id}`}
                      name={astro.name}
                      stroke={CREW_LINE_COLORS[idx % CREW_LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                      isAnimationActive={animateEntrance}
                      animationDuration={500}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Body Temperature Trends */}
          <div className="astra-card astra-card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-[#172B45]">Body Temperature Trends</h4>
                <p className="text-xs text-[#718096]">Core estimate (°C)</p>
              </div>
              <span className="text-[11px] font-mono text-[#718096]">SIMULATED / MANUAL</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#718096' }} />
                  <YAxis domain={[35.5, 38.8]} tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      borderColor: '#E2E8F0',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {state.astronauts.map((astro, idx) => (
                    <Line
                      key={astro.id}
                      type="monotone"
                      dataKey={`temp_${astro.id}`}
                      name={astro.name}
                      stroke={CREW_LINE_COLORS[idx % CREW_LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                      isAnimationActive={animateEntrance}
                      animationDuration={500}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sleep Duration Trends */}
          <div className="astra-card astra-card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-[#172B45]">Sleep Duration Trends</h4>
                <p className="text-xs text-[#718096]">Hours per daily rest cycle</p>
              </div>
              <span className="text-[11px] font-mono text-[#718096]">7-DAY LOG</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepTrendData} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#718096' }} />
                  <YAxis domain={[4, 9.5]} tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      borderColor: '#E2E8F0',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {state.astronauts.map((astro, idx) => (
                    <Line
                      key={astro.id}
                      type="monotone"
                      dataKey={`sleep_${astro.id}`}
                      name={astro.name}
                      stroke={CREW_LINE_COLORS[idx % CREW_LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                      isAnimationActive={animateEntrance}
                      animationDuration={500}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
