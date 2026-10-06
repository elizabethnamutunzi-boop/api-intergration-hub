export const SPARKLINE_WIDTH = 120;
export const SPARKLINE_HEIGHT = 36;
export const SPARKLINE_POINT_COUNT = 24;

export function compactPrice(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const abs = Math.abs(value);
  if (abs >= 100) {
    return Math.round(value * 100) / 100;
  }
  if (abs >= 1) {
    return Math.round(value * 10_000) / 10_000;
  }

  return Number(value.toPrecision(5));
}

export function downsampleSparkline(points: number[], target = SPARKLINE_POINT_COUNT): number[] {
  const finite: number[] = [];
  for (const point of points) {
    if (Number.isFinite(point)) {
      finite.push(point);
    }
  }

  if (finite.length <= target) {
    return finite.map(compactPrice);
  }

  const step = (finite.length - 1) / (target - 1);
  const sampled: number[] = [];

  for (let index = 0; index < target; index += 1) {
    sampled.push(compactPrice(finite[Math.round(index * step)] ?? 0));
  }

  return sampled;
}

export function buildSparklinePath(
  points: number[],
  width = SPARKLINE_WIDTH,
  height = SPARKLINE_HEIGHT,
): string {
  if (points.length < 2) {
    return "";
  }

  let min = points[0] ?? 0;
  let max = min;

  for (let index = 1; index < points.length; index += 1) {
    const value = points[index] ?? min;
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  const range = max - min || 1;
  const last = points.length - 1;
  let path = "";

  for (let index = 0; index < points.length; index += 1) {
    const x = (index / last) * width;
    const y = height - (((points[index] ?? min) - min) / range) * height;
    path += `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }

  return path;
}
