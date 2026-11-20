import React from 'react';
import { formatYearJP } from '../../utils';

export type YearDisplayProps = {
  value?: string | Date | null;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function YearDisplay({ value, fallback = '', className = '', style }: YearDisplayProps) {
  if (!value) {
    return fallback ? <span className={className} style={style}>{fallback}</span> : null;
  }

  const formatted = formatYearJP(value);
  if (!formatted) {
    return fallback ? <span className={className} style={style}>{fallback}</span> : null;
  }

  return (
    <span className={`tabular-nums ${className}`.trim()} style={style}>
      {formatted}
    </span>
  );
}
