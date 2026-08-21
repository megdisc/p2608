import { DataTable, Tabs } from '../ui';
import type { Column } from '../ui';
import { useNavigation } from '../../contexts';
import { getScreenConfigForTab } from '../../config';

type DataPageProps<T> = {
  title: string;
  data: T[];
  columns: Column<T>[];
  emptyMessage: string;
  initialSort?: { key: string; direction: 'asc' | 'desc' };
  onBatchSave?: (drafts: T[], deletedIds: string[]) => void;
  onAddRow?: (currentData: T[]) => T;
  headerRight?: React.ReactNode;
  footerLeft?: React.ReactNode;
  showDateFilter?: boolean;
  dateFilterKey?: string;
  showSingleDateFilter?: boolean;
  singleDate?: string;
  onSingleDateChange?: (date: string) => void;
  showMonthFilter?: boolean;
  singleMonth?: string;
  onSingleMonthChange?: (month: string) => void;
  showYearFilter?: boolean;
  singleYear?: string;
  onSingleYearChange?: (year: string) => void;
  canEditRow?: (item: T) => boolean;
  canDeleteRow?: (item: T) => boolean;
  hideDeleteColumn?: boolean;
  showRestrictionColumn?: boolean;
  subItemsKey?: keyof T;
  onAddSubRow?: (parentId: string) => any;
  subSubItemsKey?: string;
  onAddSubSubRow?: (parentId: string, subParentId: string) => any;
  disableAddButton?: boolean;
  highlightInputColumns?: boolean;
  hideHeader?: boolean;
  restrictionTooltipText?: string;
  hideSubSubItems?: (subItem: any) => boolean;
  serverSidePagination?: boolean;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  onSortChange?: (sortConfig: { key: string; direction: 'asc' | 'desc' }) => void;
  onDateFilterChange?: (startDate: string, endDate: string) => void;
  isConfirmed?: boolean;
  onConfirm?: () => void;
  onUnconfirm?: () => void;
  confirmDisabled?: boolean;
  statusBadge?: React.ReactNode;
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
  dateFilterKey,
  showSingleDateFilter,
  singleDate,
  onSingleDateChange,
  showMonthFilter,
  singleMonth,
  onSingleMonthChange,
  showYearFilter,
  singleYear,
  onSingleYearChange,
  canEditRow,
  canDeleteRow,
  hideDeleteColumn,
  showRestrictionColumn,
  subItemsKey,
  onAddSubRow,
  subSubItemsKey,
  onAddSubSubRow,
  disableAddButton,
  highlightInputColumns,
  hideHeader,
  restrictionTooltipText,
  hideSubSubItems,
  serverSidePagination,
  totalCount,
  currentPage,
  onPageChange,
  sortConfig,
  onSortChange,
  onDateFilterChange,
  isConfirmed,
  onConfirm,
  onUnconfirm,
  confirmDisabled,
  statusBadge
}: DataPageProps<T>) {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : title;

  return (
    <>
      {!hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>{displayTitle}</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {screenConfig && navContext && (
              <Tabs tabs={screenConfig.tabs} activeTab={navContext.activeTab} onChange={navContext.setActiveTab} />
            )}
            {headerRight && <div>{headerRight}</div>}
          </div>
        </div>
      )}
      <DataTable 
        data={data} 
        columns={columns} 
        emptyMessage={emptyMessage} 
        initialSort={initialSort} 
        onBatchSave={onBatchSave}
        onAddRow={onAddRow}
        showDateFilter={showDateFilter}
        dateFilterKey={dateFilterKey}
        showSingleDateFilter={showSingleDateFilter}
        singleDate={singleDate}
        onSingleDateChange={onSingleDateChange}
        showMonthFilter={showMonthFilter}
        singleMonth={singleMonth}
        onSingleMonthChange={onSingleMonthChange}
        showYearFilter={showYearFilter}
        singleYear={singleYear}
        onSingleYearChange={onSingleYearChange}
        canEditRow={canEditRow}
        canDeleteRow={canDeleteRow}
        hideDeleteColumn={hideDeleteColumn}
        showRestrictionColumn={showRestrictionColumn}
        footerLeft={footerLeft}
        subItemsKey={subItemsKey}
        onAddSubRow={onAddSubRow}
        subSubItemsKey={subSubItemsKey}
        onAddSubSubRow={onAddSubSubRow}
        disableAddButton={disableAddButton}
        highlightInputColumns={highlightInputColumns}
        restrictionTooltipText={restrictionTooltipText}
        hideSubSubItems={hideSubSubItems}
        serverSidePagination={serverSidePagination}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={onPageChange}
        sortConfig={sortConfig}
        onSortChange={onSortChange}
        onDateFilterChange={onDateFilterChange}
        isConfirmed={isConfirmed}
        onConfirm={onConfirm}
        onUnconfirm={onUnconfirm}
        confirmDisabled={confirmDisabled}
        statusBadge={statusBadge}
      />
    </>
  );
}
