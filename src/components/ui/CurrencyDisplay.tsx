import React from 'react';
import { formatCurrency, type CurrencyFormatOptions } from '../../utils';

export type CurrencyDisplayProps = CurrencyFormatOptions & {
  value: number | string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
};

export function CurrencyDisplay({
  value,
  showSymbol = true,
  unit = '',
  fallback = '-',
  className = '',
  style
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(value, { showSymbol, unit, fallback });

  return (
    <span 
      className={`tabular-nums ${className}`.trim()} 
      style={{ 
        display: 'inline-block',
        textAlign: 'right', 
        fontVariantNumeric: 'tabular-nums',
        ...style 
      }}
    >
      {formatted}
    </span>
  );
}
