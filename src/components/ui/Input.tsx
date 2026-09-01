import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = '', type, ...props }: InputProps) {
  const isCheckbox = type === 'checkbox';
  const isRadio = type === 'radio';
  const defaultClass = isCheckbox ? 'custom-checkbox' : isRadio ? 'custom-radio' : 'inline-input';

  return (
    <input 
      type={type}
      className={`${defaultClass} ${className}`.trim()} 
      {...props} 
    />
  );
}
