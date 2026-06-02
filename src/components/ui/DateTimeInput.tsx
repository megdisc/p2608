import { useState, useRef } from 'react';
import { DateTimeDisplay } from './DateTimeDisplay';

export type DateTimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function DateTimeInput({ value, onChange, className = '' }: DateTimeInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputValue = typeof value === 'string' ? value.replace(' ', 'T') : value;

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
        type="datetime-local"
        value={inputValue}
        onChange={(e) => onChange(e.target.value.replace('T', ' '))}
        onBlur={() => setIsEditing(false)}
        className={`inline-input ${className}`.trim()}
      />
    );
  }

  return (
    <div 
      className={`inline-input ${className}`.trim()} 
      onClick={handleContainerClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', paddingRight: '4px' }}
    >
      <DateTimeDisplay value={value} />
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px' }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    </div>
  );
}
