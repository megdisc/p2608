
import { PAGE_NAMES, MENU_CATEGORIES, MENU_SUBCATEGORIES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

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

  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : '画面構成表';
  
  const isTableComposition = navContext.activeTab === 'tableComposition';

  const dbTables = [
    { physicalName: 'projects', logicalName: 'プロジェクト', description: 'プロジェクト基本情報' },
    { physicalName: 'project_tasks', logicalName: 'プロジェクトタスク', description: 'プロジェクト内の各タスク情報' },
    { physicalName: 'project_task_skills', logicalName: 'プロジェクトタスクスキル', description: 'タスクに必要なスキルとレベル' },
    { physicalName: 'project_task_assignees', logicalName: 'プロジェクトタスク担当者', description: 'タスクの割り当てメンバー' },
    { physicalName: 'project_budget_items', logicalName: 'プロジェクト予算項目', description: 'プロジェクトの予算（売上・原価・予備費）' },
    { physicalName: 'members', logicalName: 'メンバー', description: 'プロジェクトに参加するメンバー情報' },
    { physicalName: 'staffs', logicalName: 'スタッフ', description: 'システムを利用するスタッフ情報' },
    { physicalName: 'clients', logicalName: '顧客', description: '取引先・クライアント情報' },
    { physicalName: 'skills', logicalName: 'スキル', description: 'スキルのマスターデータ' },
    { physicalName: 'skill_levels', logicalName: 'スキルレベル', description: '各スキルのレベル定義' },
    { physicalName: 'member_skill_evaluations', logicalName: 'メンバースキル評価', description: 'メンバーの保有スキル評価' },
    { physicalName: 'base_wages', logicalName: '基本給', description: '基本給（標準単価）のマスターデータ' },
    { physicalName: 'daily_work_records', logicalName: '日次作業記録', description: 'メンバーの日々の作業実績（工数）' },
    { physicalName: 'monthly_task_progress', logicalName: '月次タスク進捗', description: '月ごとのタスク進捗状況（進捗率など）' },
    { physicalName: 'monthly_member_contributions', logicalName: '月次メンバー貢献度', description: '月ごとのメンバーの貢献度・報酬分配' },
    { physicalName: 'financial_records', logicalName: '財務記録', description: '確定した財務データ（売上・経費等）' },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={navContext.activeTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>

      <div className="table-container">
        {isTableComposition ? (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>物理名 (Table Name)</th>
                <th>論理名 (Logical Name)</th>
                <th>説明 (Description)</th>
              </tr>
            </thead>
            <tbody>
              {dbTables.map((table, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 'bold' }}>{table.physicalName}</td>
                  <td>{table.logicalName}</td>
                  <td>{table.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>画面</th>
                <th>タブ（設定系）</th>
                <th>タブ（記録系）</th>
                <th>タブ（集計系）</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const settingsTabs = row.existing.filter(item => getCategoryLabel(item) === SETTINGS_LABEL);
                const recordingTabs = row.existing.filter(item => getCategoryLabel(item) === RECORDING_LABEL);
                const aggregationTabs = row.existing.filter(item => getCategoryLabel(item) === AGGREGATION_LABEL);

                return (
                  <tr key={i}>
                    <td style={{ verticalAlign: 'top', fontWeight: 'bold', backgroundColor: 'var(--surface-color)' }}>
                      {row.screen}
                    </td>
                    <td style={{ verticalAlign: 'top', backgroundColor: getCategoryColor(SETTINGS_LABEL), color: '#333333' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {settingsTabs.map(item => <div key={item}>{item}</div>)}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'top', backgroundColor: getCategoryColor(RECORDING_LABEL), color: '#333333' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recordingTabs.map(item => <div key={item}>{item}</div>)}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'top', backgroundColor: getCategoryColor(AGGREGATION_LABEL), color: '#333333' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {aggregationTabs.map(item => <div key={item}>{item}</div>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
