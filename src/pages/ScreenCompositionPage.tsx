
import { PAGE_NAMES, MENU_CATEGORIES, MENU_SUBCATEGORIES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { MainFeaturesPage } from './MainFeaturesPage';

const AGGREGATION_LABEL = `${MENU_CATEGORIES.AGGREGATION}（${MENU_SUBCATEGORIES.AGGREGATION}）`;
const RECORDING_LABEL = `${MENU_CATEGORIES.RECORDING}（${MENU_SUBCATEGORIES.RECORDING}）`;
const SETTINGS_LABEL = `${MENU_CATEGORIES.SETTINGS}（${MENU_SUBCATEGORIES.SETTINGS}）`;

const getCategoryLabel = (pageName: string) => {
  const aggregations = [
    PAGE_NAMES.WAGE_SUMMARY,
    PAGE_NAMES.PROJECT_FINANCIAL_SUMMARY,
    PAGE_NAMES.FINANCIAL_SUMMARY,
    PAGE_NAMES.WELFARE_FINANCIAL_SUMMARY,
  ];
  const recordings = [
    PAGE_NAMES.SKILL_EVALUATION,
    PAGE_NAMES.BASE_WAGE_ASSIGNMENT,
    PAGE_NAMES.PROJECT_INFO,
    PAGE_NAMES.BUDGET_PLANNING,
    PAGE_NAMES.ASSIGNEE_ALLOCATION,
    PAGE_NAMES.DAILY_WORK_RECORD,
    PAGE_NAMES.PROJECT_FINANCIAL_RECORD,
    PAGE_NAMES.PROGRESS_RECORD,
    PAGE_NAMES.REWARD_ALLOCATION,
    PAGE_NAMES.FINANCIAL_RECORD,
  ];
  
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
  const rows = Object.values(SCREEN_CONFIGS).map(config => ({
    screen: config.screenName,
    existing: config.tabs.map(t => t.label),
  }));

  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : '画面構成表';
  
  const isTableComposition = navContext.activeTab === 'tableComposition';
  const isMainFeatures = navContext.activeTab === 'mainFeatures';
  const isWorkflow = navContext.activeTab === 'workflow';

  const workflows = [
    { frequency: '随時', name: '施設情報登録', description: '自施設の基本情報を登録する。', implemented: false },
    { frequency: '随時', name: '職員情報登録', description: '職員の基本情報を管理・更新する。', implemented: true },
    { frequency: '随時', name: '取引先情報登録', description: '取引先・顧客の基本情報を管理・更新する。', implemented: true },
    { frequency: '随時', name: 'スキル体系登録', description: '業務に必要なスキル体系およびスキルレベルを定義する。', implemented: true },
    { frequency: '随時', name: '工賃体系登録', description: '基本工賃単価のマスターデータを定義する。', implemented: true },
    { frequency: '随時', name: '利用者情報登録', description: '利用者の基本情報を管理・更新する。', implemented: true },
    { frequency: '随時', name: '利用者スキル評価', description: '利用者のスキルレベルを評価する。', implemented: true },
    { frequency: '随時', name: '利用者工賃単価評価', description: '利用者の基本工賃単価を評価・決定する。', implemented: true },
    { frequency: '随時', name: '案件情報登録・予算編成・担当者割当', description: '案件の基本情報登録、予算計画の策定、およびタスク担当者を割り当てる。', implemented: true },
    { frequency: '毎日', name: '作業記録・日次確定', description: '利用者の日々の作業時間を記録し、日単位で確定する。', implemented: true },
    { frequency: '随時', name: '材料費／経費記録', description: '案件ごとの材料費や経費などを記録する。', implemented: true },
    { frequency: '毎月', name: '材料費／経費確定', description: '月間の材料費や経費を確定する。', implemented: false },
    { frequency: '毎月', name: '収益確定', description: '月間の収益を確定する。', implemented: false },
    { frequency: '毎月', name: '積立金確定', description: '月間の積立金を確定する。', implemented: false },
    { frequency: '毎月', name: '外注加工費確定', description: '月間の外注加工費を確定する。', implemented: false },
    { frequency: '毎月', name: '月次工賃・控除額確定', description: '各利用者の月次工賃や控除を集計・確定し、収支一覧に自動同期する。', implemented: true },
    { frequency: '毎月', name: '月次インセンティブ分配確定', description: '各案件のタスク完了状況を確認し、月次インセンティブ分配を確定する。', implemented: true },
    { frequency: '毎月', name: '事業活動別収支集計', description: '就労支援事業活動および福祉事業活動ごとの月次収支を集計・参照する。', implemented: true },
  ];

  const dbTables = [
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
      physicalName: 'wage_rates', 
      tableType: 'マスタ',
      logicalName: '工賃単価', 
      description: '工賃単価のマスターデータ',
      columns: [
        { name: 'id', desc: '工賃単価ID' },
        { name: 'wage', desc: '工賃単価' },
        { name: 'description', desc: '説明・摘要' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'members', 
      tableType: 'マスタ',
      logicalName: '利用者', 
      description: '案件に参加する利用者情報',
      columns: [
        { name: 'id', desc: '利用者ID' },
        { name: 'name', desc: '利用者名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'role', desc: '権限ロール' },
        { name: 'email', desc: 'メールアドレス' },
        { name: 'wage_rate_id', desc: '工賃単価ID' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'member_skill_evaluations', 
      tableType: 'トランザクション',
      logicalName: '利用者スキル評価', 
      description: '利用者の保有スキル評価',
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
      physicalName: 'member_wage_evaluations', 
      tableType: 'トランザクション',
      logicalName: '利用者工賃単価評価', 
      description: '利用者の工賃単価評価・割当履歴',
      columns: [
        { name: 'id', desc: '評価ID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'wage_rate_id', desc: '工賃単価ID' },
        { name: 'evaluated_at', desc: '評価日時' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'staffs', 
      tableType: 'マスタ',
      logicalName: '職員', 
      description: 'システムを利用する職員情報',
      columns: [
        { name: 'id', desc: '職員ID' },
        { name: 'name', desc: '職員名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'role', desc: '権限ロール' },
        { name: 'email', desc: 'メールアドレス' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'partners', 
      tableType: 'マスタ',
      logicalName: '取引先', 
      description: '取引先情報',
      columns: [
        { name: 'id', desc: '取引先ID' },
        { name: 'name', desc: '取引先・企業名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'contact_person', desc: '担当者名' },
        { name: 'phone', desc: '電話番号' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'projects', 
      tableType: 'トランザクション',
      logicalName: '案件', 
      description: '案件基本情報',
      columns: [
        { name: 'id', desc: '案件ID' },
        { name: 'code', desc: '案件コード' },
        { name: 'name', desc: '案件名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'client_id', desc: '紐づく取引先ID' },
        { name: 'project_type', desc: '案件種別' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'project_tasks', 
      tableType: 'トランザクション',
      logicalName: '案件タスク', 
      description: '案件内の各タスク情報',
      columns: [
        { name: 'id', desc: 'タスクID' },
        { name: 'project_id', desc: '案件ID' },
        { name: 'code', desc: 'タスクコード' },
        { name: 'name', desc: 'タスク名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'assignee_type', desc: '担当者区分（利用者/職員/外部等）' },
        { name: 'status', desc: 'ステータス' },
        { name: 'labor_budget', desc: '人件費予算' },
        { name: 'completed_at', desc: '完了日時' },
        { name: 'is_canceled', desc: 'キャンセルフラグ' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'project_budgets', 
      tableType: 'トランザクション',
      logicalName: '案件予算', 
      description: '案件の予算（売上・原価・予備費）',
      columns: [
        { name: 'id', desc: '予算項目ID' },
        { name: 'project_id', desc: '案件ID' },
        { name: 'category', desc: '予算カテゴリ（売上/経費/予備費）' },
        { name: 'subject', desc: '科目・内容' },
        { name: 'task_id', desc: '関連タスクID' },
        { name: 'amount', desc: '金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'project_task_skills', 
      tableType: 'トランザクション',
      logicalName: '案件タスクスキル', 
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
      logicalName: '案件タスク担当者', 
      description: 'タスクの割り当て担当者',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'client_id', desc: '取引先ID' },
        { name: 'staff_id', desc: '職員ID' }
      ]
    },
    { 
      physicalName: 'project_task_progress', 
      tableType: 'トランザクション',
      logicalName: '案件タスク進捗', 
      description: 'タスク進捗状況（未着手・進行中・完了・中止）',
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
      physicalName: 'daily_work_records', 
      tableType: 'トランザクション',
      logicalName: '日次作業記録', 
      description: '利用者の日々の作業実績（工数）および確定状態',
      columns: [
        { name: 'id', desc: '記録ID' },
        { name: 'date', desc: '作業日' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'work_time', desc: '作業時間' },
        { name: 'is_confirmed', desc: '確定フラグ' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'monthly_incentive_allocations', 
      tableType: 'トランザクション',
      logicalName: '月次インセンティブ分配記録', 
      description: '月次インセンティブ分配（インセンティブ分配・進捗結果）および確定状態',
      columns: [
        { name: 'id', desc: '精算記録ID' },
        { name: 'year_month', desc: '対象年月(YYYY-MM)' },
        { name: 'project_id', desc: '案件ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'allocation_amount', desc: '分配金額' },
        { name: 'is_confirmed', desc: '確定フラグ' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'monthly_wage_records', 
      tableType: 'トランザクション',
      logicalName: '月次工賃記録', 
      description: '月ごとの各利用者の計算・支給工賃記録および確定状態',
      columns: [
        { name: 'id', desc: '記録ID' },
        { name: 'year_month', desc: '対象年月(YYYY-MM)' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'work_time', desc: '総作業時間' },
        { name: 'wage_rate', desc: '工賃単価' },
        { name: 'basic_wage', desc: '基本支給額' },
        { name: 'incentive_total', desc: 'インセンティブ合計' },
        { name: 'wage_total', desc: '支給工賃合計' },
        { name: 'deduction_total', desc: '控除合計' },
        { name: 'payment', desc: '差引支給額' },
        { name: 'is_confirmed', desc: '確定フラグ' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'financial_records', 
      tableType: 'トランザクション',
      logicalName: '収支記録', 
      description: '確定した収支データ（売上・費用・積立金）',
      columns: [
        { name: 'id', desc: '収支記録ID' },
        { name: 'period', desc: '対象期間（年月）' },
        { name: 'project_id', desc: '案件ID' },
        { name: 'client_id', desc: '取引先ID' },
        { name: 'type', desc: '収支区分（revenue: 収益 / expense: 費用 / reserve: 積立金）' },
        { name: 'subject', desc: '科目・内容' },
        { name: 'amount', desc: '金額' },
        { name: 'remarks', desc: '備考' },
        { name: 'recorded_date', desc: '発生日・計上日' },
        { name: 'recorded_by', desc: '記録者ID' },
        { name: 'is_limited', desc: '限定公開フラグ' },
        { name: 'activity_category', desc: '事業区分（production: 就労支援事業活動 / welfare: 福祉事業活動）' },
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
                table.columns.map((col, idx) => {
                  const isLastInTable = idx === table.columns.length - 1;
                  const borderBottomStyle = isLastInTable ? undefined : 'none';
                  return (
                    <tr key={`${i}-${idx}`}>
                      <td style={{ borderBottom: borderBottomStyle }}>
                        {idx === 0 ? (
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
                        ) : ''}
                      </td>
                      <td style={{ borderBottom: borderBottomStyle, fontWeight: idx === 0 ? 'var(--weight-heading)' : undefined }}>
                        {idx === 0 ? table.physicalName : ''}
                      </td>
                      <td style={{ borderBottom: borderBottomStyle }}>
                        {idx === 0 ? table.logicalName : ''}
                      </td>
                      <td style={{ borderBottom: borderBottomStyle }}>
                        {idx === 0 ? table.description : ''}
                      </td>
                      <td style={{ color: 'var(--color-text-main)' }}>{col.name}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{col.desc}</td>
                    </tr>
                  );
                })
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
                const isNoTabScreen = [PAGE_NAMES.SCREEN_DASHBOARD, 'システム構成（開発用）', PAGE_NAMES.SCREEN_COMPOSITION].includes(row.screen);
                const activeTabs = isNoTabScreen ? [] : row.existing;
                const settingsTabs = activeTabs.filter(item => getCategoryLabel(item) === SETTINGS_LABEL);
                const recordingTabs = activeTabs.filter(item => getCategoryLabel(item) === RECORDING_LABEL);
                const aggregationTabs = activeTabs.filter(item => getCategoryLabel(item) === AGGREGATION_LABEL);

                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 'var(--weight-heading)', backgroundColor: 'var(--color-bg-subtle)' }}>
                      {row.screen}
                    </td>
                    <td style={{ backgroundColor: getCategoryColor(SETTINGS_LABEL), color: 'var(--color-text-main)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {settingsTabs.map(item => <div key={item}>{item}</div>)}
                      </div>
                    </td>
                    <td style={{ backgroundColor: getCategoryColor(RECORDING_LABEL), color: 'var(--color-text-main)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {recordingTabs.map(item => <div key={item}>{item}</div>)}
                      </div>
                    </td>
                    <td style={{ backgroundColor: getCategoryColor(AGGREGATION_LABEL), color: 'var(--color-text-main)' }}>
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
