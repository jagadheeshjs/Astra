import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { buildScenarioData } from '../data/seedData';
import {
  ActivityRecord,
  AppSettings,
  AstraState,
  Astronaut,
  EnvironmentalReading,
  HealthAlert,
  HealthReading,
  ScenarioMode,
  SleepRecord,
} from '../types/astra';
import {
  evaluateEnvironmentalReading,
  evaluateHealthReading,
  evaluateSleepWellness,
} from '../utils/analysisEngine';

const STORAGE_KEY = 'astra_mission_state_v1';

interface AstraContextValue {
  state: AstraState;
  isMonitoring: boolean;
  isOnline: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  triggerSimulatedStep: () => void;
  selectAstronaut: (id: string) => void;
  setScenarioMode: (mode: ScenarioMode) => void;
  resetDemo: () => void;
  addAstronaut: (data: Omit<Astronaut, 'id' | 'initials' | 'avatarColor'>) => void;
  updateAstronaut: (id: string, data: Partial<Astronaut>) => void;
  deleteAstronaut: (id: string) => void;
  addManualReading: (
    astronautId: string,
    values: {
      heartRate: number;
      spo2: number;
      temperature: number;
      respiratoryRate: number;
      systolicBp: number;
      diastolicBp: number;
    }
  ) => void;
  addOrUpdateSleepRecord: (record: Omit<SleepRecord, 'id' | 'fatigueLevel' | 'wellnessStatus'> & { id?: string }) => void;
  addActivityRecord: (record: Omit<ActivityRecord, 'id'>) => void;
  simulateEnvironmentalSpike: (mode: 'NORMAL' | 'WARNING') => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  updateSettings: (settings: AppSettings) => void;
  toastAlert: HealthAlert | null;
  dismissToast: () => void;
}

const AstraContext = createContext<AstraContextValue | null>(null);

const AVATAR_COLORS = ['#2563EB', '#0284C7', '#1E40AF', '#0F766E', '#4338CA', '#0369A1'];

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function loadInitialState(): AstraState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AstraState;
      if (parsed && Array.isArray(parsed.astronauts) && parsed.astronauts.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data if storage is unavailable or corrupted
  }
  return buildScenarioData('NORMAL');
}

function appendUniqueAlerts(
  existingAlerts: HealthAlert[],
  candidates: Omit<HealthAlert, 'id' | 'status'>[]
): HealthAlert[] {
  if (candidates.length === 0) return existingAlerts;

  const activeConditionKeys = new Set(
    existingAlerts
      .filter((a) => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED')
      .map((a) => a.conditionKey)
  );

  const newAlerts: HealthAlert[] = [];
  candidates.forEach((cand, idx) => {
    if (!activeConditionKeys.has(cand.conditionKey)) {
      activeConditionKeys.add(cand.conditionKey);
      newAlerts.push({
        ...cand,
        id: `alt-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'ACTIVE',
      });
    }
  });

  if (newAlerts.length === 0) return existingAlerts;
  return [...newAlerts, ...existingAlerts];
}

export const AstraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AstraState>(loadInitialState);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [toastAlert, setToastAlert] = useState<HealthAlert | null>(null);
  const seenAlertIdsRef = useRef<Set<string>>(new Set(state.alerts.map((a) => a.id)));

  useEffect(() => {
    const newActive = state.alerts.find(
      (a) => a.status === 'ACTIVE' && !seenAlertIdsRef.current.has(a.id)
    );
    state.alerts.forEach((a) => seenAlertIdsRef.current.add(a.id));
    if (newActive) {
      setToastAlert(newActive);
    }
  }, [state.alerts]);

  useEffect(() => {
    if (!toastAlert) return;
    const timer = window.setTimeout(() => setToastAlert(null), 7000);
    return () => window.clearTimeout(timer);
  }, [toastAlert]);

  const dismissToast = useCallback(() => setToastAlert(null), []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const generateSimulatedStep = useCallback(() => {
    setState((prev) => {
      const nowIso = new Date().toISOString();
      const newReadings: HealthReading[] = [];
      let nextAlerts = [...prev.alerts];

      prev.astronauts.forEach((astro, idx) => {
        const astroHistory = prev.readings.filter((r) => r.astronautId === astro.id);
        const latest = astroHistory[astroHistory.length - 1];

        let targetHr = astro.baseline.restingHeartRate + (Math.random() * 6 - 3);
        let targetSpo2 = astro.baseline.normalSpo2 + (Math.random() * 0.6 - 0.3);
        let targetTemp = astro.baseline.normalTemp + (Math.random() * 0.25 - 0.12);
        let targetResp = astro.baseline.normalRespRate + (Math.random() * 2 - 1);
        let targetSys = astro.baseline.normalSystolicBp + (Math.random() * 6 - 3);
        let targetDia = astro.baseline.normalDiastolicBp + (Math.random() * 4 - 2);

        if (prev.scenarioMode === 'ATTENTION' && idx === 1) {
          targetHr = astro.baseline.restingHeartRate + 20 + (Math.random() * 6 - 2);
          targetTemp = astro.baseline.normalTemp + 0.7 + (Math.random() * 0.2 - 0.1);
          targetResp = astro.baseline.normalRespRate + 3;
        } else if (prev.scenarioMode === 'WARNING' && idx === 0) {
          targetHr = 115 + (Math.random() * 8 - 3);
          targetSpo2 = 91.6 + (Math.random() * 0.8 - 0.4);
          targetTemp = astro.baseline.normalTemp + 1.1 + (Math.random() * 0.3 - 0.1);
          targetResp = 25 + (Math.random() * 2 - 1);
          targetSys = 147 + (Math.random() * 6 - 3);
        } else if (latest && Math.random() > 0.3) {
          // Smooth continuity from previous reading
          targetHr = latest.heartRate * 0.35 + targetHr * 0.65;
        }

        const candidate = {
          id: `rd-${astro.id}-${Date.now()}-${idx}`,
          astronautId: astro.id,
          timestamp: nowIso,
          heartRate: Math.round(targetHr),
          spo2: Number(Math.min(100, Math.max(85, targetSpo2)).toFixed(1)),
          temperature: Number(targetTemp.toFixed(1)),
          respiratoryRate: Math.round(targetResp),
          systolicBp: Math.round(targetSys),
          diastolicBp: Math.round(targetDia),
          source: 'SIMULATED' as const,
        };

        const analysis = evaluateHealthReading(
          candidate,
          astro,
          astroHistory,
          prev.settings.thresholds
        );
        newReadings.push({
          ...candidate,
          status: analysis.overallStatus,
        });
        nextAlerts = appendUniqueAlerts(nextAlerts, analysis.alertCandidates);
      });

      // Simulated environmental reading
      let cabinTemp = 21.8 + (Math.random() * 1.2 - 0.6);
      let humidity = 47 + (Math.random() * 6 - 3);
      let radiation = 0.69 + (Math.random() * 0.16 - 0.08);
      let co2 = 1900 + (Math.random() * 240 - 120);

      if (prev.scenarioMode === 'ATTENTION') {
        cabinTemp = 25.3 + (Math.random() * 0.4 - 0.2);
        radiation = 1.1 + (Math.random() * 0.12 - 0.05);
      } else if (prev.scenarioMode === 'WARNING') {
        cabinTemp = 27.0 + (Math.random() * 0.6 - 0.2);
        radiation = 1.52 + (Math.random() * 0.15 - 0.05);
        humidity = 65 + (Math.random() * 4 - 1);
      }

      const envBase = {
        id: `env-${Date.now()}`,
        timestamp: nowIso,
        cabinTemp: Number(cabinTemp.toFixed(1)),
        humidity: Math.round(humidity),
        radiationMsvDay: Number(radiation.toFixed(2)),
        co2Ppm: Math.round(co2),
        source: 'SIMULATED' as const,
      };
      const envEval = evaluateEnvironmentalReading(envBase, prev.settings.thresholds);
      const newEnvReading: EnvironmentalReading = {
        ...envBase,
        status: envEval.status,
      };
      nextAlerts = appendUniqueAlerts(nextAlerts, envEval.alertCandidates);

      // Keep recent 120 readings per astronaut max so localStorage stays lean
      const combinedReadings = [...prev.readings, ...newReadings].slice(-360);
      const combinedEnv = [...prev.environmentalReadings, newEnvReading].slice(-120);

      return {
        ...prev,
        readings: combinedReadings,
        environmentalReadings: combinedEnv,
        alerts: nextAlerts,
      };
    });
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;
    const intervalMs = Math.max(1500, state.settings.monitoringIntervalSec * 1000);
    const timer = window.setInterval(generateSimulatedStep, intervalMs);
    return () => window.clearInterval(timer);
  }, [isMonitoring, state.settings.monitoringIntervalSec, generateSimulatedStep]);

  const startMonitoring = useCallback(() => setIsMonitoring(true), []);
  const stopMonitoring = useCallback(() => setIsMonitoring(false), []);
  const triggerSimulatedStep = useCallback(() => generateSimulatedStep(), [generateSimulatedStep]);

  const selectAstronaut = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedAstronautId: id }));
  }, []);

  const setScenarioMode = useCallback((mode: ScenarioMode) => {
    setState((prev) => {
      const freshScenario = buildScenarioData(mode, prev.settings);
      // Preserve any custom-added astronauts beyond the 3 defaults if present
      const customAstronauts = prev.astronauts.filter(
        (a) => !['ast-1', 'ast-2', 'ast-3'].includes(a.id)
      );
      if (customAstronauts.length === 0) {
        return {
          ...freshScenario,
          selectedAstronautId: prev.astronauts.some((a) => a.id === prev.selectedAstronautId)
            ? prev.selectedAstronautId
            : freshScenario.selectedAstronautId,
        };
      }
      return {
        ...freshScenario,
        astronauts: [...freshScenario.astronauts, ...customAstronauts],
        readings: [
          ...freshScenario.readings,
          ...prev.readings.filter((r) => customAstronauts.some((ca) => ca.id === r.astronautId)),
        ],
        sleepRecords: [
          ...freshScenario.sleepRecords,
          ...prev.sleepRecords.filter((s) => customAstronauts.some((ca) => ca.id === s.astronautId)),
        ],
        activityRecords: [
          ...freshScenario.activityRecords,
          ...prev.activityRecords.filter((a) => customAstronauts.some((ca) => ca.id === a.astronautId)),
        ],
        selectedAstronautId: prev.selectedAstronautId,
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    setIsMonitoring(false);
    const fresh = buildScenarioData('NORMAL');
    setState(fresh);
  }, []);

  const addAstronaut = useCallback(
    (data: Omit<Astronaut, 'id' | 'initials' | 'avatarColor'>) => {
      setState((prev) => {
        const id = `ast-${Date.now()}`;
        const newAstro: Astronaut = {
          ...data,
          id,
          initials: computeInitials(data.name),
          avatarColor: AVATAR_COLORS[prev.astronauts.length % AVATAR_COLORS.length],
        };
        const nowIso = new Date().toISOString();
        const todayStr = nowIso.slice(0, 10);

        const initialReading: HealthReading = {
          id: `rd-${id}-init`,
          astronautId: id,
          timestamp: nowIso,
          heartRate: data.baseline.restingHeartRate,
          spo2: data.baseline.normalSpo2,
          temperature: data.baseline.normalTemp,
          respiratoryRate: data.baseline.normalRespRate,
          systolicBp: data.baseline.normalSystolicBp,
          diastolicBp: data.baseline.normalDiastolicBp,
          source: 'SIMULATED',
          status: 'NORMAL',
        };

        const initialSleep: SleepRecord = {
          id: `slp-${id}-init`,
          astronautId: id,
          date: todayStr,
          durationHours: 7.5,
          qualityScore: 84,
          fatigueLevel: 'Low',
          wellnessStatus: 'NORMAL',
          notes: 'Baseline onboarding sleep entry.',
        };

        const initialActivity: ActivityRecord = {
          id: `act-${id}-init`,
          astronautId: id,
          date: todayStr,
          durationMinutes: 45,
          exerciseType: 'Cycle Ergometer',
          intensity: 'Moderate',
          caloriesBurned: 320,
          notes: 'Initial mission onboarding session.',
        };

        return {
          ...prev,
          astronauts: [...prev.astronauts, newAstro],
          readings: [...prev.readings, initialReading],
          sleepRecords: [...prev.sleepRecords, initialSleep],
          activityRecords: [...prev.activityRecords, initialActivity],
          selectedAstronautId: id,
        };
      });
    },
    []
  );

  const updateAstronaut = useCallback((id: string, data: Partial<Astronaut>) => {
    setState((prev) => ({
      ...prev,
      astronauts: prev.astronauts.map((a) =>
        a.id === id
          ? {
              ...a,
              ...data,
              initials: data.name ? computeInitials(data.name) : a.initials,
            }
          : a
      ),
    }));
  }, []);

  const deleteAstronaut = useCallback((id: string) => {
    setState((prev) => {
      const remaining = prev.astronauts.filter((a) => a.id !== id);
      const nextSelected =
        prev.selectedAstronautId === id ? remaining[0]?.id ?? '' : prev.selectedAstronautId;
      return {
        ...prev,
        astronauts: remaining,
        readings: prev.readings.filter((r) => r.astronautId !== id),
        sleepRecords: prev.sleepRecords.filter((s) => s.astronautId !== id),
        activityRecords: prev.activityRecords.filter((ac) => ac.astronautId !== id),
        alerts: prev.alerts.filter((al) => al.astronautId !== id),
        selectedAstronautId: nextSelected,
      };
    });
  }, []);

  const addManualReading = useCallback(
    (
      astronautId: string,
      values: {
        heartRate: number;
        spo2: number;
        temperature: number;
        respiratoryRate: number;
        systolicBp: number;
        diastolicBp: number;
      }
    ) => {
      setState((prev) => {
        const astro = prev.astronauts.find((a) => a.id === astronautId);
        if (!astro) return prev;
        const astroHistory = prev.readings.filter((r) => r.astronautId === astronautId);
        const baseReading = {
          id: `rd-man-${Date.now()}`,
          astronautId,
          timestamp: new Date().toISOString(),
          ...values,
          source: 'MANUAL' as const,
        };
        const analysis = evaluateHealthReading(
          baseReading,
          astro,
          astroHistory,
          prev.settings.thresholds
        );
        const complete: HealthReading = {
          ...baseReading,
          status: analysis.overallStatus,
        };
        const nextAlerts = appendUniqueAlerts(prev.alerts, analysis.alertCandidates);

        return {
          ...prev,
          readings: [...prev.readings, complete],
          alerts: nextAlerts,
        };
      });
    },
    []
  );

  const addOrUpdateSleepRecord = useCallback(
    (record: Omit<SleepRecord, 'id' | 'fatigueLevel' | 'wellnessStatus'> & { id?: string }) => {
      const evaluated = evaluateSleepWellness(record.durationHours, record.qualityScore);
      setState((prev) => {
        if (record.id) {
          return {
            ...prev,
            sleepRecords: prev.sleepRecords.map((s) =>
              s.id === record.id
                ? {
                    ...s,
                    ...record,
                    fatigueLevel: evaluated.fatigueLevel,
                    wellnessStatus: evaluated.status,
                  }
                : s
            ),
          };
        }
        const newRec: SleepRecord = {
          id: `slp-${Date.now()}`,
          astronautId: record.astronautId,
          date: record.date,
          durationHours: record.durationHours,
          qualityScore: record.qualityScore,
          notes: record.notes,
          fatigueLevel: evaluated.fatigueLevel,
          wellnessStatus: evaluated.status,
        };
        return {
          ...prev,
          sleepRecords: [...prev.sleepRecords, newRec].sort((a, b) =>
            a.date.localeCompare(b.date)
          ),
        };
      });
    },
    []
  );

  const addActivityRecord = useCallback((record: Omit<ActivityRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      activityRecords: [
        ...prev.activityRecords,
        {
          ...record,
          id: `act-${Date.now()}`,
        },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }, []);

  const simulateEnvironmentalSpike = useCallback((mode: 'NORMAL' | 'WARNING') => {
    setState((prev) => {
      const nowIso = new Date().toISOString();
      const envBase =
        mode === 'WARNING'
          ? {
              id: `env-${Date.now()}`,
              timestamp: nowIso,
              cabinTemp: Number((prev.settings.thresholds.cabinTempWarningHigh + 0.9).toFixed(1)),
              humidity: Math.min(85, prev.settings.thresholds.humidityWarningHigh + 3),
              radiationMsvDay: Number((prev.settings.thresholds.radiationWarningHigh + 0.28).toFixed(2)),
              co2Ppm: 2650,
              source: 'SIMULATED' as const,
            }
          : {
              id: `env-${Date.now()}`,
              timestamp: nowIso,
              cabinTemp: 21.6,
              humidity: 45,
              radiationMsvDay: 0.66,
              co2Ppm: 1820,
              source: 'SIMULATED' as const,
            };

      const envEval = evaluateEnvironmentalReading(envBase, prev.settings.thresholds);
      const complete: EnvironmentalReading = { ...envBase, status: envEval.status };
      const nextAlerts = appendUniqueAlerts(prev.alerts, envEval.alertCandidates);

      return {
        ...prev,
        environmentalReadings: [...prev.environmentalReadings, complete].slice(-120),
        alerts: nextAlerts,
      };
    });
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a)),
    }));
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' } : a)),
    }));
  }, []);

  const updateSettings = useCallback((settings: AppSettings) => {
    setState((prev) => ({
      ...prev,
      settings,
      astronauts: prev.astronauts.map((a) => ({
        ...a,
        missionName: settings.mission.name,
      })),
    }));
  }, []);

  return (
    <AstraContext.Provider
      value={{
        state,
        isMonitoring,
        isOnline,
        startMonitoring,
        stopMonitoring,
        triggerSimulatedStep,
        selectAstronaut,
        setScenarioMode,
        resetDemo,
        addAstronaut,
        updateAstronaut,
        deleteAstronaut,
        addManualReading,
        addOrUpdateSleepRecord,
        addActivityRecord,
        simulateEnvironmentalSpike,
        acknowledgeAlert,
        resolveAlert,
        updateSettings,
        toastAlert,
        dismissToast,
      }}
    >
      {children}
    </AstraContext.Provider>
  );
};

export function useAstra(): AstraContextValue {
  const ctx = useContext(AstraContext);
  if (!ctx) throw new Error('useAstra must be used within AstraProvider');
  return ctx;
}
