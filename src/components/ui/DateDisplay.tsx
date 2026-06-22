import { formatDateJP } from '../../utils';

export type DateDisplayProps = {
  value: string;
};

export function DateDisplay({ value }: DateDisplayProps) {
  if (!value) return null;

  return <span>{formatDateJP(value)}</span>;
}
