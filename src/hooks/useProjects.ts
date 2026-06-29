import { useState, useCallback } from 'react';
import { supabase } from '../lib';
import type { ProjectItem, ClientItem, SkillItem } from '../types';

export function useProjects() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [dbClients, setDbClients] = useState<ClientItem[]>([]);
  const [dbSkills, setDbSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsRes, skillsRes, projectsRes] = await Promise.all([
        supabase.from('clients').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('skills').select('*').eq('is_deleted', false).order('yomigana', { ascending: true }),
        supabase.from('projects').select(`
          id, name, yomigana, project_type, client_id, start_date, end_date,
          project_tasks (
            id, name, yomigana, is_deleted,
            project_task_skills ( skill_id, skills(name) )
          )
        `).eq('is_deleted', false).neq('id', '00000000-0000-0000-0000-000000000001')
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (skillsRes.error) throw skillsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setDbClients(clientsRes.data || []);
      setDbSkills(skillsRes.data || []);

      const formattedProjects: ProjectItem[] = (projectsRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        yomigana: p.yomigana || '',
        projectType: p.project_type || 'one-off',
        projectTypeSortKey: (p.project_type || 'one-off') === 'ongoing' ? '0' : '1',
        customerId: p.client_id || '',
        startDate: p.start_date,
        endDate: p.end_date || '',
        tasks: (p.project_tasks || [])
          .filter((pt: any) => !pt.is_deleted)
          .sort((a: any, b: any) => (a.yomigana || '').localeCompare(b.yomigana || ''))
          .map((pt: any) => {
            return {
              id: pt.id,
              task: pt.name,
              taskYomigana: pt.yomigana || '',
              requiredSkills: (pt.project_task_skills || []).map((pts: any) => ({
                id: pts.skill_id,
                skill: pts.skills?.name
              }))
            };
          })
      }));

      formattedProjects.sort((a, b) => {
        const keyA = a.projectTypeSortKey || '';
        const keyB = b.projectTypeSortKey || '';
        if (keyA !== keyB) {
          return keyA.localeCompare(keyB);
        }
        return (a.yomigana || '').localeCompare(b.yomigana || '');
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
        }
        if (tIdsToDelete.length > 0) {
          await supabase.from('project_tasks').update({ is_deleted: true }).in('id', tIdsToDelete);
        }
      }

      const activeProjects = drafts.filter(item => !deletedIds.includes(item.id));

      for (const p of activeProjects) {
        const projData = {
          id: p.id,
          name: p.name,
          yomigana: p.yomigana,
          project_type: p.projectType || 'one-off',
          client_id: p.customerId || null,
          start_date: p.startDate,
          end_date: p.endDate || null
        };

        const { error: pErr } = await supabase.from('projects').upsert(projData);
        if (pErr) throw pErr;

        for (const t of p.tasks) {
          if (deletedIds.includes(t.id)) continue;

          const taskData = {
            id: t.id,
            project_id: p.id,
            name: t.task,
            yomigana: t.taskYomigana
          };

          const { error: tErr } = await supabase.from('project_tasks').upsert(taskData);
          if (tErr) throw tErr;

          await supabase.from('project_task_skills').delete().eq('task_id', t.id);
          if (t.requiredSkills?.length > 0) {
            const skillInserts = t.requiredSkills.map(s => ({
              task_id: t.id,
              skill_id: s.id
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
    dbClients,
    dbSkills,
    loading,
    fetchProjects,
    batchSaveProjects
  };
}
