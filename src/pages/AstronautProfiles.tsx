import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { AvatarInitials, StatusIndicator } from '../components/StatusBadge';
import { useAstra } from '../context/AstraContext';
import { Astronaut, NavSection } from '../types/astra';

interface AstronautProfilesProps {
  onNavigate: (section: NavSection) => void;
}

interface AstronautFormState {
  name: string;
  code: string;
  age: number;
  role: string;
  missionName: string;
  restingHeartRate: number;
  normalSpo2: number;
  normalTemp: number;
  normalRespRate: number;
  normalSystolicBp: number;
  normalDiastolicBp: number;
  wellnessNotes: string;
}

export const AstronautProfiles: React.FC<AstronautProfilesProps> = ({ onNavigate }) => {
  const { state, selectAstronaut, addAstronaut, updateAstronaut, deleteAstronaut } = useAstra();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Astronaut | null>(null);

  const [form, setForm] = useState<AstronautFormState>({
    name: '',
    code: '',
    age: 35,
    role: 'Mission Specialist',
    missionName: state.settings.mission.name,
    restingHeartRate: 66,
    normalSpo2: 98.2,
    normalTemp: 36.7,
    normalRespRate: 15,
    normalSystolicBp: 118,
    normalDiastolicBp: 76,
    wellnessNotes: '',
  });

  const selectedAstronaut = useMemo(
    () =>
      state.astronauts.find((a) => a.id === state.selectedAstronautId) ?? state.astronauts[0] ?? null,
    [state.astronauts, state.selectedAstronautId]
  );

  const selectedHistory = useMemo(() => {
    if (!selectedAstronaut) return { readings: [], sleep: [], activity: [], alerts: [] };
    return {
      readings: state.readings
        .filter((r) => r.astronautId === selectedAstronaut.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      sleep: state.sleepRecords
        .filter((s) => s.astronautId === selectedAstronaut.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
      activity: state.activityRecords
        .filter((ac) => ac.astronautId === selectedAstronaut.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
      alerts: state.alerts
        .filter((al) => al.astronautId === selectedAstronaut.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    };
  }, [selectedAstronaut, state.readings, state.sleepRecords, state.activityRecords, state.alerts]);

  const openAddModal = () => {
    const nextNum = String(state.astronauts.length + 1).padStart(3, '0');
    setEditingId(null);
    setForm({
      name: '',
      code: `AST-${nextNum}`,
      age: 35,
      role: 'Mission Specialist',
      missionName: state.settings.mission.name,
      restingHeartRate: 66,
      normalSpo2: 98.2,
      normalTemp: 36.7,
      normalRespRate: 15,
      normalSystolicBp: 118,
      normalDiastolicBp: 76,
      wellnessNotes: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (astro: Astronaut) => {
    setEditingId(astro.id);
    setForm({
      name: astro.name,
      code: astro.code,
      age: astro.age,
      role: astro.role,
      missionName: astro.missionName,
      restingHeartRate: astro.baseline.restingHeartRate,
      normalSpo2: astro.baseline.normalSpo2,
      normalTemp: astro.baseline.normalTemp,
      normalRespRate: astro.baseline.normalRespRate,
      normalSystolicBp: astro.baseline.normalSystolicBp,
      normalDiastolicBp: astro.baseline.normalDiastolicBp,
      wellnessNotes: astro.wellnessNotes,
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      age: Number(form.age),
      role: form.role.trim(),
      missionName: form.missionName.trim() || state.settings.mission.name,
      baseline: {
        restingHeartRate: Number(form.restingHeartRate),
        normalSpo2: Number(form.normalSpo2),
        normalTemp: Number(form.normalTemp),
        normalRespRate: Number(form.normalRespRate),
        normalSystolicBp: Number(form.normalSystolicBp),
        normalDiastolicBp: Number(form.normalDiastolicBp),
      },
      wellnessNotes: form.wellnessNotes.trim(),
    };

    if (editingId) {
      updateAstronaut(editingId, payload);
    } else {
      addAstronaut(payload);
    }
    setIsFormOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteAstronaut(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#172B45]">Crew Roster &amp; Baselines</h2>
          <p className="text-xs text-[#718096]">
            Manage astronaut profiles, individual health baselines, and view personal telemetry history
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="astra-btn inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Astronaut</span>
        </button>
      </div>

      {state.astronauts.length === 0 ? (
        <div className="astra-card p-10 text-center space-y-3">
          <p className="text-sm font-medium text-[#172B45]">No astronaut profiles configured</p>
          <p className="text-xs text-[#718096]">
            Add an astronaut profile to track individual baselines, telemetry readings, and alerts.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="astra-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Astronaut</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Astronaut Roster List with Hover/Click Micro-Interactions */}
          <div className="lg:col-span-5 space-y-3">
            {state.astronauts.map((astro) => {
              const isSelected = selectedAstronaut?.id === astro.id;
              const latest = state.readings
                .filter((r) => r.astronautId === astro.id)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

              return (
                <div
                  key={astro.id}
                  className={`astra-card astra-card-interactive p-4 ${
                    isSelected
                      ? 'border-[#2878C7] ring-1 ring-[#2878C7]/20'
                      : 'hover:border-[#93C0EB]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => selectAstronaut(astro.id)}
                      className="flex items-center gap-3 text-left min-w-0 flex-1"
                    >
                      <AvatarInitials initials={astro.initials} color={astro.avatarColor} />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#172B45] truncate">{astro.name}</div>
                        <div className="text-xs text-[#718096] truncate">
                          {astro.code} · {astro.role} · Age {astro.age}
                        </div>
                      </div>
                    </button>
                    <StatusIndicator status={latest?.status ?? 'NORMAL'} compact />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[#718096] block">Base HR</span>
                      <span className="font-mono tabular-nums font-semibold text-[#172B45]">
                        {astro.baseline.restingHeartRate} BPM
                      </span>
                    </div>
                    <div>
                      <span className="text-[#718096] block">Base SpO2</span>
                      <span className="font-mono tabular-nums font-semibold text-[#172B45]">
                        {astro.baseline.normalSpo2}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[#718096] block">Base Temp</span>
                      <span className="font-mono tabular-nums font-semibold text-[#172B45]">
                        {astro.baseline.normalTemp}°C
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        selectAstronaut(astro.id);
                        onNavigate('live');
                      }}
                      className="astra-btn text-xs font-medium text-[#2878C7] hover:text-[#2065A9]"
                    >
                      Open Live Monitor
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(astro)}
                        className="astra-btn p-2 text-[#718096] hover:text-[#172B45] hover:bg-[#F5F7FA] rounded-md"
                        aria-label={`Edit ${astro.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(astro)}
                        className="astra-btn p-2 text-[#718096] hover:text-[#B83232] hover:bg-[#FDF4F4] rounded-md"
                        aria-label={`Delete ${astro.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Astronaut Detail & History with Smooth Switch Transition */}
          {selectedAstronaut && (
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedAstronaut.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="astra-card p-6 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <AvatarInitials
                        initials={selectedAstronaut.initials}
                        color={selectedAstronaut.avatarColor}
                        size="lg"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-[#172B45]">
                          {selectedAstronaut.name}
                        </h3>
                        <div className="text-xs text-[#718096]">
                          {selectedAstronaut.code} · {selectedAstronaut.role} · Mission{' '}
                          {selectedAstronaut.missionName} · Age {selectedAstronaut.age}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedAstronaut)}
                      className="astra-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA] self-start"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#718096]" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  {/* Personal Baseline Grid */}
                  <div>
                    <h4 className="text-xs font-semibold text-[#718096] uppercase tracking-wider mb-3">
                      Personal Health Baseline (Demonstration Reference)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
                        <div className="text-[11px] text-[#718096]">Resting Heart Rate</div>
                        <div className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                          {selectedAstronaut.baseline.restingHeartRate} BPM
                        </div>
                      </div>
                      <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
                        <div className="text-[11px] text-[#718096]">Normal SpO2</div>
                        <div className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                          {selectedAstronaut.baseline.normalSpo2}%
                        </div>
                      </div>
                      <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
                        <div className="text-[11px] text-[#718096]">Normal Body Temp</div>
                        <div className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                          {selectedAstronaut.baseline.normalTemp}°C
                        </div>
                      </div>
                      <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
                        <div className="text-[11px] text-[#718096]">Respiratory Rate</div>
                        <div className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                          {selectedAstronaut.baseline.normalRespRate} br/min
                        </div>
                      </div>
                      <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
                        <div className="text-[11px] text-[#718096]">Blood Pressure</div>
                        <div className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                          {selectedAstronaut.baseline.normalSystolicBp}/
                          {selectedAstronaut.baseline.normalDiastolicBp} mmHg
                        </div>
                      </div>
                      <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
                        <div className="text-[11px] text-[#718096]">Records Logged</div>
                        <div className="text-base font-semibold font-mono tabular-nums text-[#172B45] mt-1">
                          {selectedHistory.readings.length} vitals
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wellness Notes */}
                  <div>
                    <h4 className="text-xs font-semibold text-[#718096] uppercase tracking-wider mb-1.5">
                      Wellness Notes
                    </h4>
                    <p className="text-sm text-[#172B45] leading-relaxed">
                      {selectedAstronaut.wellnessNotes || 'No wellness notes recorded.'}
                    </p>
                  </div>

                  {/* Individual Health History Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
                        Recent Individual Health Readings
                      </h4>
                      <button
                        type="button"
                        onClick={() => onNavigate('analytics')}
                        className="astra-btn text-xs font-medium text-[#2878C7] hover:text-[#2065A9]"
                      >
                        Full Analytics
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#F5F7FA] text-[#718096] border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 font-medium">Timestamp</th>
                            <th className="py-2.5 px-3 font-medium text-right">HR</th>
                            <th className="py-2.5 px-3 font-medium text-right">SpO2</th>
                            <th className="py-2.5 px-3 font-medium text-right">Temp</th>
                            <th className="py-2.5 px-3 font-medium text-right">Resp</th>
                            <th className="py-2.5 px-3 font-medium">Source</th>
                            <th className="py-2.5 px-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedHistory.readings.slice(0, 8).map((r) => (
                            <tr key={r.id} className="hover:bg-[#F5F7FA]/70">
                              <td className="py-2 px-3 font-mono tabular-nums text-[#718096] whitespace-nowrap">
                                {new Date(r.timestamp).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums text-right font-medium text-[#172B45]">
                                {r.heartRate}
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums text-right font-medium text-[#172B45]">
                                {r.spo2.toFixed(1)}%
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums text-right font-medium text-[#172B45]">
                                {r.temperature.toFixed(1)}°C
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums text-right font-medium text-[#172B45]">
                                {r.respiratoryRate}
                              </td>
                              <td className="py-2 px-3 text-[#718096] font-mono">{r.source}</td>
                              <td className="py-2 px-3">
                                <StatusIndicator status={r.status} compact />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101D32]/55 p-4">
          <div className="astra-card max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-[#172B45]">
                {editingId ? 'Edit Astronaut Profile' : 'Add New Astronaut'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="astra-btn p-1.5 text-[#718096] hover:text-[#172B45] rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#172B45] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Elena Vance"
                    className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172B45] mb-1">
                    Astronaut ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="AST-004"
                    className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172B45] mb-1">Age</label>
                  <input
                    type="number"
                    min={21}
                    max={70}
                    required
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172B45] mb-1">
                    Mission Role
                  </label>
                  <input
                    type="text"
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#718096] uppercase tracking-wider mb-2">
                  Personal Health Baseline Values
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Resting HR (BPM)</label>
                    <input
                      type="number"
                      min={40}
                      max={110}
                      required
                      value={form.restingHeartRate}
                      onChange={(e) =>
                        setForm({ ...form, restingHeartRate: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Normal SpO2 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={90}
                      max={100}
                      required
                      value={form.normalSpo2}
                      onChange={(e) => setForm({ ...form, normalSpo2: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Normal Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={35}
                      max={38}
                      required
                      value={form.normalTemp}
                      onChange={(e) => setForm({ ...form, normalTemp: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Resp Rate (br/min)</label>
                    <input
                      type="number"
                      min={8}
                      max={30}
                      required
                      value={form.normalRespRate}
                      onChange={(e) =>
                        setForm({ ...form, normalRespRate: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Systolic BP</label>
                    <input
                      type="number"
                      min={85}
                      max={160}
                      required
                      value={form.normalSystolicBp}
                      onChange={(e) =>
                        setForm({ ...form, normalSystolicBp: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Diastolic BP</label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      required
                      value={form.normalDiastolicBp}
                      onChange={(e) =>
                        setForm({ ...form, normalDiastolicBp: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#172B45] mb-1">
                  Wellness Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={form.wellnessNotes}
                  onChange={(e) => setForm({ ...form, wellnessNotes: e.target.value })}
                  placeholder="Optional baseline or mission schedule notes..."
                  className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="astra-btn px-4 py-2 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="astra-btn px-4 py-2 text-xs font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg"
                >
                  {editingId ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101D32]/55 p-4">
          <div className="astra-card max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#172B45]">Delete Astronaut Profile?</h3>
            <p className="text-sm text-[#718096] leading-relaxed">
              Are you sure you want to remove <strong className="text-[#172B45]">{deleteTarget.name}</strong> (
              {deleteTarget.code})? All associated health readings, sleep records, activity logs, and
              alerts for this astronaut will also be deleted from local storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="astra-btn px-4 py-2 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="astra-btn px-4 py-2 text-xs font-medium text-white bg-[#C53B3B] hover:bg-[#AA2E2E] rounded-lg"
              >
                Delete Astronaut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
