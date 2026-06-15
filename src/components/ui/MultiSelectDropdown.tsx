import React, { useState, useRef, useEffect } from 'react';

export type Option = {
  value: string;
  label: string;
};

type MultiSelectDropdownProps = {
  options: Option[];
  value: string[]; // array of selected values
  onChange: (newValue: string[]) => void;
  placeholder?: string;
};

export function MultiSelectDropdown({ options, value, onChange, placeholder = '選択してください' }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedOptions = options.filter(opt => value.includes(opt.value));
  // If there are selected values that are not in the options list, we should still display them (e.g., custom tags if we allowed them, but here we don't).

  return (
    <div className="multi-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="multi-select-input" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minHeight: '32px',
          padding: '4px',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          cursor: 'pointer',
          background: 'var(--color-bg-base)'
        }}
      >
        {selectedOptions.length === 0 && (
          <span style={{ color: 'var(--color-text-muted)', padding: '2px 4px', fontSize: '13px' }}>
            {placeholder}
          </span>
        )}
        {selectedOptions.map(opt => (
          <span 
            key={opt.value} 
            style={{
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {opt.label}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggle(opt.value); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {isOpen && (
        <div 
          className="multi-select-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '8px', color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center' }}>
              選択肢がありません
            </div>
          ) : (
            options.map(opt => (
              <div 
                key={opt.value}
                onClick={() => handleToggle(opt.value)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  background: value.includes(opt.value) ? 'var(--color-bg-subtle)' : 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.background = value.includes(opt.value) ? 'var(--color-bg-subtle)' : 'transparent'}
              >
                <input 
                  type="checkbox" 
                  checked={value.includes(opt.value)} 
                  readOnly 
                  style={{ cursor: 'pointer' }}
                />
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
