interface ScoreBarProps {
  /** 0–100 */
  score: number;
  /** Optional explicit height in px (default 4) */
  height?: number;
  /** Show percentage label beside bar */
  showLabel?: boolean;
  className?: string;
}

/** Returns the CSS colour for a score threshold */
export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--accent-success)';
  if (score >= 40) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

export default function ScoreBar({
  score,
  height = 4,
  showLabel = false,
  className = '',
}: ScoreBarProps) {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));
  const color = scoreColor(clampedScore);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: `${height}px`, backgroundColor: 'var(--bg-muted)' }}
        role="progressbar"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score: ${clampedScore}%`}
      >
        <div
          className="h-full rounded-full transition-[width,filter] duration-500 ease-out"
          style={{
            width: `${clampedScore}%`,
            background: 'linear-gradient(90deg, var(--accent-danger) 0%, var(--accent-warning) 50%, var(--accent-success) 100%)',
            filter: clampedScore === 100 ? 'saturate(1.12)' : undefined,
          }}
        />
      </div>
      {showLabel && (
        <span
          className="text-caption font-medium tabular-nums min-w-[36px] text-right"
          style={{ color }}
        >
          {clampedScore}%
        </span>
      )}
    </div>
  );
}
