import { DataTable } from '../ui';
import type { Column } from '../ui';

type DataPageProps<T> = {
  title: string;
  data: T[];
  columns: Column<T>[];
  emptyMessage: string;
};

export function DataPage<T extends { id: string }>({ title, data, columns, emptyMessage }: DataPageProps<T>) {
  return (
    <>
      <h2>{title}</h2>
      <DataTable data={data} columns={columns} emptyMessage={emptyMessage} />
    </>
  );
}
