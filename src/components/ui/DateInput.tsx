import { useState, useRef } from 'react';
import { DateDisplay } from './DateDisplay';

export type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function DateInput({ value, onChange, className = '', style }: DateInputProps) {
  const finalClass = className || 'inline-input';
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        try {
          if ('showPicker' in inputRef.current) {
            (inputRef.current as any).showPicker();
          }
        } catch (e) {
          // Ignore
        }
      }
    }, 10);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        onBlur={() => setIsEditing(false)}
        className={finalClass}
        style={style}
      />
    );
  }

  return (
    <div 
      className={finalClass} 
      onClick={handleContainerClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', paddingRight: '4px', ...style }}
    >
      <DateDisplay value={value} />
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px' }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    </div>
  );
}
