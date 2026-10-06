import { useState, useCallback, useRef } from 'react';
import type { SkillEvaluationGridRow, SkillItem, SkillLevelItem, MemberItem } from '../types';
import { supabase } from '../lib/supabase';

export function useSkillEvaluations() {
  const [items, setItems] = useState<SkillEvaluationGridRow[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevelItem[]>([]);
  const [allSkillLevels, setAllSkillLevels] = useState<SkillLevelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const currentOfficeIdRef = useRef<string | undefined>(undefined);

  const fetchData = useCallback(async (officeId?: string) => {
    currentOfficeIdRef.current = officeId;
    setLoading(true);
    try {
      // Fetch skill categories
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

      // Fetch skills
      let skillQuery = supabase
        .from('skills')
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
            sort_order: s.sort_order ?? 0
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
          sort_order: s.sort_order ?? 0
        });
      });

      setSkills(sortedSkills);

      // Fetch skill levels filtered by office
      let levelQuery = supabase
        .from('skill_levels')
        .select('*')
        .eq('is_deleted', false);
      if (officeId) {
        levelQuery = levelQuery.or(`office_id.eq.${officeId},office_id.is.null`);
      }
      const { data: levelsData, error: levelsError } = await levelQuery
        .order('level_value');
      if (levelsError) throw levelsError;

      const formattedLevels: SkillLevelItem[] = (levelsData || []).map(l => ({
        id: l.id,
        office_id: l.office_id,
        levelValue: l.level_value,
        description: l.description
      }));
      setSkillLevels(formattedLevels);

      // Fetch all non-deleted skill levels for evaluation display lookup
      const { data: allLevelsData, error: allLevelsError } = await supabase
        .from('skill_levels')
        .select('*')
        .eq('is_deleted', false);
      if (!allLevelsError && allLevelsData) {
        setAllSkillLevels(allLevelsData.map(l => ({
          id: l.id,
          office_id: l.office_id,
          levelValue: l.level_value,
          description: l.description
        })));
      } else {
        setAllSkillLevels(formattedLevels);
      }

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('is_deleted', false)
        .order('yomigana');
      if (membersError) throw membersError;

      // Filter members for target office
      let memberIdsForOffice: Set<string> | null = null;
      if (officeId) {
        memberIdsForOffice = new Set<string>();
        const [settingsRes, certRes] = await Promise.all([
          supabase.from('office_member_settings').select('member_id').eq('office_id', officeId),
          supabase.from('member_recipient_certificates').select('member_id').eq('copayment_office_id', officeId).or('is_deleted.eq.false,is_deleted.is.null')
        ]);
        (settingsRes.data || []).forEach(s => memberIdsForOffice!.add(s.member_id));
        (certRes.data || []).forEach(c => memberIdsForOffice!.add(c.member_id));
      }

      const targetMembers = (membersData || []).filter((member: MemberItem) => {
        if (!memberIdsForOffice) return true;
        return memberIdsForOffice.has(member.id);
      });

      // Fetch evaluations
      const { data: evalsData, error: evalsError } = await supabase
        .from('member_skill_evaluations')
        .select('*');
      if (evalsError) throw evalsError;

      // Build grid rows
      const gridRows: SkillEvaluationGridRow[] = targetMembers.map((member: MemberItem) => {
        const evaluations: Record<string, string> = {};
        
        // Populate evaluations for this member
        const memberEvals = evalsData.filter(e => e.member_id === member.id);
        const row: any = {
          id: member.id, // Row ID is Member ID
          memberCode: member.code || '',
          memberName: member.name,
          memberYomigana: member.yomigana || '',
          evaluations
        };
        
        memberEvals.forEach(e => {
          if (e.skill_level_id) {
            evaluations[e.skill_id] = e.skill_level_id;
            row[e.skill_id] = e.skill_level_id; // Flatten for DataTable access
          }
        });

        return row;
      });

      setItems(gridRows);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveEvaluations = useCallback(async (drafts: SkillEvaluationGridRow[]) => {
    setLoading(true);
    try {
      const upserts: any[] = [];
      const deletes: { member_id: string; skill_id: string }[] = [];
      
      drafts.forEach(draft => {
        const memberId = draft.id;
        
        // For each skill in the evaluations map
        Object.entries(draft.evaluations).forEach(([skillId, skillLevelId]) => {
          if (skillLevelId) {
            upserts.push({
              member_id: memberId,
              skill_id: skillId,
              skill_level_id: skillLevelId,
              updated_at: new Date().toISOString()
            });
          } else {
            deletes.push({ member_id: memberId, skill_id: skillId });
          }
        });
      });

      if (upserts.length > 0) {
        // Upsert requires conflict target, which is (member_id, skill_id)
        const { error: upsertError } = await supabase
          .from('member_skill_settings')
          .upsert(upserts, { onConflict: 'member_id,skill_id' });
        if (upsertError) throw upsertError;
      }

      for (const del of deletes) {
        await supabase
          .from('member_skill_settings')
          .delete()
          .match({ member_id: del.member_id, skill_id: del.skill_id });
      }

      await fetchData(currentOfficeIdRef.current);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  return { items, skills, skillLevels, allSkillLevels, loading, fetchData, batchSaveEvaluations };
}
