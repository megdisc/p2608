type SortIconProps = {
  active: boolean;
  direction?: 'asc' | 'desc';
};

export function SortIcon({ active, direction = 'asc' }: SortIconProps) {
  return (
    <span
      style={{
        fontSize: '12px',
        color: active ? '#0f172a' : '#cbd5e1',
        fontWeight: active ? 'bold' : 'normal',
        marginLeft: '4px',
        userSelect: 'none',
        transition: 'color 0.15s ease'
      }}
    >
      {active && direction === 'desc' ? '▼' : '▲'}
    </span>
  );
}
