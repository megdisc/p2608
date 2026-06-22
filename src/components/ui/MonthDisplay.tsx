import { formatMonthJP } from '../../utils';

export type MonthDisplayProps = {
  value: string;
};

export function MonthDisplay({ value }: MonthDisplayProps) {
  if (!value) return null;

  return <span>{formatMonthJP(value)}</span>;
}
