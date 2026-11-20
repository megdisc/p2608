import React from 'react';
import { formatJST } from '../../utils';

export type DateTimeDisplayProps = {
  value?: string | Date | null;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function DateTimeDisplay({ value, fallback = '', className = '', style }: DateTimeDisplayProps) {
  if (!value) {
    return fallback ? <span className={className} style={style}>{fallback}</span> : null;
  }

  const formatted = formatJST(value);
  if (!formatted) {
    return fallback ? <span className={className} style={style}>{fallback}</span> : null;
  }

  return (
    <span className={`tabular-nums ${className}`.trim()} style={style}>
      {formatted}
    </span>
  );
}
