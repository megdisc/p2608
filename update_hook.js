const fs = require('fs');
const content = fs.readFileSync('src/hooks/useWageSummary.ts', 'utf8');

const updated = content.replace(
  /export type WageRow = \{[\s\S]*?\};/,
  `export type WageRow = {
  id: string;
  name: string;
  wageRate: number | null;
  workTime: number;
  basicWage: number | null;
  taskIncentives: { projectName: string; taskName: string; amount: number }[];
  incentiveTotal: number;
  wageTotal: number;
  dedA: number | null;
  dedB: number | null;
  dedTotal: number;
  payment: number;
};`
).replace(
  /const members = membersRes\.data \|\| \[\];[\s\S]*?setData\(rows\);/,
  `const members = membersRes.data || [];
      const projects = projectsRes.data || [];
      const budgets = budgetsRes.data || [];
      const cTasks = cTaskRes.data || [];
      const cMems = cMemRes.data || [];

      const rows: WageRow[] = members.map((member: any) => {
        const memberWorks = workRes.data?.filter((w: any) => w.member_id === member.id) || [];
        const totalWorkTime = memberWorks.reduce((sum: number, w: any) => sum + Number(w.work_time), 0);
        
        let basicWage = null;
        let wageRate = null;
        if (member.base_wages && typeof member.base_wages.wage === 'number') {
          wageRate = member.base_wages.wage;
          basicWage = Math.floor(wageRate * totalWorkTime);
        }

        let sumRewardUnitPrice = 0;
        const memberContribs = cMems.filter((r: any) => r.member_id === member.id);
        const taskIncentives: { projectName: string; taskName: string; amount: number }[] = [];

        for (const contrib of memberContribs) {
          if (!contrib.task_id || !contrib.contribution_ratio) continue;

          const project = projects.find((p: any) => (p.project_tasks || []).some((t: any) => t.id === contrib.task_id));
          if (!project) continue;

          const projectTasks = project.project_tasks || [];
          const activeTasks = projectTasks.filter((t: any) => !t.is_deleted && !t.is_canceled);
          
          if (activeTasks.length === 0) continue;
          
          const allCompleted = activeTasks.every((t: any) => {
            const cTask = cTasks.find((r: any) => r.task_id === t.id);
            const prog = cTask ? Number(cTask.current_progress) : 0;
            return prog === 100;
          });

          if (!allCompleted) continue;

          const taskBudgets = budgets.filter((b: any) => b.task_id === contrib.task_id);
          const taskLaborBudget = taskBudgets.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

          const allTaskContribs = cMems.filter((r: any) => r.task_id === contrib.task_id);
          const totalRatio = allTaskContribs.reduce((sum: number, r: any) => sum + (Number(r.contribution_ratio) || 0), 0);
          
          let alloc = 0;
          if (totalRatio > 0) {
            const ratio = Number(contrib.contribution_ratio) || 0;
            alloc = Math.floor(taskLaborBudget * (ratio / totalRatio));
          }

          const ded = Number(contrib.deduction_amount) || 0;
          const unitPrice = alloc - ded;

          sumRewardUnitPrice += unitPrice;
          
          const task = activeTasks.find((t: any) => t.id === contrib.task_id);
          taskIncentives.push({
            projectName: project.name || '',
            taskName: task ? task.name : '',
            amount: unitPrice
          });
        }

        const calculatedIncentive = sumRewardUnitPrice - (basicWage || 0);
        const safeIncentive = Math.floor(Math.max(0, calculatedIncentive));

        const dedA = null;
        const dedB = null;

        const wageTotal = (basicWage || 0) + safeIncentive;
        const dedTotal = 0;
        const payment = wageTotal - dedTotal;

        return {
          id: member.id,
          name: member.name,
          wageRate,
          workTime: totalWorkTime,
          basicWage,
          taskIncentives,
          incentiveTotal: safeIncentive,
          wageTotal,
          dedA,
          dedB,
          dedTotal,
          payment
        };
      });

      setData(rows);`
);

fs.writeFileSync('src/hooks/useWageSummary.ts', updated);
