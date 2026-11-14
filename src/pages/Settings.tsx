import React, { useState } from 'react';
import { Play, RotateCcw, Save } from 'lucide-react';
import { useAstra } from '../context/AstraContext';
import { AppSettings, ScenarioMode } from '../types/astra';

interface SettingsProps {
  onReplayIntro?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onReplayIntro }) => {
  const { state, isOnline, updateSettings, setScenarioMode, resetDemo } = useAstra();

  const [draft, setDraft] = useState<AppSettings>(state.settings);
  const [savedMsg, setSavedMsg] = useState<string>('');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(draft);
    setSavedMsg('Settings saved locally and applied to the analysis engine.');
    window.setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleResetConfirm = () => {
    resetDemo();
    setConfirmResetOpen(false);
    setSavedMsg('Demo data restored to original ORBIT-01 baseline state.');
    window.setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Mission Information */}
        <section className="astra-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#172B45]">Mission Information</h2>
            <p className="text-xs text-[#718096]">
              Update fictional mission metadata displayed across the dashboard and reports
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">Mission Name</label>
              <input
                type="text"
                required
                value={draft.mission.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    mission: { ...draft.mission, name: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={draft.mission.durationDays}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    mission: { ...draft.mission, durationDays: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Current Mission Day
              </label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={draft.mission.currentDay}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    mission: { ...draft.mission, currentDay: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Mission Status
              </label>
              <input
                type="text"
                required
                value={draft.mission.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    mission: { ...draft.mission, status: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
          </div>
        </section>

        {/* 2. Demonstration Threshold Configuration */}
        <section className="astra-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#172B45]">
              Demonstration Threshold Configuration
            </h2>
            <p className="text-xs text-[#718096]">
              Configurable demonstration rules used by the Health Analysis Engine. These are prototype
              parameters, not official medical or NASA limits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                HR Attention Delta (+BPM from baseline)
              </label>
              <input
                type="number"
                min={5}
                max={50}
                value={draft.thresholds.heartRateAttentionDelta}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    thresholds: {
                      ...draft.thresholds,
                      heartRateAttentionDelta: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                HR Warning High (BPM)
              </label>
              <input
                type="number"
                min={80}
                max={180}
                value={draft.thresholds.heartRateWarningHigh}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    thresholds: {
                      ...draft.thresholds,
                      heartRateWarningHigh: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                SpO2 Attention Minimum (%)
              </label>
              <input
                type="number"
                step="0.1"
                min={85}
                max={99}
                value={draft.thresholds.spo2AttentionMin}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    thresholds: { ...draft.thresholds, spo2AttentionMin: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                SpO2 Warning Minimum (%)
              </label>
              <input
                type="number"
                step="0.1"
                min={80}
                max={97}
                value={draft.thresholds.spo2WarningMin}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    thresholds: { ...draft.thresholds, spo2WarningMin: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Body Temp Warning High (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min={37}
                max={41}
                value={draft.thresholds.tempWarningHigh}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    thresholds: { ...draft.thresholds, tempWarningHigh: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Resp Rate Warning High (br/min)
              </label>
              <input
                type="number"
                min={16}
                max={40}
                value={draft.thresholds.respRateWarningHigh}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    thresholds: {
                      ...draft.thresholds,
                      respRateWarningHigh: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Cabin Temp Warning High (°C)
              </label>
              <input
                type="number"
                step="0.5"
                min={22}
                max={35}
                value={draft.thresholds.cabinTempWarningHigh}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    thresholds: {
                      ...draft.thresholds,
                      cabinTempWarningHigh: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Radiation Warning Limit (mSv/day)
              </label>
              <input
                type="number"
                step="0.1"
                min={0.5}
                max={5}
                value={draft.thresholds.radiationWarningHigh}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    thresholds: {
                      ...draft.thresholds,
                      radiationWarningHigh: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172B45] mb-1">
                Monitoring Interval (seconds)
              </label>
              <select
                value={draft.monitoringIntervalSec}
                onChange={(e) =>
                  setDraft({ ...draft, monitoringIntervalSec: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm font-mono text-[#172B45] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2878C7]/35 focus:border-[#2878C7]"
              >
                <option value={2}>2 seconds</option>
                <option value={4}>4 seconds</option>
                <option value={8}>8 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div>
              {savedMsg && <span className="text-xs font-medium text-[#1E7E53]">{savedMsg}</span>}
            </div>
            <button
              type="submit"
              className="astra-btn inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2878C7] hover:bg-[#2065A9] rounded-lg"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </section>
      </form>

      {/* 3. Demonstration Scenario & Data Reset */}
      <section className="astra-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#172B45]">
            Demonstration Scenario &amp; Data Reset
          </h2>
          <p className="text-xs text-[#718096]">
            Switch between simulated demonstration states or restore the original 7-day sample
            dataset
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['NORMAL', 'ATTENTION', 'WARNING'] as ScenarioMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setScenarioMode(mode)}
                className={`astra-btn px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  state.scenarioMode === mode
                    ? 'bg-[#2878C7] text-white border-[#2878C7]'
                    : 'bg-white text-[#172B45] border-slate-200 hover:bg-[#F5F7FA]'
                }`}
              >
                {mode} SCENARIO
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="astra-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#B83232] bg-[#FDF4F4] border border-[#F2CECE] rounded-lg hover:bg-[#FCE8E8]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </section>

      {/* 4. Application Information & Offline Persistence */}
      <section className="astra-card p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#172B45]">
            Application Information &amp; Offline Storage
          </h2>
          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              className="astra-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA] hover:border-[#bfd7ee]"
            >
              <Play className="w-3.5 h-3.5 text-[#2878C7]" />
              <span>Replay Opening Intro</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
            <span className="text-[#718096] block">Storage Engine</span>
            <span className="font-semibold text-[#172B45] mt-0.5 block">Browser localStorage</span>
          </div>
          <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
            <span className="text-[#718096] block">Network State</span>
            <span className="font-semibold text-[#172B45] mt-0.5 block">
              {isOnline ? 'Online (Local-First Active)' : 'Offline (Local Data Available)'}
            </span>
          </div>
          <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
            <span className="text-[#718096] block">Stored Health Readings</span>
            <span className="font-mono tabular-nums font-semibold text-[#172B45] mt-0.5 block">
              {state.readings.length} records
            </span>
          </div>
          <div className="bg-[#F5F7FA] border border-slate-200/70 rounded-lg p-3.5">
            <span className="text-[#718096] block">Crew Profiles / Alerts</span>
            <span className="font-mono tabular-nums font-semibold text-[#172B45] mt-0.5 block">
              {state.astronauts.length} profiles · {state.alerts.length} alerts
            </span>
          </div>
        </div>
        <p className="text-xs text-[#718096] leading-relaxed pt-1">
          ASTRA is a standalone educational and hackathon prototype. All data is persisted locally in
          your browser and does not sync to a remote server. ASTRA is not affiliated with NASA and
          does not connect to physical aerospace or medical hardware.
        </p>
      </section>

      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101D32]/55 p-4">
          <div className="astra-card max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#172B45]">Reset All Demo Data?</h3>
            <p className="text-sm text-[#718096] leading-relaxed">
              This will restore the default three astronauts (Alex Morgan, Sarah Chen, Daniel
              Carter), the 7-day ORBIT-01 dataset, and default threshold settings.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="astra-btn px-4 py-2 text-xs font-medium text-[#172B45] bg-white border border-slate-200 rounded-lg hover:bg-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="astra-btn px-4 py-2 text-xs font-medium text-white bg-[#C53B3B] hover:bg-[#AA2E2E] rounded-lg"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
