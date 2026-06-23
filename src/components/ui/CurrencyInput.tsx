import { useState } from 'react';
import { Input, type InputProps } from './Input';

export type CurrencyInputProps = Omit<InputProps, 'onChange'> & {
  value: number | string | null;
  onChange: (value: string) => void;
};

export function CurrencyInput({ value, onChange, className = '', style, ...props }: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = isFocused 
    ? (value ?? '')
    : (value !== null && value !== undefined && value !== '' ? `¥${Number(value).toLocaleString()}` : '');

  return (
    <Input
      type={isFocused ? 'number' : 'text'}
      value={displayValue}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={className}
      style={{
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        ...style
      }}
      step="any"
      {...props}
    />
  );
}
