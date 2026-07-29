
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
        PAGE_NAMES.ASSIGNEE_SUMMARY,
      ],
    },
    {
      screen: PAGE_NAMES.SCREEN_USER,
      existing: [
        PAGE_NAMES.PROJECT_USER,
        PAGE_NAMES.SKILL_EVALUATION,
        PAGE_NAMES.BASE_WAGE_ASSIGNMENT,
        PAGE_NAMES.DAILY_WORK_RECORD,
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
    { 
      physicalName: 'projects', 
      tableType: 'トランザクション',
      logicalName: 'プロジェクト', 
      description: 'プロジェクト基本情報',
      columns: [
        { name: 'id', desc: 'プロジェクトID' },
        { name: 'name', desc: 'プロジェクト名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'client_id', desc: '紐づく顧客ID' },
        { name: 'start_date', desc: '開始日' },
        { name: 'end_date', desc: '終了予定日・終了日' },
        { name: 'project_type', desc: 'プロジェクト種別' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'project_tasks', 
      tableType: 'トランザクション',
      logicalName: 'プロジェクトタスク', 
      description: 'プロジェクト内の各タスク情報',
      columns: [
        { name: 'id', desc: 'タスクID' },
        { name: 'project_id', desc: 'プロジェクトID' },
        { name: 'name', desc: 'タスク名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'is_canceled', desc: 'キャンセルフラグ' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'project_task_skills', 
      tableType: 'トランザクション',
      logicalName: 'プロジェクトタスクスキル', 
      description: 'タスクに必要なスキルとレベル',
      columns: [
        { name: 'task_id', desc: 'タスクID' },
        { name: 'skill_id', desc: '要求スキルID' },
        { name: 'skill_level_id', desc: '要求スキルレベルID' }
      ]
    },
    { 
      physicalName: 'project_task_assignees', 
      tableType: 'トランザクション',
      logicalName: 'プロジェクトタスク担当者', 
      description: 'タスクの割り当てメンバー',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'client_id', desc: '顧客ID' },
        { name: 'staff_id', desc: 'スタッフID' }
      ]
    },
    { 
      physicalName: 'project_budget_items', 
      tableType: 'トランザクション',
      logicalName: 'プロジェクト予算項目', 
      description: 'プロジェクトの予算（売上・原価・予備費）',
      columns: [
        { name: 'id', desc: '予算項目ID' },
        { name: 'project_id', desc: 'プロジェクトID' },
        { name: 'category', desc: '予算カテゴリ（売上/経費/予備費）' },
        { name: 'subject', desc: '科目・内容' },
        { name: 'task_id', desc: '関連タスクID' },
        { name: 'amount', desc: '金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'members', 
      tableType: 'マスタ',
      logicalName: 'メンバー', 
      description: 'プロジェクトに参加するメンバー情報',
      columns: [
        { name: 'id', desc: '利用者ID' },
        { name: 'name', desc: '利用者名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'role', desc: '権限ロール' },
        { name: 'email', desc: 'メールアドレス' },
        { name: 'base_wage_id', desc: '基本給ID' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'staffs', 
      tableType: 'マスタ',
      logicalName: 'スタッフ', 
      description: 'システムを利用するスタッフ情報',
      columns: [
        { name: 'id', desc: 'スタッフID' },
        { name: 'name', desc: 'スタッフ名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'role', desc: '権限ロール' },
        { name: 'email', desc: 'メールアドレス' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'clients', 
      tableType: 'マスタ',
      logicalName: '顧客', 
      description: '取引先・クライアント情報',
      columns: [
        { name: 'id', desc: '顧客ID' },
        { name: 'name', desc: '顧客・企業名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'contact_person', desc: '担当者名' },
        { name: 'phone', desc: '電話番号' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'skills', 
      tableType: 'マスタ',
      logicalName: 'スキル', 
      description: 'スキルのマスターデータ',
      columns: [
        { name: 'id', desc: 'スキルID' },
        { name: 'name', desc: 'スキル名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'description', desc: 'スキルの説明' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'skill_levels', 
      tableType: 'マスタ',
      logicalName: 'スキルレベル', 
      description: '各スキルのレベル定義',
      columns: [
        { name: 'id', desc: 'スキルレベルID' },
        { name: 'level_value', desc: 'レベル数値' },
        { name: 'description', desc: 'レベルの説明' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'member_skill_evaluations', 
      tableType: 'トランザクション',
      logicalName: 'メンバースキル評価', 
      description: 'メンバーの保有スキル評価',
      columns: [
        { name: 'id', desc: '評価ID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'skill_id', desc: 'スキルID' },
        { name: 'skill_level_id', desc: 'スキルレベルID' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'base_wages', 
      tableType: 'マスタ',
      logicalName: '基本給', 
      description: '基本給（標準単価）のマスターデータ',
      columns: [
        { name: 'id', desc: '基本給ID' },
        { name: 'wage', desc: '基本給額' },
        { name: 'description', desc: '説明・摘要' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'daily_work_records', 
      tableType: 'トランザクション',
      logicalName: '日次作業記録', 
      description: 'メンバーの日々の作業実績（工数）',
      columns: [
        { name: 'id', desc: '記録ID' },
        { name: 'date', desc: '作業日' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'work_time', desc: '作業時間' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'monthly_task_progress', 
      tableType: 'トランザクション',
      logicalName: '月次タスク進捗', 
      description: '月ごとのタスク進捗状況（進捗率など）',
      columns: [
        { name: 'id', desc: '進捗記録ID' },
        { name: 'year_month', desc: '対象年月' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'current_progress', desc: '現在の進捗率(%)' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'monthly_member_contributions', 
      tableType: 'トランザクション',
      logicalName: '月次メンバー貢献度', 
      description: '月ごとのメンバーの貢献度・報酬分配',
      columns: [
        { name: 'id', desc: '貢献度記録ID' },
        { name: 'year_month', desc: '対象年月' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'contribution_ratio', desc: '貢献度・分配率(%)' },
        { name: 'staff_id', desc: 'スタッフID' },
        { name: 'client_id', desc: '顧客ID' },
        { name: 'deduction_amount', desc: '控除額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'financial_records', 
      tableType: 'トランザクション',
      logicalName: '財務記録', 
      description: '確定した財務データ（売上・経費等）',
      columns: [
        { name: 'id', desc: '財務記録ID' },
        { name: 'period', desc: '対象期間（年月）' },
        { name: 'project_id', desc: 'プロジェクトID' },
        { name: 'type', desc: '収支タイプ（収入/支出）' },
        { name: 'subject', desc: '科目・内容' },
        { name: 'amount', desc: '金額' },
        { name: 'recorded_date', desc: '計上日' },
        { name: 'recorded_by', desc: '記録者ID' },
        { name: 'is_limited', desc: '限定公開フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
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
                <th>区分 (Type)</th>
                <th>物理名 (Table Name)</th>
                <th>論理名 (Logical Name)</th>
                <th>説明 (Description)</th>
                <th>カラム名 (Column Name)</th>
                <th>カラム説明 (Column Description)</th>
              </tr>
            </thead>
            <tbody>
              {dbTables.flatMap((table, i) =>
                table.columns.map((col, idx) => (
                  <tr key={`${i}-${idx}`}>
                    {idx === 0 && (
                      <>
                        <td rowSpan={table.columns.length} style={{ verticalAlign: 'top' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.85em',
                            backgroundColor: table.tableType === 'マスタ' ? '#e3f2fd' : '#fff9c4',
                            color: '#333'
                          }}>
                            {table.tableType}
                          </span>
                        </td>
                        <td rowSpan={table.columns.length} style={{ fontWeight: 'bold', verticalAlign: 'top' }}>{table.physicalName}</td>
                        <td rowSpan={table.columns.length} style={{ verticalAlign: 'top' }}>{table.logicalName}</td>
                        <td rowSpan={table.columns.length} style={{ verticalAlign: 'top' }}>{table.description}</td>
                      </>
                    )}
                    <td style={{ verticalAlign: 'top', color: '#333' }}>{col.name}</td>
                    <td style={{ verticalAlign: 'top', color: '#666' }}>{col.desc}</td>
                  </tr>
                ))
              )}
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
