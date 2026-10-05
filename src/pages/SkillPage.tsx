import { useEffect, useMemo, useCallback } from 'react';
import { DataPage, Button, type Column } from '../components';
import type { SkillItem, SkillCategoryItem } from '../types';
import { useAlert, useOffice } from '../contexts';
import { TABLE_COLUMNS, PAGE_NAMES, MESSAGES } from '../constants';
import { useSkills, useSkillCategories } from '../hooks';

type CategoryWithSkills = SkillCategoryItem & {
  skills: SkillItem[];
  isUncategorized?: boolean;
};

export function SkillPage() {
  const { items: skills, loading: loadingSkills, fetchSkills, batchSaveSkills } = useSkills();
  const { categories, loading: loadingCategories, fetchCategories, batchSaveCategories } = useSkillCategories();
  const { selectedOfficeId } = useOffice();
  const { showAlert } = useAlert();

  // データ取得
  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchSkills(selectedOfficeId),
        fetchCategories(selectedOfficeId)
      ]);
    } catch {
      showAlert('データ取得に失敗しました', 'error');
    }
  }, [fetchSkills, fetchCategories, selectedOfficeId, showAlert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // カテゴリ ＋ スキルのネスト表示用データ構築
  const items: CategoryWithSkills[] = useMemo(() => {
    const sortedCategories = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const list: CategoryWithSkills[] = sortedCategories.map(cat => {
      const catSkills = skills
        .filter(s => s.category_id === cat.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return {
        ...cat,
        skills: catSkills
      };
    });

    // カテゴリ未分類のスキル群
    const uncategorizedSkills = skills
      .filter(s => !s.category_id || !categories.some(c => c.id === s.category_id))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    if (uncategorizedSkills.length > 0 || list.length === 0) {
      list.push({
        id: 'UNCATEGORIZED',
        name: '未分類',
        description: 'カテゴリに属さないスキル',
        skills: uncategorizedSkills,
        isUncategorized: true
      });
    }

    return list;
  }, [categories, skills]);

  const columns: Column<CategoryWithSkills>[] = [
    {
      key: 'name',
      header: 'カテゴリ',
      editable: false,
      inputType: 'text',
      rowType: 'main',
      render: (item: CategoryWithSkills) => (
        item.isUncategorized ? (
          <span style={{ color: '#64748b', fontStyle: 'italic', fontWeight: 600 }}>未分類</span>
        ) : (
          <span>{item.name}</span>
        )
      )
    },
    {
      key: 'name',
      header: TABLE_COLUMNS.SKILL_NAME,
      editable: true,
      inputType: 'text',
      rowType: 'sub',
      sortable: false,
      onCellChange: (newValue, _item: any, updateRow) => {
        updateRow({ name: newValue });
      },
      mainRender: (_item, addSubRow) => (
        <Button onClick={addSubRow}>
          ＋ スキル追加
        </Button>
      )
    },
    {
      key: 'description',
      header: TABLE_COLUMNS.DESCRIPTION,
      editable: (item: any) => !Array.isArray(item.skills),
      inputType: 'text',
      rowType: 'both',
      sortable: false,
      onCellChange: (newValue, _item: any, updateRow) => {
        updateRow({ description: newValue });
      }
    },
    {
      key: 'reorder',
      header: TABLE_COLUMNS.REORDER,
      rowType: 'sub',
      sortable: false,
      render: (item: any, draftData: CategoryWithSkills[], updateData?: (newData: CategoryWithSkills[]) => void) => {
        if (!updateData || Array.isArray(item.skills)) return null;

        const subItem: SkillItem = item;
        const catIndex = draftData.findIndex(c => c.skills && c.skills.some(s => s.id === subItem.id));
        if (catIndex === -1) return null;
        
        const cat = draftData[catIndex];
        const skillIndex = cat.skills.findIndex(s => s.id === subItem.id);

        const handleUp = () => {
          if (skillIndex > 0) {
            const newDraft = [...draftData];
            const newSkills = [...cat.skills];
            const temp = newSkills[skillIndex - 1];
            newSkills[skillIndex - 1] = newSkills[skillIndex];
            newSkills[skillIndex] = temp;
            newSkills.forEach((s, idx) => { s.sort_order = idx; });
            newDraft[catIndex] = { ...cat, skills: newSkills };
            updateData(newDraft);
          }
        };

        const handleDown = () => {
          if (skillIndex >= 0 && skillIndex < cat.skills.length - 1) {
            const newDraft = [...draftData];
            const newSkills = [...cat.skills];
            const temp = newSkills[skillIndex + 1];
            newSkills[skillIndex + 1] = newSkills[skillIndex];
            newSkills[skillIndex] = temp;
            newSkills.forEach((s, idx) => { s.sort_order = idx; });
            newDraft[catIndex] = { ...cat, skills: newSkills };
            updateData(newDraft);
          }
        };

        return (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <Button onClick={handleUp} disabled={skillIndex <= 0} style={{ padding: '4px 8px', minWidth: 'auto' }}>↑</Button>
            <Button onClick={handleDown} disabled={skillIndex === -1 || skillIndex >= cat.skills.length - 1} style={{ padding: '4px 8px', minWidth: 'auto' }}>↓</Button>
          </div>
        );
      }
    },
    {
      key: 'categoryChange',
      header: TABLE_COLUMNS.CATEGORY_CHANGE,
      rowType: 'sub',
      sortable: false,
      render: (item: any, draftData: CategoryWithSkills[], updateData?: (newData: CategoryWithSkills[]) => void) => {
        if (!updateData || Array.isArray(item.skills)) return null;

        const subItem: SkillItem = item;

        const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const newCatId = e.target.value || null;
          let foundSkill: SkillItem | null = null;

          const newDraft = draftData.map(cat => {
            const remainingSkills = cat.skills.filter(s => {
              if (s.id === subItem.id) {
                foundSkill = { ...s, category_id: newCatId };
                return false;
              }
              return true;
            });
            return { ...cat, skills: remainingSkills };
          });

          if (!foundSkill) return;

          const targetCatId = newCatId || 'UNCATEGORIZED';
          let targetCat = newDraft.find(c => c.id === targetCatId);

          if (!targetCat && targetCatId === 'UNCATEGORIZED') {
            targetCat = {
              id: 'UNCATEGORIZED',
              name: '未分類',
              description: 'カテゴリに属さないスキル',
              skills: [],
              isUncategorized: true
            };
            newDraft.push(targetCat);
          }

          if (targetCat) {
            targetCat.skills.push(foundSkill);
          }

          updateData(newDraft);
        };

        const currentCatId = subItem.category_id || '';

        return (
          <select
            value={currentCatId}
            onChange={handleCategorySelect}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '14px',
              width: '100%'
            }}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
            <option value="">未分類</option>
          </select>
        );
      }
    }
  ];

  const handleBatchSave = async (drafts: CategoryWithSkills[], deletedIds: string[]) => {
    try {
      const deletedCatIds: string[] = [];
      const deletedSklIds: string[] = [];

      deletedIds.forEach(id => {
        if (id.startsWith('SKL-') || id.includes('-skill-')) {
          deletedSklIds.push(id);
        } else if (id !== 'UNCATEGORIZED') {
          deletedCatIds.push(id);
        }
      });

      const activeCats: SkillCategoryItem[] = [];
      const activeSkls: SkillItem[] = [];

      drafts.forEach(cat => {
        if (!cat.isUncategorized && !deletedIds.includes(cat.id)) {
          activeCats.push({
            id: cat.id,
            office_id: cat.office_id,
            name: cat.name,
            description: cat.description || '',
            sort_order: cat.sort_order
          });
        }

        const catId = cat.isUncategorized ? null : cat.id;

        (cat.skills || []).forEach((skl, idx) => {
          if (!deletedIds.includes(skl.id)) {
            activeSkls.push({
              id: skl.id,
              office_id: skl.office_id,
              category_id: catId,
              name: skl.name,
              description: skl.description || '',
              sort_order: skl.sort_order ?? idx
            });
          }
        });
      });

      await Promise.all([
        batchSaveCategories(activeCats, deletedCatIds, selectedOfficeId),
        batchSaveSkills(activeSkls, deletedSklIds, selectedOfficeId)
      ]);

      showAlert(MESSAGES.SAVE_SUCCESS, 'success');
    } catch (err) {
      console.error(err);
      showAlert(MESSAGES.SAVE_ERROR, 'error');
    }
  };

  const handleAddSkill = (parentId: string) => {
    return {
      id: `SKL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      category_id: parentId === 'UNCATEGORIZED' ? null : parentId,
      name: '',
      description: ''
    } as SkillItem;
  };

  const loading = loadingSkills || loadingCategories;

  if (loading && items.length === 0) return <div>Loading...</div>;

  return (
    <DataPage
      title={PAGE_NAMES.SKILL}
      data={items}
      columns={columns}
      emptyMessage={MESSAGES.EMPTY_SKILL}
      onBatchSave={handleBatchSave}
      subItemsKey="skills"
      onAddSubRow={handleAddSkill}
      canDeleteRow={() => false}
      hideHeader={true}
    />
  );
}
