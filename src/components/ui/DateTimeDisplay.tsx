import { formatJST } from '../../utils';

export type DateTimeDisplayProps = {
  value: string;
};

export function DateTimeDisplay({ value }: DateTimeDisplayProps) {
  if (!value) return null;

  return <span>{formatJST(value)}</span>;
}
