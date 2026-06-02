import React from 'react';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options?: { label: string; value: string }[];
};

export function Select({ options, className = '', children, ...props }: SelectProps) {
  return (
    <select className={`inline-input ${className}`.trim()} {...props}>
      {options ? options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      )) : children}
    </select>
  );
}
