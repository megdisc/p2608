import React, { useState } from 'react';

export interface SummaryPopupItem {
  label: string;
  value: number | string;
  isTotal?: boolean;
}

export interface SummaryPopupProps {
  title?: string;
  items: SummaryPopupItem[];
  defaultOpen?: boolean;
}

export const SummaryPopup: React.FC<SummaryPopupProps> = ({
  title = '累計金額サマリ',
  items,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const totalItem = items.find(item => item.isTotal);
  const displayTotal = totalItem
    ? typeof totalItem.value === 'number'
      ? `¥${totalItem.value.toLocaleString()}`
      : totalItem.value
    : '';

  return (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 90,
        backgroundColor: 'var(--color-bg-card, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 8px)',
        boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
        fontSize: 'var(--text-body, 13px)',
        color: 'var(--color-text-main, #1e293b)',
        minWidth: '240px',
        maxWidth: '320px',
        transition: 'all 0.2s ease-in-out',
        userSelect: 'none'
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: isOpen ? '1px solid var(--color-border, #e2e8f0)' : 'none',
          backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
          borderTopLeftRadius: 'var(--radius-lg, 8px)',
          borderTopRightRadius: 'var(--radius-lg, 8px)',
          borderBottomLeftRadius: isOpen ? '0' : 'var(--radius-lg, 8px)',
          borderBottomRightRadius: isOpen ? '0' : 'var(--radius-lg, 8px)',
          cursor: 'pointer'
        }}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'サマリを最小化' : 'サマリを展開'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 'var(--weight-heading, 600)' }}>{title}</span>
          {!isOpen && displayTotal && (
            <span style={{ fontWeight: 'var(--weight-heading, 600)', color: 'var(--color-primary, #0284c7)' }}>
              {displayTotal}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: '12px',
            color: 'var(--color-text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isOpen ? '▲ 閉じる' : '▼ 展開'}
        </button>
      </div>

      {/* コンテンツ */}
      {isOpen && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {items.map((item, idx) => {
              const formattedValue = typeof item.value === 'number'
                ? `¥${item.value.toLocaleString()}`
                : item.value;

              if (item.isTotal) {
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '6px',
                      marginTop: '4px',
                      borderTop: '1px dashed var(--color-border, #cbd5e1)',
                      fontWeight: 'var(--weight-heading, 700)',
                      fontSize: '14px',
                      color: 'var(--color-text-main, #0f172a)'
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formattedValue}</span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: 'var(--color-text-muted, #475569)'
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '500' }}>
                    {formattedValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

