import React, { useMemo, useState } from 'react';
import { Download, FileCheck, Printer } from 'lucide-react';
import { StatusIndicator } from '../components/StatusBadge';
import { useAstra } from '../context/AstraContext';

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const MissionReports: React.FC = () => {
  const { state } = useAstra();

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [selectedAstroId, setSelectedAstroId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>(sevenDaysAgo);
  const [endDate, setEndDate] = useState<string>(today);
  const [generatedAt, setGeneratedAt] = useState<string>(new Date().toLocaleString());

  const targetAstronauts = useMemo(() => {
    if (selectedAstroId === 'ALL') return state.astronauts;
    return state.astronauts.filter((a) => a.id === selectedAstroId);
  }, [state.astronauts, selectedAstroId]);

  const filteredData = useMemo(() => {
    const startMs = new Date(`${startDate}T00:00:00`).getTime();
    const endMs = new Date(`${endDate}T23:59:59`).getTime();
    const astroIds = new Set(targetAstronauts.map((a) => a.id));

    const readings = state.readings.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return astroIds.has(r.astronautId) && t >= startMs && t <= endMs;
    });

    const sleep = state.sleepRecords.filter(
      (s) => astroIds.has(s.astronautId) && s.date >= startDate && s.date <= endDate
    );

    const activity = state.activityRecords.filter(
      (ac) => astroIds.has(ac.astronautId) && ac.date >= startDate && ac.date <= endDate
    );

    const alerts = state.alerts.filter((al) => {
      const t = new Date(al.timestamp).getTime();
      const matchTarget =
        selectedAstroId === 'ALL' || al.astronautId === selectedAstroId || al.astronautId === 'ENV-CABIN';
      return matchTarget && t >= startMs && t <= endMs;
    });

    const env = state.environmentalReadings.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= startMs && t <= endMs;
    });

    return { readings, sleep, activity, alerts, env };
  }, [state, targetAstronauts, selectedAstroId, startDate, endDate]);

  const astronautSummaries = useMemo(() => {
    return targetAstronauts.map((astro) => {
      const rList = filteredData.readings.filter((r) => r.astronautId === astro.id);
      const sList = filteredData.sleep.filter((s) => s.astronautId === astro.id);
      const aList = filteredData.activity.filter((a) => a.astronautId === astro.id);

      const avgHr =
        rList.length > 0
          ? Math.round(rList.reduce((sum, r) => sum + r.heartRate, 0) / rList.length)
          : astro.baseline.restingHeartRate;
      const avgSpo2 =
        rList.length > 0
          ? (rList.reduce((sum, r) => sum + r.spo2, 0) / rList.length).toFixed(1)
          : astro.baseline.normalSpo2.toFixed(1);
      const avgTemp =
        rList.length > 0
          ? (rList.reduce((sum, r) => sum + r.temperature, 0) / rList.length).toFixed(1)
          : astro.baseline.normalTemp.toFixed(1);
      const avgSleep =
        sList.length > 0
          ? (sList.reduce((sum, s) => sum + s.durationHours, 0) / sList.length).toFixed(1)
          : '—';
      const totalActivityMins = aList.reduce((sum, a) => sum + a.durationMinutes, 0);
      const latestStatus = rList[rList.length - 1]?.status ?? 'NORMAL';

      return {
        astro,
        samples: rList.length,
        avgHr,
        avgSpo2,
        avgTemp,
        avgSleep,
        totalActivityMins,
        latestStatus,
      };
    });
  }, [targetAstronauts, filteredData]);

  const envSummary = useMemo(() => {
    const list = filteredData.env;
    if (list.length === 0) {
      return { avgTemp: '—', avgHumidity: '—', avgRad: '—', latestStatus: 'NORMAL' as const };
    }
    const avgTemp = (list.reduce((s, e) => s + e.cabinTemp, 0) / list.length).toFixed(1);
    const avgHumidity = Math.round(list.reduce((s, e) => s + e.humidity, 0) / list.length);
    const avgRad = (list.reduce((s, e) => s + e.radiationMsvDay, 0) / list.length).toFixed(2);
    return {
      avgTemp: `${avgTemp}°C`,
      avgHumidity: `${avgHumidity}%`,
      avgRad: `${avgRad} mSv/day`,
      latestStatus: list[list.length - 1].status,
    };
  }, [filteredData.env]);

  const handleExportCsv = () => {
    const headers = [
      'RecordType',
      'TimestampOrDate',
      'Subject',
      'HeartRate_BPM',
      'SpO2_Pct',
      'Temp_C',
      'RespRate_BrMin',
      'BloodPressure',
      'Source',
      'StatusOrDetail',
    ];

    const rows: (string | number)[][] = [];

    filteredData.readings.forEach((r) => {
      const astro = state.astronauts.find((a) => a.id === r.astronautId);
      rows.push([
        'HEALTH_READING',
        r.timestamp,
        astro ? `${astro.name} (${astro.code})` : r.astronautId,
        r.heartRate,
        r.spo2,
        r.temperature,
        r.respiratoryRate,
        `${r.systolicBp}/${r.diastolicBp}`,
        r.source,
        r.status,
      ]);
    });

    filteredData.sleep.forEach((s) => {
      const astro = state.astronauts.find((a) => a.id === s.astronautId);
      rows.push([
        'SLEEP_WELLNESS',
        s.date,
        astro ? `${astro.name} (${astro.code})` : s.astronautId,
        '',
        '',
        '',
        '',
        '',
        'LOG',
        `${s.durationHours}h | Quality ${s.qualityScore}/100 | ${s.wellnessStatus}`,
      ]);
    });

    filteredData.activity.forEach((a) => {
      const astro = state.astronauts.find((ast) => ast.id === a.astronautId);
      rows.push([
        'PHYSICAL_ACTIVITY',
        a.date,
        astro ? `${astro.name} (${astro.code})` : a.astronautId,
        '',
        '',
        '',
        '',
        '',
        'LOG',
        `${a.exerciseType} | ${a.durationMinutes} min | ${a.caloriesBurned} kcal`,
      ]);
    });

    filteredData.alerts.forEach((al) => {
      rows.push([
        'ALERT',
        al.timestamp,
        al.astronautName,
        '',
        '',
        '',
        '',
        '',
        al.category,
        `${al.severity} | ${al.parameter}: ${al.currentValue} | ${al.status}`,
      ]);
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ASTRA_${state.settings.mission.name}_Report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Controls (hidden during print) */}
      <section className="astra-card p-4 sm:p-5 flex flex-col xl:flex-row xl:items-end justify-between gap-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div>
            <label htmlFor="report-astro" className="block text-xs font-medium text-[#172B45] mb-1">
              Astronaut Scope
            </label>
            <select
              id="report-astro"
              value={selectedAstroId}
              onChange={(e) => setSelectedAstroId(e.target.value)}
              className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
            >
              <option value="ALL">All Crew ({state.astronauts.length})</option>
              {state.astronauts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-start" className="block text-xs font-medium text-[#172B45] mb-1">
              Start Date
            </label>
            <input
              id="report-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
            />
          </div>
          <div>
            <label htmlFor="report-end" className="block text-xs font-medium text-[#172B45] mb-1">
              End Date
            </label>
            <input
              id="report-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setGeneratedAt(new Date().toLocaleString())}
            className="astra-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA]"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#2878C7]" />
            <span>Generate Report</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="astra-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="astra-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#172B45] bg-[#F5F7FA] border border-slate-200 hover:bg-slate-200/70 rounded-lg"
          >
            <Printer className="w-3.5 h-3.5 text-[#718096]" />
            <span>Print Report</span>
          </button>
        </div>
      </section>

      {/* Printable Report Document */}
      <div className="astra-card p-6 sm:p-8 space-y-8">
        {/* Report Header */}
        <header className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#718096]">
              ASTRA MISSION HEALTH REPORT · FICTIONAL PROTOTYPE DATA
            </div>
            <h2 className="text-2xl font-semibold text-[#172B45] mt-1 tracking-tight">
              Mission {state.settings.mission.name} — Health &amp; Wellness Summary
            </h2>
            <p className="text-xs text-[#718096] mt-1.5">
              Reporting Period: <span className="font-mono text-[#172B45]">{startDate}</span> to{' '}
              <span className="font-mono text-[#172B45]">{endDate}</span> · Scenario Mode:{' '}
              <span className="font-mono text-[#172B45]">{state.scenarioMode}</span>
            </p>
          </div>
          <div className="text-xs text-[#718096] sm:text-right">
            <div>
              Mission Day {state.settings.mission.currentDay} of{' '}
              {state.settings.mission.durationDays}
            </div>
            <div className="font-mono mt-0.5">Generated: {generatedAt}</div>
          </div>
        </header>

        {/* 1. Mission Health Summary */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 print-break-inside-avoid">
          <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-4">
            <div className="text-xs text-[#718096]">Astronauts Covered</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#172B45] mt-1.5">
              {targetAstronauts.length}
            </div>
          </div>
          <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-4">
            <div className="text-xs text-[#718096]">Health Samples</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#172B45] mt-1.5">
              {filteredData.readings.length}
            </div>
          </div>
          <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-4">
            <div className="text-xs text-[#718096]">Alerts Logged</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#172B45] mt-1.5">
              {filteredData.alerts.length}
            </div>
          </div>
          <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-4">
            <div className="text-xs text-[#718096]">Sleep &amp; Activity Logs</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#172B45] mt-1.5">
              {filteredData.sleep.length + filteredData.activity.length}
            </div>
          </div>
        </section>

        {/* 2. Individual Astronaut Summaries */}
        <section className="space-y-3 print-break-inside-avoid">
          <h3 className="text-sm font-semibold text-[#172B45]">
            Individual Astronaut Health, Sleep &amp; Activity Summary
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F5F7FA] text-[#718096] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Astronaut</th>
                  <th className="py-2.5 px-3 font-medium">Role</th>
                  <th className="py-2.5 px-3 font-medium text-right">Samples</th>
                  <th className="py-2.5 px-3 font-medium text-right">Avg HR</th>
                  <th className="py-2.5 px-3 font-medium text-right">Avg SpO2</th>
                  <th className="py-2.5 px-3 font-medium text-right">Avg Temp</th>
                  <th className="py-2.5 px-3 font-medium text-right">Avg Sleep</th>
                  <th className="py-2.5 px-3 font-medium text-right">Activity Total</th>
                  <th className="py-2.5 px-3 font-medium">Latest Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {astronautSummaries.map((row) => (
                  <tr key={row.astro.id} className="hover:bg-[#F5F7FA]/60">
                    <td className="py-2.5 px-3 font-medium text-[#172B45]">
                      {row.astro.name} ({row.astro.code})
                    </td>
                    <td className="py-2.5 px-3 text-[#718096]">{row.astro.role}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#172B45]">
                      {row.samples}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right font-medium text-[#172B45]">
                      {row.avgHr} BPM
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right font-medium text-[#172B45]">
                      {row.avgSpo2}%
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right font-medium text-[#172B45]">
                      {row.avgTemp}°C
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#172B45]">
                      {row.avgSleep} hrs
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#172B45]">
                      {row.totalActivityMins} min
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusIndicator status={row.latestStatus} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Environmental Monitoring Summary */}
        <section className="space-y-3 print-break-inside-avoid">
          <h3 className="text-sm font-semibold text-[#172B45]">
            Environmental Monitoring Summary (Simulated Cabin Telemetry)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
              <span className="text-[#718096] block">Mean Cabin Temp</span>
              <span className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1 block">
                {envSummary.avgTemp}
              </span>
            </div>
            <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
              <span className="text-[#718096] block">Mean Relative Humidity</span>
              <span className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1 block">
                {envSummary.avgHumidity}
              </span>
            </div>
            <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
              <span className="text-[#718096] block">Mean Radiation Monitor</span>
              <span className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1 block">
                {envSummary.avgRad}
              </span>
            </div>
            <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
              <span className="text-[#718096] block">Latest Cabin Status</span>
              <div className="mt-1.5">
                <StatusIndicator status={envSummary.latestStatus} compact />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Alert History */}
        <section className="space-y-3 print-break-inside-avoid">
          <h3 className="text-sm font-semibold text-[#172B45]">
            Alert History ({filteredData.alerts.length})
          </h3>
          {filteredData.alerts.length === 0 ? (
            <p className="text-xs text-[#718096]">No alerts recorded in the selected date range.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7FA] text-[#718096] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Timestamp</th>
                    <th className="py-2.5 px-3 font-medium">Subject</th>
                    <th className="py-2.5 px-3 font-medium">Parameter</th>
                    <th className="py-2.5 px-3 font-medium">Severity</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.alerts.map((al) => (
                    <tr key={al.id} className="hover:bg-[#F5F7FA]/60">
                      <td className="py-2 px-3 font-mono tabular-nums text-[#718096] whitespace-nowrap">
                        {new Date(al.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-medium text-[#172B45]">{al.astronautName}</td>
                      <td className="py-2 px-3 text-[#172B45]">
                        {al.parameter} ({al.currentValue})
                      </td>
                      <td className="py-2 px-3">
                        <StatusIndicator status={al.severity} compact />
                      </td>
                      <td className="py-2 px-3 font-mono text-[#718096]">{al.status}</td>
                      <td className="py-2 px-3 text-[#718096]">{al.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="pt-4 border-t border-slate-200 text-[11px] text-[#718096]">
          ASTRA Prototype Disclaimer: All values, thresholds, and alerts in this report are for
          educational and hackathon demonstration purposes only. Not affiliated with NASA and not
          intended for clinical or diagnostic use.
        </footer>
      </div>
    </div>
  );
};
