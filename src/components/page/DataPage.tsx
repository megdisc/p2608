import { DataTable } from '../ui';
import type { Column } from '../ui';

type DataPageProps<T> = {
  title: string;
  data: T[];
  columns: Column<T>[];
  emptyMessage: string;
  initialSort?: { key: string; direction: 'asc' | 'desc' };
  onBatchSave?: (drafts: T[], deletedIds: string[]) => void;
  onAddRow?: () => T;
  headerRight?: React.ReactNode;
  footerLeft?: React.ReactNode;
  showDateFilter?: boolean;
  showSingleDateFilter?: boolean;
  canEditRow?: (item: T) => boolean;
  canDeleteRow?: (item: T) => boolean;
  showRestrictionColumn?: boolean;
  subItemsKey?: keyof T;
  onAddSubRow?: (parentId: string) => any;
  subSubItemsKey?: string;
  onAddSubSubRow?: (parentId: string, subParentId: string) => any;
};

export function DataPage<T extends { id: string }>({ 
  title, 
  data, 
  columns, 
  emptyMessage, 
  initialSort,
  onBatchSave,
  onAddRow,
  headerRight,
  footerLeft,
  showDateFilter,
  showSingleDateFilter,
  canEditRow,
  canDeleteRow,
  showRestrictionColumn,
  subItemsKey,
  onAddSubRow,
  subSubItemsKey,
  onAddSubSubRow
}: DataPageProps<T>) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <DataTable 
        data={data} 
        columns={columns} 
        emptyMessage={emptyMessage} 
        initialSort={initialSort} 
        onBatchSave={onBatchSave}
        onAddRow={onAddRow}
        showDateFilter={showDateFilter}
        showSingleDateFilter={showSingleDateFilter}
        canEditRow={canEditRow}
        canDeleteRow={canDeleteRow}
        showRestrictionColumn={showRestrictionColumn}
        footerLeft={footerLeft}
        subItemsKey={subItemsKey}
        onAddSubRow={onAddSubRow}
        subSubItemsKey={subSubItemsKey}
        onAddSubSubRow={onAddSubSubRow}
      />
    </>
  );
}
