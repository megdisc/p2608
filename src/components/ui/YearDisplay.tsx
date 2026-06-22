import { formatYearJP } from '../../utils';

export type YearDisplayProps = {
  value: string;
};

export function YearDisplay({ value }: YearDisplayProps) {
  if (!value) return null;

  return <span>{formatYearJP(value)}</span>;
}
