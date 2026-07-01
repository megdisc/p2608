import { DataPage, Select, type Column } from '../components';
import { useEffect, useMemo } from 'react';
import type { SkillEvaluationGridRow } from '../types';
import { useAlert } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useSkillEvaluations } from '../hooks';

export function SkillEvaluationPage() {
  const { items, skills, skillLevels, loading, fetchData, batchSaveEvaluations } = useSkillEvaluations();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchData().catch(() => {
      showAlert('データ取得に失敗しました', 'error');
    });
  }, [fetchData, showAlert]);

  const levelOptions = useMemo(() => {
    return [
      { label: '未設定', value: '' },
      ...skillLevels.map(level => ({ label: String(level.levelValue), value: level.id }))
    ];
  }, [skillLevels]);

  const columns: Column<SkillEvaluationGridRow>[] = useMemo(() => {
    const cols: Column<SkillEvaluationGridRow>[] = [
      { 
        key: 'memberName', 
        header: TABLE_COLUMNS.NAME, 
        sortable: true,
        editable: false
      }
    ];

    skills.forEach(skill => {
      cols.push({
        key: skill.id, // We'll map the cell to evaluations[skill.id]
        header: skill.name,
        editable: true,
        inputType: 'select',
        options: levelOptions,
        render: (item: SkillEvaluationGridRow) => {
          const levelId = (item as any)[skill.id] || item.evaluations[skill.id];
          const levelVal = skillLevels.find(l => l.id === levelId)?.levelValue;
          return levelVal !== undefined ? String(levelVal) : '未設定';
        },
        customEditRender: (_value: any, item: SkillEvaluationGridRow, onChange: (newValue: any) => void) => {
          const levelId = (item as any)[skill.id] || item.evaluations[skill.id] || '';
          return (
            <Select 
              value={levelId} 
              onChange={(e) => {
                const newEvaluations = { ...item.evaluations, [skill.id]: e.target.value };
                item.evaluations = newEvaluations; // update reference on item directly
                onChange(e.target.value); // this updates the flattened property via DataTable
              }}
              options={levelOptions}
            />
          );
        },
        onCellChange: (newValue: any, _item: SkillEvaluationGridRow, updateRow) => {
          updateRow({ [skill.id]: newValue });
        }
      });
    });

    return cols;
  }, [skills, skillLevels, levelOptions]);

  const handleBatchSave = async (drafts: SkillEvaluationGridRow[]) => {
    try {
      await batchSaveEvaluations(drafts);
      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.SKILL_EVALUATION}
      data={items}
      columns={columns}
      emptyMessage="利用者が登録されていません。"
      onBatchSave={handleBatchSave}
      disableAddButton={true}
      hideDeleteColumn={true}
    />
  );
}
