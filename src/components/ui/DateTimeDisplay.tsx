export type DateTimeDisplayProps = {
  value: string;
};

export function DateTimeDisplay({ value }: DateTimeDisplayProps) {
  if (!value) return null;

  const date = new Date(value.replace(' ', 'T'));
  
  if (isNaN(date.getTime())) return <span>{value}</span>;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return <span>{`${y}年${m}月${d}日 ${h}:${min}`}</span>;
}
