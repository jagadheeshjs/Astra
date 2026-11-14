import {
  Astronaut,
  EnvironmentalReading,
  HealthAlert,
  HealthParameterKey,
  HealthReading,
  HealthStatus,
  ThresholdConfig,
} from '../types/astra';

export interface ParameterEvaluation {
  parameter: HealthParameterKey;
  label: string;
  unit: string;
  value: number;
  baseline: number;
  delta: number;
  status: HealthStatus;
  explanation: string;
  thresholdText: string;
  sustainedTrend: boolean;
}

export interface ReadingAnalysisResult {
  overallStatus: HealthStatus;
  parameters: Record<HealthParameterKey, ParameterEvaluation>;
  alertCandidates: Omit<HealthAlert, 'id' | 'status'>[];
}

export const PARAMETER_META: Record<
  HealthParameterKey,
  { label: string; shortLabel: string; unit: string; decimals: number }
> = {
  heartRate: { label: 'Heart Rate', shortLabel: 'HR', unit: 'BPM', decimals: 0 },
  spo2: { label: 'Blood Oxygen (SpO2)', shortLabel: 'SpO2', unit: '%', decimals: 1 },
  temperature: { label: 'Body Temperature', shortLabel: 'Temp', unit: '°C', decimals: 1 },
  respiratoryRate: { label: 'Respiratory Rate', shortLabel: 'Resp', unit: 'br/min', decimals: 0 },
  systolicBp: { label: 'Systolic Blood Pressure', shortLabel: 'Sys BP', unit: 'mmHg', decimals: 0 },
};

function maxStatus(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { NORMAL: 0, ATTENTION: 1, WARNING: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/**
 * Evaluates a single health reading against an astronaut's personal baseline,
 * recent readings (for sustained trend detection), and configurable demonstration thresholds.
 * Note: Demonstration thresholds are non-diagnostic and not official medical limits.
 */
export function evaluateHealthReading(
  reading: Omit<HealthReading, 'status'> | HealthReading,
  astronaut: Astronaut,
  recentAstronautReadings: HealthReading[],
  thresholds: ThresholdConfig
): ReadingAnalysisResult {
  const history = [...recentAstronautReadings]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-3);

  const evaluations: Partial<Record<HealthParameterKey, ParameterEvaluation>> = {};
  const alertCandidates: Omit<HealthAlert, 'id' | 'status'>[] = [];
  let overallStatus: HealthStatus = 'NORMAL';

  // 1. Heart Rate
  {
    const val = reading.heartRate;
    const base = astronaut.baseline.restingHeartRate;
    const delta = Number((val - base).toFixed(1));
    const recentElevated =
      history.length >= 2 &&
      history.slice(-2).every((r) => r.heartRate - base >= thresholds.heartRateAttentionDelta * 0.7) &&
      delta >= thresholds.heartRateAttentionDelta * 0.7;

    let status: HealthStatus = 'NORMAL';
    let explanation = `Within configured demonstration range relative to ${astronaut.name}'s resting baseline (${base} BPM).`;
    const thresholdText = `Baseline ${base} BPM · Demo limit ${thresholds.heartRateWarningLow}–${thresholds.heartRateWarningHigh} BPM (+${thresholds.heartRateAttentionDelta} BPM attention delta)`;

    if (val >= thresholds.heartRateWarningHigh || val <= thresholds.heartRateWarningLow) {
      status = 'WARNING';
      explanation = `Heart rate (${val} BPM) crossed the configured demonstration limit (${thresholds.heartRateWarningLow}–${thresholds.heartRateWarningHigh} BPM), diverging by ${delta > 0 ? `+${delta}` : delta} BPM from ${astronaut.name}'s baseline (${base} BPM).`;
    } else if (Math.abs(delta) >= thresholds.heartRateAttentionDelta || recentElevated) {
      status = 'ATTENTION';
      explanation = recentElevated
        ? `Sustained heart rate elevation detected: latest reading (${val} BPM) and preceding telemetry remain noticeably above ${astronaut.name}'s baseline (${base} BPM).`
        : `Heart rate (${val} BPM) shifted by ${delta > 0 ? `+${delta}` : delta} BPM from ${astronaut.name}'s personal baseline (${base} BPM).`;
    }

    evaluations.heartRate = {
      parameter: 'heartRate',
      label: 'Heart Rate',
      unit: 'BPM',
      value: val,
      baseline: base,
      delta,
      status,
      explanation,
      thresholdText,
      sustainedTrend: recentElevated,
    };
    overallStatus = maxStatus(overallStatus, status);
    if (status !== 'NORMAL') {
      alertCandidates.push({
        astronautId: astronaut.id,
        astronautName: astronaut.name,
        category: 'HEALTH',
        parameter: 'Heart Rate',
        currentValue: `${val} BPM`,
        baselineOrThreshold: `Baseline ${base} BPM (Limit ${thresholds.heartRateWarningHigh} BPM)`,
        severity: status,
        timestamp: reading.timestamp,
        explanation,
        conditionKey: `${astronaut.id}:heartRate:${status}`,
      });
    }
  }

  // 2. SpO2
  {
    const val = Number(reading.spo2.toFixed(1));
    const base = astronaut.baseline.normalSpo2;
    const delta = Number((val - base).toFixed(1));
    const recentDrop =
      history.length >= 2 &&
      history.slice(-2).every((r) => r.spo2 <= thresholds.spo2AttentionMin + 0.5) &&
      val <= thresholds.spo2AttentionMin + 0.5;

    let status: HealthStatus = 'NORMAL';
    let explanation = `Within configured demonstration range relative to ${astronaut.name}'s baseline (${base}%).`;
    const thresholdText = `Baseline ${base}% · Demo attention <${thresholds.spo2AttentionMin}%, warning <${thresholds.spo2WarningMin}%`;

    if (val <= thresholds.spo2WarningMin) {
      status = 'WARNING';
      explanation = `Blood oxygen saturation (${val}%) dropped below the configured demonstration threshold (${thresholds.spo2WarningMin}%), ${Math.abs(delta)}% below ${astronaut.name}'s baseline (${base}%).`;
    } else if (val <= thresholds.spo2AttentionMin || recentDrop) {
      status = 'ATTENTION';
      explanation = recentDrop
        ? `Sustained SpO2 downward trend detected across consecutive readings (latest ${val}% vs baseline ${base}%).`
        : `Blood oxygen saturation (${val}%) dipped below the demonstration attention mark (${thresholds.spo2AttentionMin}%), ${Math.abs(delta)}% below baseline (${base}%).`;
    }

    evaluations.spo2 = {
      parameter: 'spo2',
      label: 'Blood Oxygen (SpO2)',
      unit: '%',
      value: val,
      baseline: base,
      delta,
      status,
      explanation,
      thresholdText,
      sustainedTrend: recentDrop,
    };
    overallStatus = maxStatus(overallStatus, status);
    if (status !== 'NORMAL') {
      alertCandidates.push({
        astronautId: astronaut.id,
        astronautName: astronaut.name,
        category: 'HEALTH',
        parameter: 'Blood Oxygen (SpO2)',
        currentValue: `${val}%`,
        baselineOrThreshold: `Baseline ${base}% (Min ${thresholds.spo2WarningMin}%)`,
        severity: status,
        timestamp: reading.timestamp,
        explanation,
        conditionKey: `${astronaut.id}:spo2:${status}`,
      });
    }
  }

  // 3. Body Temperature
  {
    const val = Number(reading.temperature.toFixed(1));
    const base = astronaut.baseline.normalTemp;
    const delta = Number((val - base).toFixed(1));
    const recentDrift =
      history.length >= 2 &&
      history.slice(-2).every((r) => Math.abs(r.temperature - base) >= thresholds.tempAttentionDelta * 0.8) &&
      Math.abs(delta) >= thresholds.tempAttentionDelta * 0.8;

    let status: HealthStatus = 'NORMAL';
    let explanation = `Within configured demonstration range relative to ${astronaut.name}'s baseline (${base}°C).`;
    const thresholdText = `Baseline ${base}°C · Demo limit ${thresholds.tempWarningLow}–${thresholds.tempWarningHigh}°C`;

    if (val >= thresholds.tempWarningHigh || val <= thresholds.tempWarningLow) {
      status = 'WARNING';
      explanation = `Body temperature (${val}°C) crossed the configured demonstration limit (${thresholds.tempWarningLow}–${thresholds.tempWarningHigh}°C), differing by ${delta > 0 ? `+${delta}` : delta}°C from baseline (${base}°C).`;
    } else if (Math.abs(delta) >= thresholds.tempAttentionDelta || recentDrift) {
      status = 'ATTENTION';
      explanation = recentDrift
        ? `Sustained temperature drift observed across recent readings (${val}°C vs personal baseline ${base}°C).`
        : `Body temperature (${val}°C) deviated by ${delta > 0 ? `+${delta}` : delta}°C from ${astronaut.name}'s baseline (${base}°C).`;
    }

    evaluations.temperature = {
      parameter: 'temperature',
      label: 'Body Temperature',
      unit: '°C',
      value: val,
      baseline: base,
      delta,
      status,
      explanation,
      thresholdText,
      sustainedTrend: recentDrift,
    };
    overallStatus = maxStatus(overallStatus, status);
    if (status !== 'NORMAL') {
      alertCandidates.push({
        astronautId: astronaut.id,
        astronautName: astronaut.name,
        category: 'HEALTH',
        parameter: 'Body Temperature',
        currentValue: `${val}°C`,
        baselineOrThreshold: `Baseline ${base}°C (Limit ${thresholds.tempWarningHigh}°C)`,
        severity: status,
        timestamp: reading.timestamp,
        explanation,
        conditionKey: `${astronaut.id}:temperature:${status}`,
      });
    }
  }

  // 4. Respiratory Rate
  {
    const val = Math.round(reading.respiratoryRate);
    const base = astronaut.baseline.normalRespRate;
    const delta = Number((val - base).toFixed(1));
    const recentElevated =
      history.length >= 2 &&
      history.slice(-2).every((r) => r.respiratoryRate - base >= thresholds.respRateAttentionDelta) &&
      delta >= thresholds.respRateAttentionDelta;

    let status: HealthStatus = 'NORMAL';
    let explanation = `Within configured demonstration range relative to ${astronaut.name}'s baseline (${base} br/min).`;
    const thresholdText = `Baseline ${base} br/min · Demo limit ${thresholds.respRateWarningHigh} br/min`;

    if (val >= thresholds.respRateWarningHigh) {
      status = 'WARNING';
      explanation = `Respiratory rate (${val} br/min) exceeded the configured demonstration limit (${thresholds.respRateWarningHigh} br/min), ${delta > 0 ? `+${delta}` : delta} br/min above baseline (${base} br/min).`;
    } else if (Math.abs(delta) >= thresholds.respRateAttentionDelta || recentElevated) {
      status = 'ATTENTION';
      explanation = `Respiratory rate (${val} br/min) shifted by ${delta > 0 ? `+${delta}` : delta} br/min from ${astronaut.name}'s personal baseline (${base} br/min).`;
    }

    evaluations.respiratoryRate = {
      parameter: 'respiratoryRate',
      label: 'Respiratory Rate',
      unit: 'br/min',
      value: val,
      baseline: base,
      delta,
      status,
      explanation,
      thresholdText,
      sustainedTrend: recentElevated,
    };
    overallStatus = maxStatus(overallStatus, status);
    if (status !== 'NORMAL') {
      alertCandidates.push({
        astronautId: astronaut.id,
        astronautName: astronaut.name,
        category: 'HEALTH',
        parameter: 'Respiratory Rate',
        currentValue: `${val} br/min`,
        baselineOrThreshold: `Baseline ${base} br/min (Limit ${thresholds.respRateWarningHigh} br/min)`,
        severity: status,
        timestamp: reading.timestamp,
        explanation,
        conditionKey: `${astronaut.id}:respiratoryRate:${status}`,
      });
    }
  }

  // 5. Systolic BP
  {
    const val = Math.round(reading.systolicBp);
    const base = astronaut.baseline.normalSystolicBp;
    const delta = Number((val - base).toFixed(1));
    const sustained =
      history.length >= 2 &&
      history.slice(-2).every((r) => r.systolicBp - base >= 16) &&
      delta >= 16;

    let status: HealthStatus = 'NORMAL';
    let explanation = `Within configured demonstration range relative to ${astronaut.name}'s baseline (${base}/${astronaut.baseline.normalDiastolicBp} mmHg).`;
    const thresholdText = `Baseline ${base}/${astronaut.baseline.normalDiastolicBp} mmHg · Demo systolic limit ${thresholds.systolicBpWarningHigh} mmHg`;

    if (val >= thresholds.systolicBpWarningHigh) {
      status = 'WARNING';
      explanation = `Systolic blood pressure (${val} mmHg) exceeded the configured demonstration threshold (${thresholds.systolicBpWarningHigh} mmHg), +${delta} mmHg above baseline (${base} mmHg).`;
    } else if (delta >= 18 || sustained) {
      status = 'ATTENTION';
      explanation = `Systolic blood pressure (${val} mmHg) is elevated +${delta} mmHg above ${astronaut.name}'s baseline (${base} mmHg).`;
    }

    evaluations.systolicBp = {
      parameter: 'systolicBp',
      label: 'Blood Pressure (Systolic)',
      unit: 'mmHg',
      value: val,
      baseline: base,
      delta,
      status,
      explanation,
      thresholdText,
      sustainedTrend: sustained,
    };
    overallStatus = maxStatus(overallStatus, status);
    if (status !== 'NORMAL') {
      alertCandidates.push({
        astronautId: astronaut.id,
        astronautName: astronaut.name,
        category: 'HEALTH',
        parameter: 'Blood Pressure',
        currentValue: `${val}/${Math.round(reading.diastolicBp)} mmHg`,
        baselineOrThreshold: `Baseline ${base}/${astronaut.baseline.normalDiastolicBp} mmHg (Limit ${thresholds.systolicBpWarningHigh} mmHg)`,
        severity: status,
        timestamp: reading.timestamp,
        explanation,
        conditionKey: `${astronaut.id}:systolicBp:${status}`,
      });
    }
  }

  return {
    overallStatus,
    parameters: evaluations as Record<HealthParameterKey, ParameterEvaluation>,
    alertCandidates,
  };
}

export function evaluateEnvironmentalReading(
  reading: Omit<EnvironmentalReading, 'status'>,
  thresholds: ThresholdConfig
): { status: HealthStatus; alertCandidates: Omit<HealthAlert, 'id' | 'status'>[] } {
  let status: HealthStatus = 'NORMAL';
  const alertCandidates: Omit<HealthAlert, 'id' | 'status'>[] = [];

  if (
    reading.cabinTemp >= thresholds.cabinTempWarningHigh ||
    reading.cabinTemp <= thresholds.cabinTempWarningLow
  ) {
    status = 'WARNING';
    alertCandidates.push({
      astronautId: 'ENV-CABIN',
      astronautName: 'ORBIT-01 Cabin',
      category: 'ENVIRONMENT',
      parameter: 'Cabin Temperature',
      currentValue: `${reading.cabinTemp.toFixed(1)}°C`,
      baselineOrThreshold: `Demo range ${thresholds.cabinTempWarningLow}–${thresholds.cabinTempWarningHigh}°C`,
      severity: 'WARNING',
      timestamp: reading.timestamp,
      explanation: `Simulated cabin temperature (${reading.cabinTemp.toFixed(1)}°C) crossed the configured demonstration range (${thresholds.cabinTempWarningLow}–${thresholds.cabinTempWarningHigh}°C).`,
      conditionKey: `ENV:cabinTemp:WARNING`,
    });
  } else if (reading.cabinTemp >= thresholds.cabinTempWarningHigh - 1.5) {
    status = maxStatus(status, 'ATTENTION');
    alertCandidates.push({
      astronautId: 'ENV-CABIN',
      astronautName: 'ORBIT-01 Cabin',
      category: 'ENVIRONMENT',
      parameter: 'Cabin Temperature',
      currentValue: `${reading.cabinTemp.toFixed(1)}°C`,
      baselineOrThreshold: `Target 20.0–24.0°C`,
      severity: 'ATTENTION',
      timestamp: reading.timestamp,
      explanation: `Simulated cabin temperature (${reading.cabinTemp.toFixed(1)}°C) is approaching the upper demonstration threshold.`,
      conditionKey: `ENV:cabinTemp:ATTENTION`,
    });
  }

  if (reading.humidity >= thresholds.humidityWarningHigh) {
    status = 'WARNING';
    alertCandidates.push({
      astronautId: 'ENV-CABIN',
      astronautName: 'ORBIT-01 Cabin',
      category: 'ENVIRONMENT',
      parameter: 'Cabin Humidity',
      currentValue: `${reading.humidity.toFixed(0)}%`,
      baselineOrThreshold: `Demo limit ${thresholds.humidityWarningHigh}%`,
      severity: 'WARNING',
      timestamp: reading.timestamp,
      explanation: `Simulated cabin relative humidity (${reading.humidity.toFixed(0)}%) exceeded the configured demonstration limit (${thresholds.humidityWarningHigh}%).`,
      conditionKey: `ENV:humidity:WARNING`,
    });
  }

  if (reading.radiationMsvDay >= thresholds.radiationWarningHigh) {
    status = 'WARNING';
    alertCandidates.push({
      astronautId: 'ENV-CABIN',
      astronautName: 'ORBIT-01 Cabin',
      category: 'ENVIRONMENT',
      parameter: 'Radiation Monitor',
      currentValue: `${reading.radiationMsvDay.toFixed(2)} mSv/day`,
      baselineOrThreshold: `Demo limit ${thresholds.radiationWarningHigh} mSv/day`,
      severity: 'WARNING',
      timestamp: reading.timestamp,
      explanation: `Simulated cabin radiation flux (${reading.radiationMsvDay.toFixed(2)} mSv/day) exceeded the configured demonstration threshold (${thresholds.radiationWarningHigh} mSv/day).`,
      conditionKey: `ENV:radiation:WARNING`,
    });
  } else if (reading.radiationMsvDay >= thresholds.radiationWarningHigh * 0.75) {
    status = maxStatus(status, 'ATTENTION');
    alertCandidates.push({
      astronautId: 'ENV-CABIN',
      astronautName: 'ORBIT-01 Cabin',
      category: 'ENVIRONMENT',
      parameter: 'Radiation Monitor',
      currentValue: `${reading.radiationMsvDay.toFixed(2)} mSv/day`,
      baselineOrThreshold: `Normal <${(thresholds.radiationWarningHigh * 0.75).toFixed(2)} mSv/day`,
      severity: 'ATTENTION',
      timestamp: reading.timestamp,
      explanation: `Simulated radiation level (${reading.radiationMsvDay.toFixed(2)} mSv/day) is elevated compared to nominal orbital baseline.`,
      conditionKey: `ENV:radiation:ATTENTION`,
    });
  }

  return { status, alertCandidates };
}

export function evaluateSleepWellness(
  durationHours: number,
  qualityScore: number
): { status: HealthStatus; fatigueLevel: 'Low' | 'Moderate' | 'Elevated' } {
  if (durationHours < 5.5 || qualityScore < 55) {
    return { status: 'WARNING', fatigueLevel: 'Elevated' };
  }
  if (durationHours < 6.8 || qualityScore < 72) {
    return { status: 'ATTENTION', fatigueLevel: 'Moderate' };
  }
  return { status: 'NORMAL', fatigueLevel: 'Low' };
}

export function generateAnalyticsInsights(
  astronaut: Astronaut,
  readings: HealthReading[],
  parameter: HealthParameterKey,
  thresholds: ThresholdConfig
): string[] {
  if (readings.length === 0) {
    return ['No health readings available for this astronaut yet. Start monitoring or enter a manual reading to generate insights.'];
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const meta = PARAMETER_META[parameter];
  const values = sorted.map((r) => r[parameter]);
  const latest = values[values.length - 1];
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const baselineMap: Record<HealthParameterKey, number> = {
    heartRate: astronaut.baseline.restingHeartRate,
    spo2: astronaut.baseline.normalSpo2,
    temperature: astronaut.baseline.normalTemp,
    respiratoryRate: astronaut.baseline.normalRespRate,
    systolicBp: astronaut.baseline.normalSystolicBp,
  };
  const baseline = baselineMap[parameter];

  const recentSlice = values.slice(-4);
  const recentAvg = recentSlice.reduce((s, v) => s + v, 0) / recentSlice.length;
  const recentDelta = recentAvg - baseline;

  const insights: string[] = [];

  // 1. Recent vs Baseline
  if (parameter === 'spo2') {
    if (recentDelta <= -1.2) {
      insights.push(
        `${meta.label} has trended ${Math.abs(recentDelta).toFixed(1)}${meta.unit} below ${astronaut.name}'s usual baseline (${baseline}${meta.unit}) across the latest monitoring window.`
      );
    } else {
      insights.push(
        `${meta.label} remains steady near ${astronaut.name}'s personal baseline (${baseline}${meta.unit}), averaging ${recentAvg.toFixed(1)}${meta.unit} recently.`
      );
    }
  } else {
    if (recentDelta >= 8 && (parameter === 'heartRate' || parameter === 'systolicBp')) {
      insights.push(
        `${meta.label} has remained above ${astronaut.name}'s usual baseline (${baseline} ${meta.unit}) during the latest monitoring period (recent average ${recentAvg.toFixed(meta.decimals)} ${meta.unit}).`
      );
    } else if (parameter === 'temperature' && Math.abs(recentDelta) >= thresholds.tempAttentionDelta * 0.7) {
      insights.push(
        `${meta.label} shows a ${recentDelta > 0 ? 'positive' : 'negative'} shift of ${Math.abs(recentDelta).toFixed(1)}°C relative to baseline (${baseline}°C) in recent readings.`
      );
    } else if (parameter === 'respiratoryRate' && Math.abs(recentDelta) >= thresholds.respRateAttentionDelta * 0.7) {
      insights.push(
        `${meta.label} averaged ${recentAvg.toFixed(1)} ${meta.unit} recently, differing from baseline (${baseline} ${meta.unit}).`
      );
    } else {
      insights.push(
        `${meta.label} has tracked closely to ${astronaut.name}'s baseline (${baseline} ${meta.unit}) over the recent monitoring window (recent avg ${recentAvg.toFixed(meta.decimals)} ${meta.unit}).`
      );
    }
  }

  // 2. Range & stability insight
  const spread = max - min;
  insights.push(
    `Observed range across ${values.length} recorded samples: ${min.toFixed(meta.decimals)} to ${max.toFixed(meta.decimals)} ${meta.unit} (overall mean ${avg.toFixed(meta.decimals)} ${meta.unit}, span ${spread.toFixed(meta.decimals)} ${meta.unit}).`
  );

  // 3. Threshold crossings
  const attentionOrWarningCount = sorted.filter((r) => {
    const res = evaluateHealthReading(r, astronaut, [], thresholds);
    return res.parameters[parameter].status !== 'NORMAL';
  }).length;

  if (attentionOrWarningCount > 0) {
    insights.push(
      `${attentionOrWarningCount} of ${sorted.length} readings for ${meta.label} triggered a demonstration Attention or Warning flag (latest: ${latest.toFixed(meta.decimals)} ${meta.unit}).`
    );
  } else {
    insights.push(
      `All ${sorted.length} recorded ${meta.label} samples remained within the configured demonstration range.`
    );
  }

  return insights;
}
