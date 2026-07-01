import { useState, useCallback } from 'react';
import type { SkillEvaluationGridRow, SkillItem, SkillLevelItem, MemberItem } from '../types';
import { supabase } from '../lib/supabase';

export function useSkillEvaluations() {
  const [items, setItems] = useState<SkillEvaluationGridRow[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevelItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('is_deleted', false)
        .order('yomigana');
      if (skillsError) throw skillsError;
      setSkills(skillsData as SkillItem[]);

      // Fetch skill levels
      const { data: levelsData, error: levelsError } = await supabase
        .from('skill_levels')
        .select('*')
        .order('level_value');
      if (levelsError) throw levelsError;
      setSkillLevels((levelsData || []).map(l => ({
        id: l.id,
        levelValue: l.level_value,
        description: l.description
      })));

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('is_deleted', false)
        .eq('role', '利用者')
        .order('yomigana');
      if (membersError) throw membersError;

      // Fetch evaluations
      const { data: evalsData, error: evalsError } = await supabase
        .from('member_skill_evaluations')
        .select('*');
      if (evalsError) throw evalsError;

      // Build grid rows
      const gridRows: SkillEvaluationGridRow[] = membersData.map((member: MemberItem) => {
        const evaluations: Record<string, string> = {};
        
        // Populate evaluations for this member
        const memberEvals = evalsData.filter(e => e.member_id === member.id);
        const row: any = {
          id: member.id, // Row ID is Member ID
          memberName: member.name,
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
          }
        });
      });

      if (upserts.length > 0) {
        // Upsert requires conflict target, which is (member_id, skill_id)
        const { error: upsertError } = await supabase
          .from('member_skill_evaluations')
          .upsert(upserts, { onConflict: 'member_id,skill_id' });
        if (upsertError) throw upsertError;
      }

      await fetchData();
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  return { items, skills, skillLevels, loading, fetchData, batchSaveEvaluations };
}
