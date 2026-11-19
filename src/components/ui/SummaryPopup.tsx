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
    <div className="summary-popup-fixed">
      {/* ヘッダー */}
      <div
        className={`summary-popup-header ${isOpen ? 'open' : 'closed'}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'サマリを最小化' : 'サマリを展開'}
      >
        <div className="flex-row">
          <span style={{ fontWeight: 'var(--weight-heading)' }}>{title}</span>
          {!isOpen && displayTotal && (
            <span style={{ fontWeight: 'var(--weight-heading)', color: 'var(--palette-bluegreen-700)' }}>
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
          className="summary-popup-toggle-btn"
        >
          {isOpen ? '▲ 閉じる' : '▼ 展開'}
        </button>
      </div>

      {/* コンテンツ */}
      {isOpen && (
        <div className="summary-popup-body">
          {items.map((item, idx) => {
            const formattedValue = typeof item.value === 'number'
              ? `¥${item.value.toLocaleString()}`
              : item.value;

            if (item.isTotal) {
              return (
                <div key={idx} className="summary-popup-total">
                  <span>{item.label}</span>
                  <span className="tabular-nums">{formattedValue}</span>
                </div>
              );
            }

            return (
              <div key={idx} className="summary-popup-row">
                <span>{item.label}</span>
                <span className="tabular-nums">
                  {formattedValue}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

