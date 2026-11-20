import React from 'react';

export type NumberDisplayProps = {
  value: number | string | null | undefined;
  useGrouping?: boolean; // If true, adds commas (e.g. 1,000)
  unit?: string;         // e.g. '単位', 'h', '名'
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function NumberDisplay({
  value,
  useGrouping = true,
  unit = '',
  fallback = '-',
  className = '',
  style
}: NumberDisplayProps) {
  if (value === null || value === undefined || value === '') {
    return fallback ? (
      <span 
        className={className} 
        style={{ 
          display: 'inline-block', 
          textAlign: 'right', 
          fontVariantNumeric: 'tabular-nums', 
          ...style 
        }}
      >
        {fallback}
      </span>
    ) : null;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;

  let formattedValue = value.toString();
  if (!isNaN(numericValue)) {
    formattedValue = numericValue.toLocaleString('ja-JP', { useGrouping });
  }

  return (
    <span 
      className={className} 
      style={{ 
        display: 'inline-block',
        width: '100%',
        textAlign: 'right', 
        fontVariantNumeric: 'tabular-nums', 
        ...style 
      }}
    >
      {formattedValue}{unit}
    </span>
  );
}
