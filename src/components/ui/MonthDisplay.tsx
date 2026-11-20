import React from 'react';
import { formatMonthJP } from '../../utils';

export type MonthDisplayProps = {
  value?: string | Date | null;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function MonthDisplay({ value, fallback = '', className = '', style }: MonthDisplayProps) {
  if (!value) {
    return fallback ? <span className={className} style={style}>{fallback}</span> : null;
  }

  const formatted = formatMonthJP(value);
  if (!formatted) {
    return fallback ? <span className={className} style={style}>{fallback}</span> : null;
  }

  return (
    <span className={`tabular-nums ${className}`.trim()} style={style}>
      {formatted}
    </span>
  );
}
