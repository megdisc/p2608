import React, { useState, useRef } from 'react';
import type { ReactNode, ElementType } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  text: string;
  children: ReactNode;
  as?: ElementType;
};

export function Tooltip({ text, children, as: Component = 'div' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const childrenRef = useRef<any>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsVisible(true);
    setCoords({ x: e.clientX, y: e.clientY - 15 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isVisible) {
      setCoords({ x: e.clientX, y: e.clientY - 15 });
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <Component 
      ref={childrenRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'contents' }}
    >
      {children}
      {isVisible && createPortal(
        <div 
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'var(--color-bg-inverse)',
            color: 'var(--palette-white)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 9999,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </Component>
  );
}
