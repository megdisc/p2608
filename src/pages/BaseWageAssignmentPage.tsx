import { useEffect } from 'react';
import { DataPage, Button, MonthDisplay, type Column } from '../components';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES, WORDS_COMMON } from '../constants';
import { useAlert, useOffice } from '../contexts';
import { useBaseWageAssignments } from '../hooks';
import type { MemberWageAssignmentGridRow, MemberWageSettingItem } from '../types';
import { getPreviousMonth } from '../utils';

export function BaseWageAssignmentPage() {
  const { items, baseWages, loading, fetchAssignments, batchSaveAssignments } = useBaseWageAssignments();
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchAssignments(selectedOfficeId).catch(() => {
      showAlert(MESSAGES.FETCH_ERROR, 'error');
    });
  }, [fetchAssignments, selectedOfficeId, showAlert]);

  const wageOptions = [
    { label: WORDS_COMMON.UNSELECTED, value: WORDS_COMMON.EMPTY_VALUE },
    ...baseWages.map(w => ({
      label: `¥${w.wage.toLocaleString()}${w.description ? ` (${w.description})` : ''}`,
      value: w.id,
    })),
  ];

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: TABLE_COLUMNS.MEMBER_ID,
      sortKey: 'code',
      editable: false,
      rowType: 'main',
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.NAME,
      sortKey: 'yomigana',
      editable: false,
      rowType: 'main',
    },
    {
      key: 'wageRateId',
      header: TABLE_COLUMNS.BASE_WAGE,
      editable: true,
      inputType: 'select',
      options: wageOptions,
      rowType: 'sub',
      sortable: false,
      mainRender: (_item, addSubRow) => (
        <Button onClick={addSubRow}>
          ＋ 工賃単価追加
        </Button>
      ),
    },
    {
      key: 'startPeriod',
      header: TABLE_COLUMNS.APPLY_START_MONTH,
      editable: true,
      inputType: 'month',
      rowType: 'sub',
      sortable: false,
    },
    {
      key: 'endPeriod',
      header: TABLE_COLUMNS.APPLY_END_MONTH,
      editable: false,
      style: { backgroundColor: '#ffffff' },
      rowType: 'sub',
      sortable: false,
      render: (item: any) => {
        return item.endPeriod ? <MonthDisplay value={item.endPeriod} /> : <span className="text-muted">-</span>;
      },
    },
    {
      key: 'remarks',
      header: TABLE_COLUMNS.REMARKS,
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
    },
  ];

  const handleBatchSave = async (drafts: MemberWageAssignmentGridRow[], deletedIds: string[]) => {
    try {
      await batchSaveAssignments(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(err instanceof Error ? err.message : MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  const recomputeWageSettings = (
    settings: MemberWageSettingItem[],
    _parentItem: any,
    deletedIds?: Set<string>
  ): MemberWageSettingItem[] => {
    if (!settings || settings.length === 0) return [];

    // 削除フラグが立っていない有効な履歴
    const active = settings.filter(s => !deletedIds?.has(s.id));

    // startPeriod の昇順（古い順）にソートして適用終了年月を計算
    const sortedActive = [...active].sort((a, b) => {
      const aP = a.startPeriod || '9999-99';
      const bP = b.startPeriod || '9999-99';
      return aP.localeCompare(bP);
    });

    const endPeriodMap = new Map<string, string>();
    for (let i = 0; i < sortedActive.length; i++) {
      const curr = sortedActive[i];
      const isLatest = i === sortedActive.length - 1;
      if (isLatest) {
        // 最新データ（現在適用中）の適用終了年月は空
        endPeriodMap.set(curr.id, '');
      } else {
        // 直後のデータの適用開始年月の前月
        const next = sortedActive[i + 1];
        endPeriodMap.set(curr.id, next.startPeriod ? getPreviousMonth(next.startPeriod) : '');
      }
    }

    const updated = settings.map(s => {
      if (deletedIds?.has(s.id)) return s;
      return {
        ...s,
        endPeriod: endPeriodMap.get(s.id) ?? s.endPeriod ?? '',
      };
    });

    // 画面表示は startPeriod の降順（新しい順）で統一
    updated.sort((a, b) => {
      const aP = a.startPeriod || '9999-99';
      const bP = b.startPeriod || '9999-99';
      return bP.localeCompare(aP);
    });

    return updated;
  };

  const handleAddSubRow = (parentId: string) => {
    const currentParent = items.find(i => i.id === parentId);
    const currentMonth = new Date().toISOString().substring(0, 7);

    // 既存の最も新しい startPeriod を確認
    let defaultStartPeriod = currentMonth;
    const allPeriods = (currentParent?.wageSettings || [])
      .map(s => s.startPeriod)
      .filter(Boolean)
      .sort()
      .reverse();

    if (allPeriods.length > 0 && allPeriods[0] >= currentMonth) {
      // 既存最新が当月以降の場合は翌月をデフォルトとする
      const [yStr, mStr] = allPeriods[0].split('-');
      let y = parseInt(yStr, 10);
      let m = parseInt(mStr, 10) + 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      defaultStartPeriod = `${y}-${String(m).padStart(2, '0')}`;
    }

    return {
      id: `WAG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      wageRateId: baseWages.length > 0 ? baseWages[0].id : '',
      startPeriod: defaultStartPeriod,
      endPeriod: '',
      remarks: '',
    } as MemberWageSettingItem;
  };

  if (loading) return <div className="loading-container">{MESSAGES.LOADING}</div>;

  return (
    <DataPage
      title={PAGE_NAMES.BASE_WAGE_ASSIGNMENT}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_BASE_WAGE_ASSIGNMENT}
      initialSort={{ key: 'code', direction: 'asc' }}
      onBatchSave={handleBatchSave}
      subItemsKey="wageSettings"
      onAddSubRow={handleAddSubRow}
      recomputeSubItems={recomputeWageSettings}
      hideAddButton={true}
      hideHeader={true}
    />
  );
}
