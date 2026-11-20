import React from 'react';
import { formatDateJP } from '../../utils';

export type DateDisplayProps = {
  value?: string | Date | null;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function DateDisplay({ value, fallback = '', className = '', style }: DateDisplayProps) {
  if (!value) {
    return fallback ? <span className={className} style={style}>{fallback}</span> : null;
  }

  const formatted = formatDateJP(value);
  if (!formatted) {
    return fallback ? <span className={className} style={style}>{fallback}</span> : null;
  }

  return (
    <span className={`tabular-nums ${className}`.trim()} style={style}>
      {formatted}
    </span>
  );
}
