# Real-Time Metrics Documentation

This document explains how real-time metrics are calculated in the clinic simulation system, including patient flow, resource utilization, salary calculations, and productivity comparisons.

---

## Table of Contents

1. [Overview](#overview)
2. [Patient Flow & Throughput](#patient-flow--throughput)
3. [Service Duration Calculations](#service-duration-calculations)
4. [Resource Utilization](#resource-utilization)
5. [Salary & Cost Calculations](#salary--cost-calculations)
6. [Productivity Metrics](#productivity-metrics)
7. [Statistical Distributions](#statistical-distributions)
8. [History & Time-Series Data](#history--time-series-data)

---

## Overview

The simulation compares two clinic workflows:

| Clinic Type | Workflow Stages |
|-------------|-----------------|
| **Standard** | Entry → Check-in Queue → Reception → Waiting Room → Doctor → Exit |
| **AI-Enabled** | Entry → AI Kiosk (or skip if digital) → Triage Queue → Triage Nurse → Doctor Queue → AI Doctor → Exit |

### Patient Types

```typescript
enum PatientType {
  STANDARD = 'STANDARD',      // Traditional clinic patient
  AI_WALK_IN = 'AI_WALK_IN',  // AI clinic walk-in (uses kiosk)
  AI_DIGITAL = 'AI_DIGITAL',  // AI clinic digital check-in (skips kiosk)
}
```

The `digitalAdoptionRate` config determines what percentage of AI clinic patients skip the kiosk.

---

## Patient Flow & Throughput

### Arrival Generation

Patients arrive following an **exponential distribution**:

```typescript
nextArrival += randomExponential(1 / config.avgArrivalInterval);
```

Both clinics receive patients at the **same time** for fair comparison.

### Throughput Metrics

| Metric | Calculation |
|--------|-------------|
| **Total In** | `activePatients + finishedPatients` |
| **Total Out** | `stats.stdFinished` or `stats.aiFinished` |
| **Active** | Patients currently in the system (any state except COMPLETED) |

```typescript
// Standard Clinic
const stdActive = patients.filter(p => p.type === PatientType.STANDARD).length;
const stdOut = stats.stdFinished;
const stdIn = stdActive + stdOut;

// AI Clinic
const aiActive = patients.filter(p => p.type !== PatientType.STANDARD).length;
const aiOut = stats.aiFinished;
const aiIn = aiActive + aiOut;
```

---

## Service Duration Calculations

Each service station has configurable average times with randomized variation.

### Standard Clinic Durations

| Station | Distribution | Formula |
|---------|--------------|---------|
| **Reception** | Triangular | `triangular(avg×0.5, avg, avg×1.5)` |
| **Doctor** | Triangular | `triangular(avg×0.5, avg, avg×1.5)` |

### AI Clinic Durations

| Station | Distribution | Formula |
|---------|--------------|---------|
| **AI Kiosk** | Triangular | `triangular(avg×0.5, avg, avg×1.5)` |
| **Triage Nurse** | Normal | `normal(avg, avg×0.2)` |
| **AI Doctor** | Triangular | `triangular(avg×0.5, avg, avg×1.5)` |

### Code Reference

```typescript
getDuration(roomId: string): number {
  switch(roomId) {
    case 'std_reception':
      return randomTriangular(avg * 0.5, avg, avg * 1.5);
    case 'std_doctor':
      return randomTriangular(avg * 0.5, avg, avg * 1.5);
    case 'ai_kiosk':
      return randomTriangular(avg * 0.5, avg, avg * 1.5);
    case 'ai_triage':
      return randomNormal(avg, avg * 0.2);
    case 'ai_doctor':
      return randomTriangular(avg * 0.5, avg, avg * 1.5);
  }
}
```

---

## Resource Utilization

### Doctor Busy Time Tracking

Utilization is tracked proportionally based on how many staff are actively working:

```typescript
// Per tick update
if (stdDoc.staffBusy > 0) {
  stats.stdDoctorBusyTime += dtMinutes * (staffBusy / capacity);
}
```

### Handled Counters

Each station tracks patients processed:

| Counter | Incremented When |
|---------|------------------|
| `stdReceptionHandled` | Patient completes reception |
| `stdDoctorHandled` | Patient completes standard doctor visit |
| `aiKioskHandled` | Patient completes AI kiosk check-in |
| `aiTriageHandled` | Patient completes triage |
| `aiDoctorHandled` | Patient completes AI-assisted doctor visit |

---

## Salary & Cost Calculations

### Configuration Parameters

```typescript
interface SimulationConfig {
  annualNurseSalary: number;   // e.g., $60,000
  annualDoctorSalary: number;  // e.g., $200,000
  
  // Standard Clinic Staffing
  stdTotalNurses: number;      // Total nurse pool
  numStdReceptionists: number; // Active receptionists
  numStdDoctors: number;       // Active doctors
  
  // AI Clinic Staffing
  aiTotalNurses: number;       // Total nurse pool
  numKiosks: number;           // AI kiosk stations
  numNurses: number;           // Active triage nurses
  numAiDoctors: number;        // Active AI-assisted doctors
}
```

### Hourly Rate Calculation

```typescript
const workHoursPerYear = 2080;  // 40 hours/week × 52 weeks

const nurseHourly = annualNurseSalary / workHoursPerYear;
const doctorHourly = annualDoctorSalary / workHoursPerYear;
```

**Example:**
- Nurse: $60,000 / 2,080 = **$28.85/hour**
- Doctor: $200,000 / 2,080 = **$96.15/hour**

### Total Cost Calculation

Costs are based on the **total staff pool** (not just active staff) for the simulation duration:

```typescript
const durationHrs = config.durationMinutes / 60;

// Standard Clinic
const stdNurseCost = stdTotalNurses × nurseHourly × durationHrs;
const stdDoctorCost = numStdDoctors × doctorHourly × durationHrs;
const stdTotalCost = stdNurseCost + stdDoctorCost;

// AI Clinic
const aiNurseCost = aiTotalNurses × nurseHourly × durationHrs;
const aiDoctorCost = numAiDoctors × doctorHourly × durationHrs;
const aiTotalCost = aiNurseCost + aiDoctorCost;
```

### Cost Breakdown Display

| Line Item | Formula |
|-----------|---------|
| Nurses | `count × hourlyRate × hours` |
| Doctors | `count × hourlyRate × hours` |
| **Total** | Sum of above |

---

## Productivity Metrics

### Lift Factor (Multiplier)

Compares AI clinic performance against standard clinic:

```typescript
const calcMultiplier = (base: number, target: number) => {
  if (base === 0) return target > 0 ? "∞" : "0.0x";
  return `${(target / base).toFixed(1)}x`;
};

// Intake Productivity: Triage vs Reception
const intakeMultiplier = calcMultiplier(stdReceptionHandled, aiTriageHandled);

// Doctor Productivity: AI Doctor vs Standard Doctor
const doctorMultiplier = calcMultiplier(stdDoctorHandled, aiDoctorHandled);
```

### KPI Impact Calculation

For comparing any two values with percentage change:

```typescript
const diff = aiValue - stdValue;
const pctChange = stdValue !== 0 ? (diff / stdValue) * 100 : 0;

// Direction depends on metric type:
// - Throughput: higher is better (inverse = false)
// - Wait Time: lower is better (inverse = true)
const isImprovement = inverse ? diff < 0 : diff > 0;
```

---

## Statistical Distributions

### Normal Distribution (Box-Muller Transform)

Used for triage nurse service times:

```typescript
const randomNormal = (mean: number, stdDev: number): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.max(0, mean + z * stdDev);
};
```

### Triangular Distribution

Used for most service times (reception, doctors, kiosk):

```typescript
const randomTriangular = (min: number, mode: number, max: number): number => {
  const u = Math.random();
  const f = (mode - min) / (max - min);
  if (u < f) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
};
```

### Exponential Distribution

Used for patient arrival intervals:

```typescript
const randomExponential = (rate: number): number => {
  return -Math.log(1 - Math.random()) / rate;
};
```

---

## History & Time-Series Data

### Data Capture

History is captured every 5 simulation minutes:

```typescript
if (state.time - lastHistoryCapture >= 5) {
  history.push({
    time: Math.floor(state.time),
    stdDoctorTotal: stats.stdDoctorHandled,
    aiDoctorTotal: stats.aiDoctorHandled,
    stdIntakeTotal: stats.stdReceptionHandled,
    aiIntakeTotal: stats.aiTriageHandled
  });
  lastHistoryCapture = state.time;
}
```

### History Point Structure

```typescript
interface HistoryPoint {
  time: number;           // Simulation minutes
  stdDoctorTotal: number; // Cumulative standard doctor consultations
  aiDoctorTotal: number;  // Cumulative AI doctor consultations
  stdIntakeTotal: number; // Cumulative reception check-ins
  aiIntakeTotal: number;  // Cumulative triage completions
}
```

### Charts

Two live charts display this data:
1. **Productivity (Doctor Output)** - Compares doctor consultation rates
2. **Intake Capacity** - Compares patient intake processing rates

---

## Summary of Key Formulas

| Metric | Formula |
|--------|---------|
| Hourly Rate | `annualSalary / 2080` |
| Staff Cost | `staffCount × hourlyRate × (durationMinutes / 60)` |
| Lift Factor | `aiMetric / stdMetric` |
| % Change | `((aiValue - stdValue) / stdValue) × 100` |
| Utilization | `busyTime / (duration × capacity)` |
| Arrival Interval | `exponential(1 / avgInterval)` |
| Service Time | `triangular(avg×0.5, avg, avg×1.5)` or `normal(avg, avg×0.2)` |
