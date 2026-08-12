
import { PAGE_NAMES, MENU_CATEGORIES, MENU_SUBCATEGORIES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { MainFeaturesPage } from './MainFeaturesPage';

const AGGREGATION_LABEL = `${MENU_CATEGORIES.AGGREGATION}（${MENU_SUBCATEGORIES.AGGREGATION}）`;
const RECORDING_LABEL = `${MENU_CATEGORIES.RECORDING}（${MENU_SUBCATEGORIES.RECORDING}）`;
const SETTINGS_LABEL = `${MENU_CATEGORIES.SETTINGS}（${MENU_SUBCATEGORIES.SETTINGS}）`;

const getCategoryLabel = (pageName: string) => {
  const aggregations = [PAGE_NAMES.ASSIGNEE_SUMMARY, PAGE_NAMES.WAGE_SUMMARY, PAGE_NAMES.FINANCIAL_SUMMARY];
  const recordings = [PAGE_NAMES.SKILL_EVALUATION, PAGE_NAMES.BASE_WAGE_ASSIGNMENT, PAGE_NAMES.PROJECT_INFO, PAGE_NAMES.BUDGET_PLANNING, PAGE_NAMES.ASSIGNEE_ALLOCATION, PAGE_NAMES.DAILY_WORK_RECORD, PAGE_NAMES.PROGRESS_RECORD, PAGE_NAMES.REWARD_ALLOCATION, PAGE_NAMES.FINANCIAL_RECORD];
  
  if (aggregations.includes(pageName)) return AGGREGATION_LABEL;
  if (recordings.includes(pageName)) return RECORDING_LABEL;
  return SETTINGS_LABEL;
};

const getCategoryColor = (label: string) => {
  if (label === AGGREGATION_LABEL) return 'var(--palette-yellow-300)';
  if (label === RECORDING_LABEL) return 'var(--palette-bluegreen-300)';
  if (label === SETTINGS_LABEL) return 'var(--palette-red-300)';
  return 'transparent';
};

const getFrequencyColor = (freq: string) => {
  if (freq === '毎日') return 'var(--palette-bluegreen-300)';
  if (freq === '毎月') return 'var(--palette-yellow-300)';
  if (freq === '随時') return 'var(--palette-red-300)';
  return 'transparent';
};

export function ScreenCompositionPage() {
  const rows = [
    {
      screen: PAGE_NAMES.SCREEN_FINANCE,
      existing: [PAGE_NAMES.FINANCIAL_RECORD, PAGE_NAMES.FINANCIAL_SUMMARY, PAGE_NAMES.WAGE_SUMMARY],
    },
    {
      screen: PAGE_NAMES.SCREEN_PROJECT,
      existing: [
        PAGE_NAMES.PROJECT_INFO,
        PAGE_NAMES.BUDGET_PLANNING,
        PAGE_NAMES.ASSIGNEE_ALLOCATION,
        PAGE_NAMES.PROGRESS_RECORD,
        PAGE_NAMES.REWARD_ALLOCATION,
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
  const isMainFeatures = navContext.activeTab === 'mainFeatures';
  const isWorkflow = navContext.activeTab === 'workflow';

  const workflows = [
    { frequency: '随時', name: '施設情報登録', description: '自施設の基本情報を登録する。', implemented: false },
    { frequency: '随時', name: '職員情報登録', description: '職員の基本情報を更新する。', implemented: true },
    { frequency: '随時', name: '取引先情報登録', description: '取引先・顧客の基本情報を更新する。', implemented: true },
    { frequency: '随時', name: 'スキル体系登録', description: '業務に必要なスキル体系を定義する。', implemented: true },
    { frequency: '随時', name: '工賃体系登録', description: '基本工賃単価を定義する。', implemented: true },
    { frequency: '随時', name: '利用者情報登録', description: '利用者の基本情報を更新する。', implemented: true },
    { frequency: '随時', name: '利用者スキル評価', description: '利用者のスキルレベルを評価する。', implemented: true },
    { frequency: '随時', name: '利用者工賃単価評価', description: '利用者の基本工賃単価を決定する。', implemented: true },
    { frequency: '随時', name: '案件情報登録・予算編成・担当者割当', description: '案件の基本情報、予算計画、および担当者を割り当てる。', implemented: true },
    { frequency: '毎日', name: '作業記録', description: '利用者の日々の作業時間を記録する。', implemented: true },
    { frequency: '随時', name: '材料費／経費記録', description: '日々の材料費や経費などを記録する。', implemented: true },
    { frequency: '毎月', name: '材料費／経費確定', description: '月間の材料費や経費を確定する。', implemented: false },
    { frequency: '毎月', name: '収益確定', description: '月間の収益を確定する。', implemented: false },
    { frequency: '毎月', name: '積立金確定', description: '月間の積立金を確定する。', implemented: false },
    { frequency: '毎月', name: '外注加工費確定', description: '月間の外注加工費を確定する。', implemented: false },
    { frequency: '毎月', name: '基本工賃額／控除額確定', description: '各利用者の基本工賃や控除を集計・確定する。', implemented: true },
    { frequency: '毎月', name: 'インセンティブ額確定（収支精算）', description: '進捗と貢献度に基づいてインセンティブ報酬を確定する。', implemented: true },
  ];

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
        {isMainFeatures ? (
          <MainFeaturesPage />
        ) : isWorkflow ? (
          <table className="inventory-table">
            <thead>
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>実装</th>
                <th style={{ width: '10%', textAlign: 'center' }}>頻度</th>
                <th style={{ width: '30%' }}>名称</th>
                <th style={{ width: '50%' }}>説明</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center', fontWeight: 'var(--weight-heading)', color: wf.implemented ? 'var(--color-success)' : 'inherit' }}>
                    {wf.implemented ? '済' : ''}
                  </td>
                  <td style={{ backgroundColor: getFrequencyColor(wf.frequency), textAlign: 'center', color: 'var(--color-text-main)' }}>
                    {wf.frequency}
                  </td>
                  <td style={{ fontWeight: 'var(--weight-heading)' }}>{wf.name}</td>
                  <td style={{ whiteSpace: 'normal' }}>{wf.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : isTableComposition ? (
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
                            padding: 'var(--space-1) var(--space-2)', 
                            borderRadius: 'var(--radius-sm)', 
                            fontSize: 'var(--text-caption)',
                            backgroundColor: table.tableType === 'マスタ' ? 'var(--palette-bluegreen-300)' : 'var(--palette-yellow-300)',
                            color: 'var(--color-text-main)'
                          }}>
                            {table.tableType}
                          </span>
                        </td>
                        <td rowSpan={table.columns.length} style={{ fontWeight: 'var(--weight-heading)', verticalAlign: 'top' }}>{table.physicalName}</td>
                        <td rowSpan={table.columns.length} style={{ verticalAlign: 'top' }}>{table.logicalName}</td>
                        <td rowSpan={table.columns.length} style={{ verticalAlign: 'top' }}>{table.description}</td>
                      </>
                    )}
                    <td style={{ verticalAlign: 'top', color: 'var(--color-text-main)' }}>{col.name}</td>
                    <td style={{ verticalAlign: 'top', color: 'var(--color-text-muted)' }}>{col.desc}</td>
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
                    <td style={{ verticalAlign: 'top', fontWeight: 'var(--weight-heading)', backgroundColor: 'var(--color-bg-subtle)' }}>
                      {row.screen}
                    </td>
                    <td style={{ verticalAlign: 'top', backgroundColor: getCategoryColor(SETTINGS_LABEL), color: 'var(--color-text-main)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {settingsTabs.map(item => <div key={item}>{item}</div>)}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'top', backgroundColor: getCategoryColor(RECORDING_LABEL), color: 'var(--color-text-main)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {recordingTabs.map(item => <div key={item}>{item}</div>)}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'top', backgroundColor: getCategoryColor(AGGREGATION_LABEL), color: 'var(--color-text-main)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
