export type NumberDisplayProps = {
  value: number | string | null | undefined;
  useGrouping?: boolean; // If true, adds commas (e.g. 1,000)
  className?: string;
  style?: React.CSSProperties;
};

export function NumberDisplay({ value, useGrouping = true, className = '', style }: NumberDisplayProps) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;

  // Formatting safely
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
      {formattedValue}
    </span>
  );
}
