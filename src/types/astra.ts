export type NavSection =
  | 'overview'
  | 'profiles'
  | 'live'
  | 'analytics'
  | 'sleep'
  | 'activity'
  | 'environment'
  | 'alerts'
  | 'reports'
  | 'settings';

export type HealthStatus = 'NORMAL' | 'ATTENTION' | 'WARNING';

export type DataSource = 'SIMULATED' | 'MANUAL';

export type ScenarioMode = 'NORMAL' | 'ATTENTION' | 'WARNING';

export type HealthParameterKey =
  | 'heartRate'
  | 'spo2'
  | 'temperature'
  | 'respiratoryRate'
  | 'systolicBp';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export type AlertCategory = 'HEALTH' | 'ENVIRONMENT';

export interface AstronautBaseline {
  restingHeartRate: number; // BPM
  normalSpo2: number; // %
  normalTemp: number; // °C
  normalRespRate: number; // breaths/min
  normalSystolicBp: number; // mmHg
  normalDiastolicBp: number; // mmHg
}

export interface Astronaut {
  id: string;
  code: string; // e.g., AST-001
  name: string;
  age: number;
  role: string;
  missionName: string;
  baseline: AstronautBaseline;
  wellnessNotes: string;
  initials: string;
  avatarColor: string;
}

export interface HealthReading {
  id: string;
  astronautId: string;
  timestamp: string; // ISO string
  heartRate: number;
  spo2: number;
  temperature: number;
  respiratoryRate: number;
  systolicBp: number;
  diastolicBp: number;
  source: DataSource;
  status: HealthStatus;
}

export interface SleepRecord {
  id: string;
  astronautId: string;
  date: string; // YYYY-MM-DD
  durationHours: number;
  qualityScore: number; // 1-100
  fatigueLevel: 'Low' | 'Moderate' | 'Elevated';
  wellnessStatus: HealthStatus;
  notes: string;
}

export interface ActivityRecord {
  id: string;
  astronautId: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  exerciseType: string;
  intensity: 'Light' | 'Moderate' | 'Vigorous';
  caloriesBurned: number;
  notes: string;
}

export interface EnvironmentalReading {
  id: string;
  timestamp: string;
  cabinTemp: number; // °C
  humidity: number; // %
  radiationMsvDay: number; // mSv/day
  co2Ppm: number; // ppm
  status: HealthStatus;
  source: 'SIMULATED';
}

export interface HealthAlert {
  id: string;
  astronautId: string;
  astronautName: string;
  category: AlertCategory;
  parameter: string;
  currentValue: string;
  baselineOrThreshold: string;
  severity: 'ATTENTION' | 'WARNING';
  timestamp: string;
  explanation: string;
  status: AlertStatus;
  conditionKey: string; // Used to prevent duplicate alerts for continuous conditions
}

export interface ThresholdConfig {
  heartRateAttentionDelta: number; // +BPM above personal baseline
  heartRateWarningHigh: number; // absolute BPM upper demo threshold
  heartRateWarningLow: number; // absolute BPM lower demo threshold
  spo2AttentionMin: number; // %
  spo2WarningMin: number; // %
  tempAttentionDelta: number; // °C delta from personal baseline
  tempWarningHigh: number; // °C
  tempWarningLow: number; // °C
  respRateAttentionDelta: number; // breaths/min delta from baseline
  respRateWarningHigh: number; // breaths/min
  systolicBpWarningHigh: number; // mmHg
  cabinTempWarningHigh: number; // °C
  cabinTempWarningLow: number; // °C
  humidityWarningHigh: number; // %
  radiationWarningHigh: number; // mSv/day
}

export interface MissionInfo {
  name: string;
  durationDays: number;
  currentDay: number;
  status: string;
  orbitAltitudeKm: number;
}

export interface AppSettings {
  mission: MissionInfo;
  thresholds: ThresholdConfig;
  monitoringIntervalSec: number;
}

export interface AstraState {
  astronauts: Astronaut[];
  readings: HealthReading[];
  sleepRecords: SleepRecord[];
  activityRecords: ActivityRecord[];
  environmentalReadings: EnvironmentalReading[];
  alerts: HealthAlert[];
  settings: AppSettings;
  scenarioMode: ScenarioMode;
  selectedAstronautId: string;
}
