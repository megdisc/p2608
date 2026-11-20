import React from 'react';
import { formatTime, formatTimeRange } from '../../utils';

export type TimeDisplayProps = {
  value?: string | null;
  endTime?: string | null;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function TimeDisplay({
  value,
  endTime,
  fallback = '-',
  className = '',
  style
}: TimeDisplayProps) {
  let formatted: string;

  if (endTime !== undefined) {
    formatted = formatTimeRange(value, endTime, fallback);
  } else {
    formatted = formatTime(value) || fallback;
  }

  return (
    <span className={`tabular-nums ${className}`.trim()} style={style}>
      {formatted}
    </span>
  );
}
