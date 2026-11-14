import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Edit2, Plus } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { StatusIndicator } from '../components/StatusBadge';
import { useAstra } from '../context/AstraContext';
import { SleepRecord } from '../types/astra';

export const SleepWellness: React.FC = () => {
  const { state, selectAstronaut, addOrUpdateSleepRecord } = useAstra();

  const selectedAstronaut = useMemo(
    () =>
      state.astronauts.find((a) => a.id === state.selectedAstronautId) ?? state.astronauts[0] ?? null,
    [state.astronauts, state.selectedAstronautId]
  );

  const astroSleep = useMemo(() => {
    if (!selectedAstronaut) return [];
    return state.sleepRecords
      .filter((s) => s.astronautId === selectedAstronaut.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedAstronaut, state.sleepRecords]);

  const latestSleep = astroSleep[astroSleep.length - 1];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [durationHours, setDurationHours] = useState<string>('7.4');
  const [qualityScore, setQualityScore] = useState<string>('82');
  const [notes, setNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const avgDuration = useMemo(() => {
    if (astroSleep.length === 0) return '0.0';
    return (astroSleep.reduce((s, r) => s + r.durationHours, 0) / astroSleep.length).toFixed(1);
  }, [astroSleep]);

  const avgQuality = useMemo(() => {
    if (astroSleep.length === 0) return 0;
    return Math.round(astroSleep.reduce((s, r) => s + r.qualityScore, 0) / astroSleep.length);
  }, [astroSleep]);

  const chartData = useMemo(() => {
    return astroSleep.slice(-10).map((s) => ({
      date: s.date.slice(5),
      hours: s.durationHours,
      quality: s.qualityScore,
    }));
  }, [astroSleep]);

  const startEdit = (rec: SleepRecord) => {
    setEditingId(rec.id);
    setDate(rec.date);
    setDurationHours(String(rec.durationHours));
    setQualityScore(String(rec.qualityScore));
    setNotes(rec.notes);
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setDurationHours('7.4');
    setQualityScore('82');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAstronaut) return;
    addOrUpdateSleepRecord({
      id: editingId ?? undefined,
      astronautId: selectedAstronaut.id,
      date,
      durationHours: Number(durationHours),
      qualityScore: Number(qualityScore),
      notes: notes.trim(),
    });
    setFeedback(editingId ? 'Wellness record updated.' : 'Daily wellness record added.');
    resetForm();
    window.setTimeout(() => setFeedback(''), 2500);
  };

  if (!selectedAstronaut) {
    return (
      <div className="astra-card p-8 text-center text-sm text-[#718096]">
        No astronauts available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Selector */}
      <section className="astra-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label htmlFor="sleep-astro-select" className="block text-[11px] text-[#718096] mb-1">
            Astronaut
          </label>
          <select
            id="sleep-astro-select"
            value={selectedAstronaut.id}
            onChange={(e) => {
              selectAstronaut(e.target.value);
              resetForm();
            }}
            className="text-sm font-semibold text-[#172B45] bg-[#F5F7FA] border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
          >
            {state.astronauts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-[#718096]">
          Demo wellness rules: Normal (&ge;6.8h &amp; quality &ge;72) · Attention (&lt;6.8h or quality
          &lt;72) · Warning (&lt;5.5h or quality &lt;55)
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Latest Sleep Duration</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]">
              {latestSleep ? <AnimatedNumber value={latestSleep.durationHours} decimals={1} /> : '—'}
            </span>
            <span className="text-xs font-mono text-[#718096]">hrs</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">7-day avg: {avgDuration} hrs</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Sleep Quality (Simulated)</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]">
              {latestSleep ? <AnimatedNumber value={latestSleep.qualityScore} /> : '—'}
            </span>
            <span className="text-xs font-mono text-[#718096]">/ 100</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">7-day avg: {avgQuality} / 100</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Fatigue Indicator</div>
          <div className="text-2xl font-semibold text-[#172B45] mt-2">
            {latestSleep?.fatigueLevel ?? 'Low'}
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Derived from latest rest cycle</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Wellness Status</div>
          <div className="mt-2.5">
            <StatusIndicator status={latestSleep?.wellnessStatus ?? 'NORMAL'} />
          </div>
          <div className="text-xs text-[#718096] mt-2">Demonstration wellness assessment</div>
        </div>
      </section>

      {/* Chart + Add/Edit Form */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 astra-card astra-card-surface p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#172B45]">Sleep Duration &amp; Quality Pattern</h3>
            <p className="text-xs text-[#718096]">Daily orbital rest duration (hours) and quality score</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#718096' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    borderColor: '#E2E8F0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="hours"
                  name="Sleep Hours"
                  fill="#2878C7"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="quality"
                  name="Quality Score"
                  fill="#55B9E8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-5 astra-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#172B45]">
              {editingId ? 'Edit Daily Wellness Record' : 'Add Daily Wellness Record'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="astra-btn text-xs text-[#718096] hover:text-[#172B45]"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#172B45] mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#172B45] mb-1">
                  Duration (hrs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={1}
                  max={14}
                  required
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#172B45] mb-1">
                  Quality (1–100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={qualityScore}
                  onChange={(e) => setQualityScore(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Manual Wellness Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Sleep schedule, rest interruption, or general wellness notes..."
                className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>

            <button
              type="submit"
              className="astra-btn w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Update Wellness Record' : 'Save Wellness Record'}</span>
            </button>

            {feedback && <p className="text-xs font-medium text-[#1E7E53]">{feedback}</p>}
          </form>
        </div>
      </div>

      {/* Sleep History Table */}
      <section className="astra-card p-5">
        <h3 className="text-sm font-semibold text-[#172B45] mb-3">
          Sleep &amp; Wellness History ({selectedAstronaut.name})
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F7FA] text-[#718096] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-medium">Date</th>
                <th className="py-2.5 px-3 font-medium text-right">Duration</th>
                <th className="py-2.5 px-3 font-medium text-right">Quality</th>
                <th className="py-2.5 px-3 font-medium">Fatigue</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Notes</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...astroSleep].reverse().map((rec) => (
                <tr key={rec.id} className="hover:bg-[#F5F7FA]/70">
                  <td className="py-2.5 px-3 font-mono tabular-nums text-[#718096]">{rec.date}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#172B45] font-semibold">
                    {rec.durationHours.toFixed(1)} hrs
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#172B45]">
                    {rec.qualityScore} / 100
                  </td>
                  <td className="py-2.5 px-3 text-[#172B45]">{rec.fatigueLevel}</td>
                  <td className="py-2.5 px-3">
                    <StatusIndicator status={rec.wellnessStatus} compact />
                  </td>
                  <td className="py-2.5 px-3 text-[#718096] max-w-xs truncate">{rec.notes || '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(rec)}
                      className="astra-btn inline-flex items-center gap-1 text-[#2878C7] hover:text-[#2065A9] font-medium"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
