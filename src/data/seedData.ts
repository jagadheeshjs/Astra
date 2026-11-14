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

export const DEFAULT_SETTINGS: AppSettings = {
  mission: {
    name: 'ORBIT-01',
    durationDays: 30,
    currentDay: 14,
    status: 'Active Orbital Demonstration',
    orbitAltitudeKm: 418,
  },
  thresholds: {
    heartRateAttentionDelta: 18,
    heartRateWarningHigh: 112,
    heartRateWarningLow: 46,
    spo2AttentionMin: 95.0,
    spo2WarningMin: 92.5,
    tempAttentionDelta: 0.7,
    tempWarningHigh: 38.0,
    tempWarningLow: 35.4,
    respRateAttentionDelta: 4,
    respRateWarningHigh: 24,
    systolicBpWarningHigh: 145,
    cabinTempWarningHigh: 26.5,
    cabinTempWarningLow: 17.5,
    humidityWarningHigh: 68,
    radiationWarningHigh: 1.4,
  },
  monitoringIntervalSec: 4,
};

export const INITIAL_ASTRONAUTS: Astronaut[] = [
  {
    id: 'ast-1',
    code: 'AST-001',
    name: 'Alex Morgan',
    age: 38,
    role: 'Mission Commander',
    missionName: 'ORBIT-01',
    baseline: {
      restingHeartRate: 64,
      normalSpo2: 98.5,
      normalTemp: 36.7,
      normalRespRate: 14,
      normalSystolicBp: 116,
      normalDiastolicBp: 74,
    },
    wellnessNotes: 'Consistent cardiovascular conditioning; standard pre-sleep hydration protocol.',
    initials: 'AM',
    avatarColor: '#2563EB',
  },
  {
    id: 'ast-2',
    code: 'AST-002',
    name: 'Sarah Chen',
    age: 34,
    role: 'Flight Engineer',
    missionName: 'ORBIT-01',
    baseline: {
      restingHeartRate: 68,
      normalSpo2: 98.2,
      normalTemp: 36.6,
      normalRespRate: 15,
      normalSystolicBp: 112,
      normalDiastolicBp: 72,
    },
    wellnessNotes: 'Active EVA maintenance rotation; monitors thermal load during station module checks.',
    initials: 'SC',
    avatarColor: '#0284C7',
  },
  {
    id: 'ast-3',
    code: 'AST-003',
    name: 'Daniel Carter',
    age: 41,
    role: 'Mission Specialist',
    missionName: 'ORBIT-01',
    baseline: {
      restingHeartRate: 71,
      normalSpo2: 97.8,
      normalTemp: 36.8,
      normalRespRate: 16,
      normalSystolicBp: 120,
      normalDiastolicBp: 78,
    },
    wellnessNotes: 'Payload operations lead; adapts well to circadian light scheduling.',
    initials: 'DC',
    avatarColor: '#1E40AF',
  },
];

function deterministicNoise(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x) - 0.5; // -0.5 to +0.5
}

export function buildScenarioData(
  scenario: ScenarioMode,
  settings: AppSettings = DEFAULT_SETTINGS
): AstraState {
  const now = new Date();
  const astronauts = INITIAL_ASTRONAUTS.map((a) => ({
    ...a,
    missionName: settings.mission.name,
  }));

  const readings: HealthReading[] = [];
  const sleepRecords: SleepRecord[] = [];
  const activityRecords: ActivityRecord[] = [];
  const environmentalReadings: EnvironmentalReading[] = [];
  const alerts: HealthAlert[] = [];
  const seenConditionKeys = new Set<string>();

  // Build 7 days of historical data (2 readings per day = 14 points, plus 3 recent points)
  astronauts.forEach((astro, astroIdx) => {
    const astroReadings: HealthReading[] = [];

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const dateObj = new Date(now.getTime() - dayOffset * 86400000);
      const dateStr = dateObj.toISOString().slice(0, 10);

      // Morning & Evening samples per day
      [8, 20].forEach((hour, slotIdx) => {
        const sampleTime = new Date(dateObj);
        sampleTime.setHours(hour, 15 + astroIdx * 10, 0, 0);
        if (sampleTime.getTime() > now.getTime()) {
          sampleTime.setTime(now.getTime() - (1 - slotIdx) * 3600000);
        }

        const seed = (astroIdx + 1) * 100 + (6 - dayOffset) * 10 + slotIdx;
        const n1 = deterministicNoise(seed);
        const n2 = deterministicNoise(seed + 17);
        const n3 = deterministicNoise(seed + 31);

        let hr = Math.round(astro.baseline.restingHeartRate + n1 * 6 + (slotIdx === 1 ? 3 : -1));
        let spo2 = Number((astro.baseline.normalSpo2 + n2 * 0.7).toFixed(1));
        let temp = Number((astro.baseline.normalTemp + n3 * 0.3).toFixed(1));
        let resp = Math.round(astro.baseline.normalRespRate + n1 * 2);
        let sysBp = Math.round(astro.baseline.normalSystolicBp + n2 * 6);
        let diaBp = Math.round(astro.baseline.normalDiastolicBp + n3 * 4);

        // Apply scenario trends on the latest day (dayOffset === 0)
        if (dayOffset === 0) {
          if (scenario === 'ATTENTION' && astro.id === 'ast-2') {
            // Sarah Chen shows sustained elevated heart rate + mild temperature drift
            hr = astro.baseline.restingHeartRate + (slotIdx === 0 ? 19 : 22);
            temp = Number((astro.baseline.normalTemp + 0.7).toFixed(1));
            resp = astro.baseline.normalRespRate + 3;
          } else if (scenario === 'WARNING' && astro.id === 'ast-1') {
            // Alex Morgan shows significant deviation in HR + SpO2
            hr = slotIdx === 0 ? 96 : 118;
            spo2 = slotIdx === 0 ? 94.8 : 91.8;
            resp = slotIdx === 0 ? 20 : 25;
            temp = Number((astro.baseline.normalTemp + (slotIdx === 0 ? 0.6 : 1.1)).toFixed(1));
            sysBp = slotIdx === 0 ? 136 : 148;
          } else if (scenario === 'WARNING' && astro.id === 'ast-3') {
            // Daniel Carter mild attention drift during warning scenario
            hr = astro.baseline.restingHeartRate + 19;
            spo2 = 94.9;
          }
        }

        const baseReading = {
          id: `rd-${astro.id}-${dayOffset}-${slotIdx}`,
          astronautId: astro.id,
          timestamp: sampleTime.toISOString(),
          heartRate: hr,
          spo2: Math.min(100, spo2),
          temperature: temp,
          respiratoryRate: resp,
          systolicBp: sysBp,
          diastolicBp: diaBp,
          source: 'SIMULATED' as const,
        };

        const analysis = evaluateHealthReading(
          baseReading,
          astro,
          astroReadings,
          settings.thresholds
        );
        const completeReading: HealthReading = {
          ...baseReading,
          status: analysis.overallStatus,
        };
        astroReadings.push(completeReading);
        readings.push(completeReading);

        if (dayOffset === 0 && slotIdx === 1) {
          analysis.alertCandidates.forEach((cand, cIdx) => {
            if (!seenConditionKeys.has(cand.conditionKey)) {
              seenConditionKeys.add(cand.conditionKey);
              alerts.push({
                ...cand,
                id: `alt-${astro.id}-${cIdx}-${Date.now()}`,
                status: 'ACTIVE',
              });
            }
          });
        }
      });

      // Sleep Record for each of the 7 days
      const sleepSeed = (astroIdx + 1) * 50 + (6 - dayOffset);
      let sleepHours = Number((7.2 + deterministicNoise(sleepSeed) * 1.1).toFixed(1));
      let sleepQuality = Math.round(82 + deterministicNoise(sleepSeed + 9) * 16);
      let sleepNotes = 'Standard orbital rest cycle completed.';

      if (dayOffset === 0 && scenario === 'ATTENTION' && astro.id === 'ast-2') {
        sleepHours = 6.1;
        sleepQuality = 67;
        sleepNotes = 'Interrupted sleep period following late-shift instrumentation check.';
      } else if (dayOffset === 0 && scenario === 'WARNING' && astro.id === 'ast-1') {
        sleepHours = 5.1;
        sleepQuality = 52;
        sleepNotes = 'Fragmented rest cycle; elevated workload prior to sleep.';
      }

      const sleepEval = evaluateSleepWellness(sleepHours, sleepQuality);
      sleepRecords.push({
        id: `slp-${astro.id}-${dayOffset}`,
        astronautId: astro.id,
        date: dateStr,
        durationHours: sleepHours,
        qualityScore: Math.max(30, Math.min(99, sleepQuality)),
        fatigueLevel: sleepEval.fatigueLevel,
        wellnessStatus: sleepEval.status,
        notes: sleepNotes,
      });

      // Physical Activity Record for each of the 7 days
      const exerciseTypes = [
        'ARED Resistive Training',
        'T2 Treadmill Interval',
        'CEVIS Cycle Ergometer',
        'Core & Mobility Protocol',
      ];
      const actSeed = (astroIdx + 1) * 70 + (6 - dayOffset);
      const duration = Math.round(45 + deterministicNoise(actSeed) * 30);
      const intensity: ActivityRecord['intensity'] =
        duration > 55 ? 'Vigorous' : duration > 38 ? 'Moderate' : 'Light';
      const calories = Math.round(
        duration * (intensity === 'Vigorous' ? 9.5 : intensity === 'Moderate' ? 7.2 : 4.8)
      );

      activityRecords.push({
        id: `act-${astro.id}-${dayOffset}`,
        astronautId: astro.id,
        date: dateStr,
        durationMinutes: duration,
        exerciseType: exerciseTypes[(dayOffset + astroIdx) % exerciseTypes.length],
        intensity,
        caloriesBurned: calories,
        notes: 'Completed scheduled countermeasure session.',
      });
    }
  });

  // Historical Resolved Alert so Alert History has realistic demonstration content
  alerts.push({
    id: 'alt-hist-1',
    astronautId: 'ast-3',
    astronautName: 'Daniel Carter',
    category: 'HEALTH',
    parameter: 'Heart Rate',
    currentValue: '91 BPM',
    baselineOrThreshold: 'Baseline 71 BPM (Limit 112 BPM)',
    severity: 'ATTENTION',
    timestamp: new Date(now.getTime() - 2 * 86400000).toISOString(),
    explanation:
      'Heart rate rose +20 BPM above baseline shortly after scheduled treadmill session; returned to normal resting baseline on follow-up sample.',
    status: 'RESOLVED',
    conditionKey: 'ast-3:heartRate:HIST',
  });

  // Environmental Monitoring (7 days, 2 samples/day)
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    [9, 21].forEach((hour, slotIdx) => {
      const sampleTime = new Date(now.getTime() - dayOffset * 86400000);
      sampleTime.setHours(hour, 0, 0, 0);
      if (sampleTime.getTime() > now.getTime()) {
        sampleTime.setTime(now.getTime() - (1 - slotIdx) * 1800000);
      }
      const seed = 500 + (6 - dayOffset) * 10 + slotIdx;
      let cabinTemp = Number((21.8 + deterministicNoise(seed) * 1.4).toFixed(1));
      let humidity = Math.round(46 + deterministicNoise(seed + 5) * 10);
      let radiationMsvDay = Number((0.68 + deterministicNoise(seed + 11) * 0.2).toFixed(2));
      let co2Ppm = Math.round(1850 + deterministicNoise(seed + 19) * 350);

      if (dayOffset === 0 && slotIdx === 1) {
        if (scenario === 'ATTENTION') {
          cabinTemp = 25.3;
          radiationMsvDay = 1.12;
        } else if (scenario === 'WARNING') {
          cabinTemp = 27.1;
          radiationMsvDay = 1.54;
          humidity = 64;
          co2Ppm = 2450;
        }
      }

      const envEval = evaluateEnvironmentalReading(
        {
          id: `env-${dayOffset}-${slotIdx}`,
          timestamp: sampleTime.toISOString(),
          cabinTemp,
          humidity,
          radiationMsvDay,
          co2Ppm,
          source: 'SIMULATED',
        },
        settings.thresholds
      );

      environmentalReadings.push({
        id: `env-${dayOffset}-${slotIdx}`,
        timestamp: sampleTime.toISOString(),
        cabinTemp,
        humidity,
        radiationMsvDay,
        co2Ppm,
        status: envEval.status,
        source: 'SIMULATED',
      });

      if (dayOffset === 0 && slotIdx === 1) {
        envEval.alertCandidates.forEach((cand, idx) => {
          if (!seenConditionKeys.has(cand.conditionKey)) {
            seenConditionKeys.add(cand.conditionKey);
            alerts.push({
              ...cand,
              id: `alt-env-${idx}-${Date.now()}`,
              status: 'ACTIVE',
            });
          }
        });
      }
    });
  }

  return {
    astronauts,
    readings: readings.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    sleepRecords: sleepRecords.sort((a, b) => a.date.localeCompare(b.date)),
    activityRecords: activityRecords.sort((a, b) => a.date.localeCompare(b.date)),
    environmentalReadings: environmentalReadings.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    alerts: alerts.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    settings,
    scenarioMode: scenario,
    selectedAstronautId: astronauts[0].id,
  };
}
