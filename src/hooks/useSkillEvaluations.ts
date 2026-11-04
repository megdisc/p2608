import { useState, useCallback, useRef } from 'react';
import type { SkillItem, SkillLevelItem, MemberItem, MemberWithSkillSettings, MemberSkillSettingRow } from '../types';
import { supabase } from '../lib/supabase';

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
};

export function useSkillEvaluations() {
  const [items, setItems] = useState<MemberWithSkillSettings[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevelItem[]>([]);
  const [allSkillLevels, setAllSkillLevels] = useState<SkillLevelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const currentOfficeIdRef = useRef<string | undefined>(undefined);

  const fetchData = useCallback(async (officeId?: string) => {
    currentOfficeIdRef.current = officeId;
    setLoading(true);
    try {
      // 1. スキルカテゴリ取得
      let catQuery = supabase
        .from('skill_categories')
        .select('*')
        .eq('is_deleted', false);
      if (officeId) {
        catQuery = catQuery.or(`office_id.eq.${officeId},office_id.is.null`);
      }
      const { data: categoriesData, error: categoriesError } = await catQuery
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (categoriesError) throw categoriesError;

      const categoriesList = categoriesData || [];
      const categoryMap = new Map<string, { id: string; name: string; sort_order: number }>();
      categoriesList.forEach(c => {
        categoryMap.set(c.id, { id: c.id, name: c.name, sort_order: c.sort_order ?? 0 });
      });

      // 2. スキル項目取得
      let skillQuery = supabase
        .from('skill_items')
        .select('*')
        .eq('is_deleted', false);
      if (officeId) {
        skillQuery = skillQuery.or(`office_id.eq.${officeId},office_id.is.null`);
      }
      const { data: skillsData, error: skillsError } = await skillQuery
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (skillsError) throw skillsError;

      const rawSkills = (skillsData || []) as any[];
      const sortedSkills: SkillItem[] = [];

      categoriesList.forEach(cat => {
        const catSkills = rawSkills
          .filter(s => s.category_id === cat.id)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        catSkills.forEach(s => {
          sortedSkills.push({
            id: s.id,
            office_id: s.office_id,
            category_id: cat.id,
            categoryName: cat.name,
            name: s.name,
            description: s.description || '',
            sort_order: s.sort_order ?? 0,
          });
        });
      });

      const uncategorized = rawSkills
        .filter(s => !s.category_id || !categoryMap.has(s.category_id))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      uncategorized.forEach(s => {
        sortedSkills.push({
          id: s.id,
          office_id: s.office_id,
          category_id: s.category_id || null,
          categoryName: '未分類',
          name: s.name,
          description: s.description || '',
          sort_order: s.sort_order ?? 0,
        });
      });

      setSkills(sortedSkills);

      // 3. スキルレベル取得
      let levelQuery = supabase
        .from('skill_level_items')
        .select('*')
        .eq('is_deleted', false);
      if (officeId) {
        levelQuery = levelQuery.or(`office_id.eq.${officeId},office_id.is.null`);
      }
      const { data: levelsData, error: levelsError } = await levelQuery.order('level_value');
      if (levelsError) throw levelsError;

      const formattedLevels: SkillLevelItem[] = (levelsData || []).map(l => ({
        id: l.id,
        office_id: l.office_id,
        levelValue: l.level_value,
        description: l.description,
      }));
      setSkillLevels(formattedLevels);

      // 全スキルレベル（表示用）
      const { data: allLevelsData, error: allLevelsError } = await supabase
        .from('skill_level_items')
        .select('*')
        .eq('is_deleted', false);
      if (!allLevelsError && allLevelsData) {
        setAllSkillLevels(
          allLevelsData.map(l => ({
            id: l.id,
            office_id: l.office_id,
            levelValue: l.level_value,
            description: l.description,
          }))
        );
      } else {
        setAllSkillLevels(formattedLevels);
      }

      // 4. 利用者取得（事業所フィルタ）
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('is_deleted', false)
        .order('yomigana');
      if (membersError) throw membersError;

      let memberIdsForOffice: Set<string> | null = null;
      if (officeId) {
        memberIdsForOffice = new Set<string>();
        const [settingsRes, certRes] = await Promise.all([
          supabase.from('office_member_settings').select('member_id').eq('office_id', officeId),
          supabase
            .from('member_recipient_certificates')
            .select('member_id')
            .eq('copayment_office_id', officeId)
            .or('is_deleted.eq.false,is_deleted.is.null'),
        ]);
        (settingsRes.data || []).forEach(s => memberIdsForOffice!.add(s.member_id));
        (certRes.data || []).forEach(c => memberIdsForOffice!.add(c.member_id));
      }

      const targetMembers = (membersData || []).filter((member: MemberItem) => {
        if (!memberIdsForOffice) return true;
        return memberIdsForOffice.has(member.id);
      });

      // 5. 概要・詳細の取得
      let summaries: any[] = [];
      let details: any[] = [];

      const { data: sumData, error: sumError } = await supabase
        .from('member_skill_setting_summaries')
        .select('*')
        .order('valid_from', { ascending: false });

      if (!sumError && sumData) {
        summaries = sumData;
        const { data: detData } = await supabase.from('member_skill_setting_details').select('*');
        details = detData || [];
      } else {
        // 旧 member_skill_settings からのフォールバック
        const { data: oldEvals } = await supabase.from('member_skill_settings').select('*');
        const memberIds = Array.from(new Set((oldEvals || []).map((e: any) => e.member_id)));
        summaries = memberIds.map(mId => ({
          id: `legacy-${mId}`,
          member_id: mId,
          valid_from: '2025-04-01',
          valid_to: null,
        }));
        details = (oldEvals || []).map((e: any) => ({
          id: e.id,
          summary_id: `legacy-${e.member_id}`,
          skill_id: e.skill_id,
          skill_level_id: e.skill_level_id,
        }));
      }

      // summary_id -> (skill_id -> skill_level_id) のマップを作成
      const detailsMap = new Map<string, Record<string, string>>();
      details.forEach((d: any) => {
        if (!detailsMap.has(d.summary_id)) {
          detailsMap.set(d.summary_id, {});
        }
        if (d.skill_id && d.skill_level_id) {
          detailsMap.get(d.summary_id)![d.skill_id] = d.skill_level_id;
        }
      });

      // 6. targetMembers ごとに階層データを構築
      const rows: MemberWithSkillSettings[] = targetMembers.map((member: MemberItem) => {
        const memberSummaries = summaries.filter((s: any) => s.member_id === member.id);

        let settings: MemberSkillSettingRow[] = memberSummaries.map((s: any) => {
          const evals = detailsMap.get(s.id) || {};
          return {
            id: s.id,
            member_id: member.id,
            valid_from: s.valid_from,
            valid_to: s.valid_to || null,
            evaluations: { ...evals },
            ...evals, // 動的カラム用フラットプロパティ
          };
        });

        if (settings.length === 0) {
          settings = [
            {
              id: `NEW-${generateId()}`,
              member_id: member.id,
              valid_from: '2025-04-01',
              valid_to: null,
              evaluations: {},
            },
          ];
        }

        return {
          id: member.id,
          code: member.code || '',
          name: member.name,
          yomigana: member.yomigana || '',
          settings,
        };
      });

      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveEvaluations = useCallback(
    async (drafts: MemberWithSkillSettings[], deletedIds?: string[]) => {
      setLoading(true);
      try {
        // 1. 削除処理
        if (deletedIds && deletedIds.length > 0) {
          const realDeletedIds = deletedIds.filter(id => !id.startsWith('NEW-') && id.includes('-'));
          if (realDeletedIds.length > 0) {
            await supabase.from('member_skill_setting_summaries').delete().in('id', realDeletedIds);
          }
        }

        // 2. 各利用者の履歴行を保存
        for (const draft of drafts) {
          const memberId = draft.id;
          const settings = draft.settings || [];

          for (const setting of settings) {
            if (deletedIds && deletedIds.includes(setting.id)) continue;

            const isNew = setting.id.startsWith('NEW-');
            const summaryId = isNew ? generateId() : setting.id;

            // 2a. 概要テーブルのUpsert
            const { error: sumErr } = await supabase.from('member_skill_setting_summaries').upsert({
              id: summaryId,
              member_id: memberId,
              valid_from: setting.valid_from,
              valid_to: setting.valid_to || null,
            });
            if (sumErr) throw sumErr;

            // 2b. 詳細テーブルの同期
            await supabase.from('member_skill_setting_details').delete().eq('summary_id', summaryId);

            const detailRows: any[] = [];
            const evals = setting.evaluations || {};
            // フラットプロパティ側も拾う
            Object.entries(setting).forEach(([key, val]) => {
              if (
                key !== 'id' &&
                key !== 'member_id' &&
                key !== 'valid_from' &&
                key !== 'valid_to' &&
                key !== 'evaluations' &&
                typeof val === 'string' &&
                val
              ) {
                evals[key] = val;
              }
            });

            Object.entries(evals).forEach(([skillId, levelId]) => {
              if (levelId) {
                detailRows.push({
                  id: generateId(),
                  summary_id: summaryId,
                  skill_id: skillId,
                  skill_level_id: levelId,
                });
              }
            });

            if (detailRows.length > 0) {
              const { error: detErr } = await supabase
                .from('member_skill_setting_details')
                .insert(detailRows);
              if (detErr) throw detErr;
            }
          }
        }

        await fetchData(currentOfficeIdRef.current);
      } finally {
        setLoading(false);
      }
    },
    [fetchData]
  );

  return { items, skills, skillLevels, allSkillLevels, loading, fetchData, batchSaveEvaluations };
}
