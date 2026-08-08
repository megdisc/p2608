import { useState, useRef } from 'react';

export type YearInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function YearInput({ value, onChange, className = '', style }: YearInputProps) {
  const finalClass = className || 'inline-input';
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="2000"
        max="2100"
        value={value}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        onBlur={() => setIsEditing(false)}
        className={finalClass}
        style={{ ...style, width: '100px' }}
      />
    );
  }

  return (
    <div 
      className={finalClass} 
      onClick={handleContainerClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', paddingRight: '4px', whiteSpace: 'nowrap', ...style }}
    >
      <span>{value}年</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px' }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    </div>
  );
}
