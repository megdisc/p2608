import { DataPage, type Column } from '../components';
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
      ...skillLevels.map(level => ({ label: level.name, value: level.id }))
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
          const levelId = item.evaluations[skill.id];
          const levelName = skillLevels.find(l => l.id === levelId)?.name || '未設定';
          return levelName;
        },
        customEditRender: (_value: any, item: SkillEvaluationGridRow, onChange: (newValue: any) => void) => {
          const levelId = item.evaluations[skill.id] || '';
          return (
            <select 
              value={levelId} 
              onChange={(e) => {
                const newEvaluations = { ...item.evaluations, [skill.id]: e.target.value };
                onChange(newEvaluations);
              }}
              className="form-input"
            >
              {levelOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          );
        },
        onCellChange: (newValue: any, _item: SkillEvaluationGridRow, updateRow) => {
          updateRow({ evaluations: newValue });
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
