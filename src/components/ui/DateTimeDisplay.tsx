import { formatJST } from '../../utils/date';

export type DateTimeDisplayProps = {
  value: string;
};

export function DateTimeDisplay({ value }: DateTimeDisplayProps) {
  if (!value) return null;

  return <span>{formatJST(value)}</span>;
}
