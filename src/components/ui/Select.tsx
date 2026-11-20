import React from 'react';

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options?: SelectOption[];
};

export function Select({ options, className = '', children, ...props }: SelectProps) {
  return (
    <select className={`inline-input ${className}`.trim()} {...props}>
      {options ? options.map(opt => (
        <option 
          key={opt.value} 
          value={opt.value}
          disabled={opt.disabled}
          style={opt.disabled ? { color: 'var(--color-text-disabled)' } : undefined}
        >
          {opt.label || '-'}
        </option>
      )) : children}
    </select>
  );
}
