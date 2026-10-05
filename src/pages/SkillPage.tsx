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
    const list: CategoryWithSkills[] = categories.map(cat => {
      const catSkills = skills.filter(s => s.category_id === cat.id);
      return {
        ...cat,
        skills: catSkills
      };
    });

    // カテゴリ未分類のスキル群
    const uncategorizedSkills = skills.filter(s => !s.category_id || !categories.some(c => c.id === s.category_id));
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
            description: cat.description || ''
          });
        }

        const catId = cat.isUncategorized ? null : cat.id;

        (cat.skills || []).forEach(skl => {
          if (!deletedIds.includes(skl.id)) {
            activeSkls.push({
              id: skl.id,
              office_id: skl.office_id,
              category_id: catId,
              name: skl.name,
              description: skl.description || ''
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
