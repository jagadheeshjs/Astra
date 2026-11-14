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
import { Plus } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { useAstra } from '../context/AstraContext';
import { ActivityRecord } from '../types/astra';

const EXERCISE_OPTIONS = [
  'ARED Resistive Training',
  'T2 Treadmill Interval',
  'CEVIS Cycle Ergometer',
  'Core & Mobility Protocol',
  'EVA Suit Conditioning',
];

export const PhysicalActivity: React.FC = () => {
  const { state, selectAstronaut, addActivityRecord } = useAstra();

  const selectedAstronaut = useMemo(
    () =>
      state.astronauts.find((a) => a.id === state.selectedAstronautId) ?? state.astronauts[0] ?? null,
    [state.astronauts, state.selectedAstronautId]
  );

  const astroActivities = useMemo(() => {
    if (!selectedAstronaut) return [];
    return state.activityRecords
      .filter((ac) => ac.astronautId === selectedAstronaut.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedAstronaut, state.activityRecords]);

  const summary = useMemo(() => {
    const totalMinutes = astroActivities.reduce((s, r) => s + r.durationMinutes, 0);
    const totalKcal = astroActivities.reduce((s, r) => s + r.caloriesBurned, 0);
    const avgMinutes =
      astroActivities.length > 0 ? Math.round(totalMinutes / astroActivities.length) : 0;
    return {
      sessions: astroActivities.length,
      totalMinutes,
      avgMinutes,
      totalKcal,
    };
  }, [astroActivities]);

  const chartData = useMemo(() => {
    return astroActivities.slice(-10).map((a) => ({
      date: a.date.slice(5),
      minutes: a.durationMinutes,
      kcal: a.caloriesBurned,
    }));
  }, [astroActivities]);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [exerciseType, setExerciseType] = useState<string>(EXERCISE_OPTIONS[0]);
  const [durationMinutes, setDurationMinutes] = useState<string>('45');
  const [intensity, setIntensity] = useState<ActivityRecord['intensity']>('Moderate');
  const [caloriesBurned, setCaloriesBurned] = useState<string>('320');
  const [notes, setNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAstronaut) return;
    addActivityRecord({
      astronautId: selectedAstronaut.id,
      date,
      exerciseType,
      durationMinutes: Number(durationMinutes),
      intensity,
      caloriesBurned: Number(caloriesBurned),
      notes: notes.trim(),
    });
    setNotes('');
    setFeedback('Activity session recorded.');
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
      {/* Selector Bar */}
      <section className="astra-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label htmlFor="activity-astro-select" className="block text-[11px] text-[#718096] mb-1">
            Astronaut
          </label>
          <select
            id="activity-astro-select"
            value={selectedAstronaut.id}
            onChange={(e) => selectAstronaut(e.target.value)}
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
          Simulated &amp; manual countermeasure exercise tracking
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Average Daily Duration</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <AnimatedNumber
              value={summary.avgMinutes}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
            <span className="text-xs font-mono text-[#718096]">min</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Per logged session</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Exercise Sessions</div>
          <div className="mt-2">
            <AnimatedNumber
              value={summary.sessions}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Total sessions recorded</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Cumulative Active Time</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <AnimatedNumber
              value={summary.totalMinutes}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
            <span className="text-xs font-mono text-[#718096]">min</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Mission total</div>
        </div>

        <div className="astra-card astra-card-surface p-5">
          <div className="text-xs font-medium text-[#718096]">Estimated Energy Expenditure</div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <AnimatedNumber
              value={summary.totalKcal}
              className="text-2xl font-semibold font-mono tabular-nums text-[#172B45]"
            />
            <span className="text-xs font-mono text-[#718096]">kcal</span>
          </div>
          <div className="text-xs text-[#718096] mt-1.5">Estimated cumulative output</div>
        </div>
      </section>

      {/* Chart + Manual Activity Form */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 astra-card astra-card-surface p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#172B45]">Activity Trend Chart</h3>
            <p className="text-xs text-[#718096]">Daily exercise duration (min) and estimated energy (kcal)</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#718096' }} />
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
                  dataKey="minutes"
                  name="Duration (min)"
                  fill="#2878C7"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="kcal"
                  name="Est. Energy (kcal)"
                  fill="#1F8A5B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-5 astra-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#172B45]">Log Physical Activity Session</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="block text-xs font-medium text-[#172B45] mb-1">Intensity</label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as ActivityRecord['intensity'])}
                  className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                >
                  <option value="Light">Light</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Vigorous">Vigorous</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">Exercise Type</label>
              <select
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              >
                {EXERCISE_OPTIONS.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#172B45] mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  required
                  value={durationMinutes}
                  onChange={(e) => {
                    setDurationMinutes(e.target.value);
                    const mins = Number(e.target.value) || 0;
                    const mult = intensity === 'Vigorous' ? 9.5 : intensity === 'Moderate' ? 7.2 : 4.8;
                    setCaloriesBurned(String(Math.round(mins * mult)));
                  }}
                  className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#172B45] mb-1">
                  Est. Energy (kcal)
                </label>
                <input
                  type="number"
                  min={10}
                  max={3000}
                  required
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional session observations..."
                className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>

            <button
              type="submit"
              className="astra-btn w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Activity Record</span>
            </button>

            {feedback && <p className="text-xs font-medium text-[#1E7E53]">{feedback}</p>}
          </form>
        </div>
      </div>

      {/* Activity History Table */}
      <section className="astra-card p-5">
        <h3 className="text-sm font-semibold text-[#172B45] mb-3">
          Activity History ({selectedAstronaut.name})
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F7FA] text-[#718096] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-medium">Date</th>
                <th className="py-2.5 px-3 font-medium">Exercise Protocol</th>
                <th className="py-2.5 px-3 font-medium">Intensity</th>
                <th className="py-2.5 px-3 font-medium text-right">Duration</th>
                <th className="py-2.5 px-3 font-medium text-right">Est. Energy</th>
                <th className="py-2.5 px-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...astroActivities].reverse().map((act) => (
                <tr key={act.id} className="hover:bg-[#F5F7FA]/70">
                  <td className="py-2.5 px-3 font-mono tabular-nums text-[#718096]">{act.date}</td>
                  <td className="py-2.5 px-3 font-medium text-[#172B45]">{act.exerciseType}</td>
                  <td className="py-2.5 px-3 text-[#718096]">{act.intensity}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-[#172B45]">
                    {act.durationMinutes} min
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-[#172B45]">
                    {act.caloriesBurned} kcal
                  </td>
                  <td className="py-2.5 px-3 text-[#718096]">{act.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
