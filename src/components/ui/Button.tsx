import React from 'react';

type ButtonVariant = 'primary' | 'success' | 'secondary' | 'danger' | 'edit';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = 'primary', className = '', style, children, ...props }: ButtonProps) {
  const baseClass = 'action-btn';
  
  let variantClass = '';
  switch (variant) {
    case 'primary':
      variantClass = 'add-btn';
      break;
    case 'success':
      variantClass = 'save-btn';
      break;
    case 'secondary':
      variantClass = 'cancel-btn';
      break;
    case 'danger':
      variantClass = 'delete-btn';
      break;
    case 'edit':
      variantClass = 'edit-btn';
      break;
  }

  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`.trim()} 
      style={{ padding: '8px 16px', fontWeight: 'bold', ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
