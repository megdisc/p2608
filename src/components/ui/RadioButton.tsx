import React from 'react';

export interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          type="radio"
          ref={ref}
          className="custom-radio"
          {...props}
        />
        <span className="text-body text-main">{label}</span>
      </label>
    );
  }
);

RadioButton.displayName = 'RadioButton';
