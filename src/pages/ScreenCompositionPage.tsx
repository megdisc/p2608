import React from 'react';
import { PAGE_NAMES, MENU_CATEGORIES, MENU_SUBCATEGORIES } from '../constants';

const AGGREGATION_LABEL = `${MENU_CATEGORIES.AGGREGATION}（${MENU_SUBCATEGORIES.AGGREGATION}）`;
const RECORDING_LABEL = `${MENU_CATEGORIES.RECORDING}（${MENU_SUBCATEGORIES.RECORDING}）`;
const SETTINGS_LABEL = `${MENU_CATEGORIES.SETTINGS}（${MENU_SUBCATEGORIES.SETTINGS}）`;

const getCategoryLabel = (pageName: string) => {
  const aggregations = [PAGE_NAMES.PROJECT_SUMMARY, PAGE_NAMES.ASSIGNEE_SUMMARY, PAGE_NAMES.WAGE_SUMMARY, PAGE_NAMES.FINANCIAL_SUMMARY];
  const recordings = [PAGE_NAMES.SKILL_EVALUATION, PAGE_NAMES.BASE_WAGE_ASSIGNMENT, PAGE_NAMES.PROJECT_INFO, PAGE_NAMES.BUDGET_PLANNING, PAGE_NAMES.ASSIGNEE_ALLOCATION, PAGE_NAMES.DAILY_WORK_RECORD, PAGE_NAMES.PROGRESS_RECORD, PAGE_NAMES.REWARD_ALLOCATION, PAGE_NAMES.FINANCIAL_RECORD];
  
  if (aggregations.includes(pageName)) return AGGREGATION_LABEL;
  if (recordings.includes(pageName)) return RECORDING_LABEL;
  return SETTINGS_LABEL;
};

const getCategoryColor = (label: string) => {
  if (label === AGGREGATION_LABEL) return '#fff9c4'; // Light yellow
  if (label === RECORDING_LABEL) return '#e3f2fd'; // Light blue
  if (label === SETTINGS_LABEL) return '#ffebee'; // Light red
  return 'transparent';
};

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
              <th>画面</th>
              <th>区分</th>
              <th>タブ（既存の画面名称）</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <React.Fragment key={i}>
                {row.existing.map((item, idx) => {
                  const label = getCategoryLabel(item);
                  return (
                    <tr key={`${i}-${idx}`}>
                      {idx === 0 && (
                        <td rowSpan={row.existing.length} style={{ verticalAlign: 'top', fontWeight: 'bold', backgroundColor: 'var(--surface-color)' }}>
                          {row.screen}
                        </td>
                      )}
                      <td style={{ backgroundColor: getCategoryColor(label), color: '#333333' }}>{label}</td>
                      <td>{item}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
