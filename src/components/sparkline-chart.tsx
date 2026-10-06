import { memo } from "react";

type SparklineChartProps = {
  path: string;
  rising: boolean;
  waiting?: boolean;
};

export const SparklineChart = memo(function SparklineChart({ path, rising, waiting = false }: SparklineChartProps) {
  if (!path) {
    return (
      <div className={`sparkline-empty${waiting ? " sparkline-pending" : ""}`} aria-hidden="true" />
    );
  }

  return (
    <svg
      className={`sparkline ${rising ? "up" : "down"}`}
      viewBox="0 0 120 36"
      aria-hidden="true"
      shapeRendering="optimizeSpeed"
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
});
