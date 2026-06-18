// Daily score = weighted blend of work hours, habits, today's tasks, and the
// daily review. Components with nothing to measure (no active habits, no tasks
// planned for today) are excluded and the remaining weights are re-normalized,
// so an empty task list doesn't silently drag the score down.

export interface ScoreWeights {
  workScoreWeight: number;
  habitsScoreWeight: number;
  tasksScoreWeight: number;
  reviewScoreWeight: number;
}

export interface ScoreInputs {
  workedMinutes: number;
  minimumHours: number;
  stretchHours: number;
  habitPointsDone: number;
  habitPointsTotal: number;
  todayTasksDone: number;
  todayTasksTotal: number;
  reviewDone: boolean;
}

export interface ScoreBreakdown {
  score: number; // 0–100
  work: { fraction: number; weight: number; counted: boolean };
  habits: { fraction: number; weight: number; counted: boolean };
  tasks: { fraction: number; weight: number; counted: boolean };
  review: { fraction: number; weight: number; counted: boolean };
}

export function workFraction(
  workedMinutes: number,
  stretchHours: number
): number {
  if (stretchHours <= 0) return 0;
  return Math.min(workedMinutes / 60 / stretchHours, 1);
}

export function computeDailyScore(
  weights: ScoreWeights,
  inputs: ScoreInputs
): ScoreBreakdown {
  const work = {
    fraction: workFraction(inputs.workedMinutes, inputs.stretchHours),
    weight: weights.workScoreWeight,
    counted: true,
  };
  const habits = {
    fraction:
      inputs.habitPointsTotal > 0
        ? inputs.habitPointsDone / inputs.habitPointsTotal
        : 0,
    weight: weights.habitsScoreWeight,
    counted: inputs.habitPointsTotal > 0,
  };
  const tasks = {
    fraction:
      inputs.todayTasksTotal > 0
        ? inputs.todayTasksDone / inputs.todayTasksTotal
        : 0,
    weight: weights.tasksScoreWeight,
    counted: inputs.todayTasksTotal > 0,
  };
  const review = {
    fraction: inputs.reviewDone ? 1 : 0,
    weight: weights.reviewScoreWeight,
    counted: true,
  };

  const parts = [work, habits, tasks, review].filter((p) => p.counted);
  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  const score =
    totalWeight > 0
      ? Math.min(
          100,
          Math.round(
            (parts.reduce((sum, p) => sum + p.fraction * p.weight, 0) /
              totalWeight) *
              100
          )
        )
      : 0;

  return { score, work, habits, tasks, review };
}

export function scoreMessage(score: number): string {
  if (score >= 90) return "Strong day";
  if (score >= 75) return "Minimum hit";
  if (score >= 50) return "In motion";
  if (score >= 25) return "Warming up";
  return "Behind standard";
}

// Grounded status for the Today page, based purely on hours worked.
export function workStatus(
  workedMinutes: number,
  minimumHours: number,
  stretchHours: number
): string {
  const hours = workedMinutes / 60;
  if (hours <= 0) return "Not started";
  if (hours >= stretchHours) return "Strong day";
  if (hours >= minimumHours) return "Minimum hit";
  if (hours >= minimumHours / 2) return "Halfway";
  return "Still in motion";
}
