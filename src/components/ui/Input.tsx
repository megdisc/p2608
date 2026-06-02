import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = '', type, ...props }: InputProps) {
  const isCheckboxOrRadio = type === 'checkbox' || type === 'radio';
  const defaultClass = isCheckboxOrRadio ? '' : 'inline-input';

  return (
    <input 
      type={type}
      className={`${defaultClass} ${className}`.trim()} 
      {...props} 
    />
  );
}
