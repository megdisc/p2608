

type SortIconProps = {
  active: boolean;
  direction: 'asc' | 'desc';
};

export function SortIcon({ active, direction }: SortIconProps) {
  return (
    <span style={{ 
      fontSize: 'var(--text-caption)', 
      color: active ? 'inherit' : 'var(--color-border)', 
      transition: 'color 0.2s' 
    }}>
      {active && direction === 'desc' ? '▼' : '▲'}
    </span>
  );
}
