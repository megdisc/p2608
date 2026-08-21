import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ProjectItem, ClientItem, SkillItem } from '../types';

export function useProjects() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [allCodes, setAllCodes] = useState<string[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [dbSkills, setDbSkills] = useState<SkillItem[]>([]);
  const [dbSkillLevels, setDbSkillLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsRes, skillsRes, skillLevelsRes, projectsRes, allProjectsCodesRes] = await Promise.all([
        supabase.from('partners').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('skills').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('skill_levels').select('*').order('created_at', { ascending: true }),
        supabase.from('projects').select(`
          id, code, name, project_type, settlement_year_month, created_at, client_id,
          project_tasks (
            id, name, is_deleted, assignee_type, created_at, status, completed_at, is_canceled,
            project_task_skills ( skill_id, skill_level_id, skills(name), skill_levels(level_value) )
          )
        `).eq('is_deleted', false).neq('id', '00000000-0000-0000-0000-000000000001'),
        supabase.from('projects').select('code').neq('id', '00000000-0000-0000-0000-000000000001')
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (skillsRes.error) throw skillsRes.error;
      if (skillLevelsRes.error) throw skillLevelsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setDbClients(clientsRes.data || []);
      setDbSkills(skillsRes.data || []);
      setDbSkillLevels(skillLevelsRes.data || []);
      setAllCodes((allProjectsCodesRes.data || []).map((p: any) => p.code).filter(Boolean));

      const formattedProjects: ProjectItem[] = (projectsRes.data || [])
        .filter((p: any) => p.project_type !== 'other' && p.project_type !== 'その他')
        .map((p: any) => ({
        id: p.id,
        code: p.code || '',
        name: p.name,
        projectType: p.project_type || 'one-off',
        settlementYearMonth: p.settlement_year_month || undefined,
        createdAt: p.created_at || undefined,
        projectTypeSortKey: p.project_type === 'ongoing' ? '0' : (p.project_type === 'その他' ? '2' : '1'),
        customerId: p.client_id || '',
        tasks: (p.project_tasks || [])
          .filter((pt: any) => !pt.is_deleted)
          .map((pt: any) => {
            return {
              id: pt.id,
              code: '',
              task: pt.name,
              assigneeType: pt.assignee_type || 'internal',
              status: pt.status || 'not_started',
              completedAt: pt.completed_at,
              isCanceled: pt.is_canceled || false,
              requiredSkills: (pt.project_task_skills || []).map((pts: any) => ({
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
                skillId: pts.skill_id,
                skill: pts.skills?.name,
                levelId: pts.skill_level_id,
                levelValue: pts.skill_levels?.level_value
              }))
            };
          })
      }));

      formattedProjects.sort((a, b) => {
        return (b.code || b.name || '').localeCompare(a.code || a.name || '');
      });

      setItems(formattedProjects);
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchSaveProjects = async (drafts: ProjectItem[], deletedIds: string[]) => {
    try {
      setLoading(true);

      if (deletedIds.length > 0) {
        const pIdsToDelete = deletedIds.filter(id => !id.includes('TASK'));
        const tIdsToDelete = deletedIds.filter(id => id.includes('TASK'));

        if (pIdsToDelete.length > 0) {
          await supabase.from('projects').update({ is_deleted: true }).in('id', pIdsToDelete);
          await supabase.from('project_tasks').update({ is_deleted: true }).in('project_id', pIdsToDelete);
        }
        if (tIdsToDelete.length > 0) {
          await supabase.from('project_tasks').update({ is_deleted: true }).in('id', tIdsToDelete);
        }
      }

      const activeProjects = drafts.filter(item => !deletedIds.includes(item.id));

      for (const p of activeProjects) {
        const projData: any = {
          id: p.id,
          code: p.code?.trim() || null,
          name: p.name,
          project_type: p.projectType || 'one-off',
          client_id: p.customerId || null,
        };
        if (p.settlementYearMonth !== undefined) {
          projData.settlement_year_month = p.settlementYearMonth || null;
        }

        const { error: pErr } = await supabase.from('projects').upsert(projData);
        if (pErr) {
          if (pErr.code === '23505' || pErr.message?.includes('duplicate key') || pErr.details?.includes('code')) {
            throw new Error(`案件ID「${p.code}」は既に使用されています（削除済み案件含む）。別のIDを指定してください。`);
          }
          throw pErr;
        }

        for (const t of p.tasks) {
          if (deletedIds.includes(t.id)) continue;

          const taskData = {
            id: t.id,
            project_id: p.id,
            name: t.task,
            assignee_type: t.assigneeType || 'internal'
          };

          const { error: tErr } = await supabase.from('project_tasks').upsert(taskData);
          if (tErr) throw tErr;

          await supabase.from('project_task_skills').delete().eq('task_id', t.id);
          if (t.requiredSkills?.length > 0) {
            const skillInserts = t.requiredSkills.map(s => ({
              task_id: t.id,
              skill_id: s.skillId,
              skill_level_id: s.levelId || null
            })).filter(s => s.skill_id);
            if (skillInserts.length > 0) {
              await supabase.from('project_task_skills').insert(skillInserts);
            }
          }
        }
      }

      await fetchProjects();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    allCodes,
    dbClients,
    dbSkills,
    dbSkillLevels,
    loading,
    fetchProjects,
    batchSaveProjects
  };
}
