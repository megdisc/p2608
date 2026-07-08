import { PAGE_NAMES } from '../constants';

export function ScreenCompositionPage() {
  const rows = [
    {
      screen: PAGE_NAMES.SCREEN_FINANCE,
      existing: [PAGE_NAMES.FINANCIAL_RECORD, PAGE_NAMES.FINANCIAL_SUMMARY],
    },
    {
      screen: PAGE_NAMES.SCREEN_PROJECT,
      existing: [
        PAGE_NAMES.PROJECT_INFO,
        PAGE_NAMES.BUDGET_PLANNING,
        PAGE_NAMES.ASSIGNEE_ALLOCATION,
        PAGE_NAMES.PROGRESS_RECORD,
        PAGE_NAMES.REWARD_ALLOCATION,
        PAGE_NAMES.PROJECT_SUMMARY,
      ],
    },
    {
      screen: PAGE_NAMES.SCREEN_USER,
      existing: [
        PAGE_NAMES.PROJECT_USER,
        PAGE_NAMES.SKILL_EVALUATION,
        PAGE_NAMES.BASE_WAGE_ASSIGNMENT,
        PAGE_NAMES.DAILY_WORK_RECORD,
        PAGE_NAMES.ASSIGNEE_SUMMARY,
        PAGE_NAMES.WAGE_SUMMARY,
      ],
    },
    {
      screen: PAGE_NAMES.SCREEN_STAFF,
      existing: [PAGE_NAMES.STAFF],
    },
    {
      screen: PAGE_NAMES.SCREEN_CLIENT,
      existing: [PAGE_NAMES.CLIENT],
    },
    {
      screen: PAGE_NAMES.SCREEN_SKILL,
      existing: [PAGE_NAMES.SKILL, PAGE_NAMES.SKILL_LEVEL],
    },
    {
      screen: PAGE_NAMES.SCREEN_WAGE,
      existing: [PAGE_NAMES.BASE_WAGE],
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>画面構成表</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th style={{ width: '200px' }}>画面</th>
              <th>既存の画面名称</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ verticalAlign: 'top', fontWeight: 'bold' }}>{row.screen}</td>
                <td style={{ verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {row.existing.map((item, idx) => (
                      <div key={idx}>{item}</div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
