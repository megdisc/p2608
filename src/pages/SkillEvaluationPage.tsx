import { useEffect, useMemo, useCallback } from 'react';
import { DataPage, Button, Select, type Column } from '../components';
import type { MemberWithSkillSettings, MemberSkillSettingRow } from '../types';
import { useAlert, useOffice } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useSkillEvaluations } from '../hooks';
import { getCurrentJSTDateOnly, recomputeHistoryPeriods } from '../utils';

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
};

export function SkillEvaluationPage() {
  const { items, skills, skillLevels, allSkillLevels, loading, fetchData, batchSaveEvaluations } = useSkillEvaluations();
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchData(selectedOfficeId).catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchData, selectedOfficeId, showAlert]);

  const levelOptions = useMemo(() => {
    return [
      { label: '-', value: '' },
      ...skillLevels.map(level => ({ label: String(level.levelValue), value: level.id }))
    ];
  }, [skillLevels]);

  const handleAddSubRow = useCallback((parentId: string): MemberSkillSettingRow => {
    const parent = items.find(p => p.id === parentId);
    if (!parent) {
      throw new Error('対象の利用者が見つかりません');
    }

    const today = getCurrentJSTDateOnly();
    const existing = parent.settings || [];
    const sortedDesc = [...existing].sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));

    let defaultStart = today;
    let inheritedEvals: Record<string, string> = {};

    if (sortedDesc.length > 0) {
      const latest = sortedDesc[0];
      inheritedEvals = { ...(latest.evaluations || {}) };
      // フラットプロパティからも引き継ぐ
      Object.entries(latest).forEach(([k, v]) => {
        if (
          k !== 'id' &&
          k !== 'member_id' &&
          k !== 'valid_from' &&
          k !== 'valid_to' &&
          k !== 'evaluations' &&
          typeof v === 'string' &&
          v
        ) {
          inheritedEvals[k] = v;
        }
      });

      if (latest.valid_from >= today) {
        const [y, m, d] = latest.valid_from.split('-').map(Number);
        const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
        defaultStart = nextDate.toISOString().substring(0, 10);
      }
    }

    return {
      id: `NEW-${generateId()}`,
      member_id: parent.id,
      valid_from: defaultStart,
      valid_to: null,
      evaluations: inheritedEvals,
      ...inheritedEvals,
    };
  }, [items]);

  const handleRecomputeSubItems = useCallback((
    subItems: MemberSkillSettingRow[],
    _parent: MemberWithSkillSettings,
    deletedIds?: Set<string> | string[]
  ): MemberSkillSettingRow[] => {
    const recomputed = recomputeHistoryPeriods(subItems, {
      fromKey: 'valid_from',
      toKey: 'valid_to',
      deletedIds,
    });
    return recomputed.sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''));
  }, []);

  const columns: Column<any>[] = useMemo(() => {
    const cols: Column<any>[] = [
      {
        key: 'code',
        header: TABLE_COLUMNS.MEMBER_ID,
        sortable: true,
        sortKey: 'code',
        editable: false,
        rowType: 'main',
        style: { width: '120px' },
      },
      {
        key: 'name',
        header: TABLE_COLUMNS.NAME,
        sortable: true,
        sortKey: 'yomigana',
        editable: false,
        rowType: 'main',
        style: { width: '160px' },
      },
      {
        key: 'valid_from',
        header: TABLE_COLUMNS.VALID_PERIOD_FROM,
        sortable: false,
        rowType: 'sub',
        editable: true,
        inputType: 'date',
        style: { width: '150px' },
        mainRender: (_parentItem, addSubRow) => (
          <Button onClick={addSubRow}>
            ＋ 履歴追加
          </Button>
        ),
      },
      {
        key: 'valid_to',
        header: TABLE_COLUMNS.VALID_PERIOD_TO,
        sortable: false,
        rowType: 'sub',
        editable: false,
        inputType: 'date',
        style: { width: '150px' },
      },
    ];

    skills.forEach(skill => {
      cols.push({
        key: skill.id,
        groupHeader: skill.categoryName || '未分類',
        header: skill.name,
        rowType: 'sub',
        editable: true,
        inputType: 'select',
        options: levelOptions,
        style: { minWidth: '100px', textAlign: 'center' },
        render: (subItem: MemberSkillSettingRow) => {
          const levelId = (subItem as any)[skill.id] || subItem.evaluations?.[skill.id];
          const levelVal = (allSkillLevels && allSkillLevels.length > 0 ? allSkillLevels : skillLevels).find(l => l.id === levelId)?.levelValue;
          return levelVal !== undefined ? String(levelVal) : '-';
        },
        customEditRender: (_value: any, subItem: MemberSkillSettingRow, onChange: (newValue: any) => void) => {
          const levelId = (subItem as any)[skill.id] || subItem.evaluations?.[skill.id] || '';
          return (
            <Select
              value={levelId}
              onChange={(e) => {
                if (!subItem.evaluations) subItem.evaluations = {};
                subItem.evaluations[skill.id] = e.target.value;
                (subItem as any)[skill.id] = e.target.value;
                onChange(e.target.value);
              }}
              options={levelOptions}
            />
          );
        },
        onCellChange: (newValue: any, _subItem: MemberSkillSettingRow, updateRow) => {
          updateRow({ [skill.id]: newValue });
        },
      });
    });

    return cols;
  }, [skills, skillLevels, allSkillLevels, levelOptions]);

  const handleBatchSave = async (drafts: MemberWithSkillSettings[], deletedIds: string[]) => {
    try {
      await batchSaveEvaluations(drafts, deletedIds);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
      throw err;
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.SKILL_EVALUATION}
      data={items}
      columns={columns}
      emptyMessage="利用者が登録されていません。"
      subItemsKey="settings"
      onAddSubRow={handleAddSubRow}
      recomputeSubItems={handleRecomputeSubItems}
      onBatchSave={handleBatchSave}
      hideAddButton={true}
      canDeleteRow={() => false}
      hideHeader={true}
    />
  );
}
