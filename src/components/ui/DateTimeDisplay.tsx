export type DateTimeDisplayProps = {
  value: string;
};

export function DateTimeDisplay({ value }: DateTimeDisplayProps) {
  if (!value) return null;

  const parts = value.split(' ');
  if (parts.length !== 2) return <span>{value}</span>;
  
  const [datePart, timePart] = parts;
  const dateParts = datePart.split('-');
  if (dateParts.length !== 3) return <span>{value}</span>;
  
  const [y, m, d] = dateParts;
  return <span>{`${y}年${m}月${d}日 ${timePart}`}</span>;
}
