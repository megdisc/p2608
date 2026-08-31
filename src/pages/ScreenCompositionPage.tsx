
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
    PAGE_NAMES.FINANCIAL_RECORD,
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
    PAGE_NAMES.PROGRESS_RECORD,
    PAGE_NAMES.PROJECT_FINANCIAL_RECORD,
    PAGE_NAMES.REWARD_ALLOCATION,
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
    { frequency: '随時', name: '積立金設定登録', description: '積立金の種別、計算基準・率・上限額等を定義する。', implemented: true },
    { frequency: '随時', name: '利用者情報登録', description: '利用者の基本情報を管理・更新する。', implemented: true },
    { frequency: '随時', name: '利用者スキル評価', description: '利用者のスキルレベルを評価する。', implemented: true },
    { frequency: '随時', name: '利用者工賃単価評価', description: '利用者の基本工賃単価を評価・決定する。', implemented: true },
    { frequency: '随時', name: '案件情報登録・予算編成・担当者割当', description: '案件の基本情報登録、予算計画の策定、およびタスク担当者を割り当てる。', implemented: true },
    { frequency: '毎日', name: '作業実績記録・作業実績確定', description: '利用者の日々の作業時間を記録し、日単位で確定する。', implemented: true },
    { frequency: '随時', name: '材料費／経費記録', description: '案件ごとの材料費や経費などを記録する。', implemented: true },
    { frequency: '毎月', name: '材料費／経費確定', description: '月間の材料費や経費を確定する。', implemented: false },
    { frequency: '毎月', name: '収益確定', description: '月間の収益を確定する。', implemented: false },
    { frequency: '毎月', name: '積立金確定', description: '月間の積立金を確定する。', implemented: false },
    { frequency: '毎月', name: '外注加工費確定', description: '月間の外注加工費を確定する。', implemented: false },
    { frequency: '毎月', name: '工賃・控除確定', description: '各利用者の月次工賃や加算・控除を集計・確定し、収支一覧に自動同期する。', implemented: true },
    { frequency: '毎月', name: 'インセンティブ確定', description: '各案件のタスク完了状況を確認し、月次インセンティブ分配を確定する。', implemented: true },
    { frequency: '毎月', name: '事業活動別収支集計', description: '就労支援事業活動および福祉事業活動ごとの月次収支を集計・参照する。', implemented: true },
  ];

  const dbTables = [
    { 
      layer: '1. マスタ層',
      physicalName: 'skills', 
      tableType: '独立マスタ',
      logicalName: 'スキル', 
      description: 'スキルのマスターデータ',
      columns: [
        { name: 'id', desc: 'スキルID' },
        { name: 'name', desc: 'スキル名' },
        { name: 'description', desc: 'スキルの説明' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'skill_levels', 
      tableType: '独立マスタ',
      logicalName: 'スキルレベル', 
      description: 'スキルレベルの汎用定義',
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
      layer: '1. マスタ層',
      physicalName: 'wage_rates', 
      tableType: '独立マスタ',
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
      layer: '1. マスタ層',
      physicalName: 'allowances', 
      tableType: '独立マスタ',
      logicalName: 'その他加算手当', 
      description: '加算手当のマスターデータ（送迎加算、皆勤手当、資格手当など）',
      columns: [
        { name: 'id', desc: '手当ID' },
        { name: 'name', desc: '手当名' },
        { name: 'occurrence_type', desc: '発生単位（daily: 日次発生 / monthly: 月次発生）' },
        { name: 'default_unit_price', desc: '標準単価' },
        { name: 'is_active', desc: '有効フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'deductions', 
      tableType: '独立マスタ',
      logicalName: '控除', 
      description: '控除のマスターデータ（昼食代、積立金、物品購入費など）',
      columns: [
        { name: 'id', desc: '控除ID' },
        { name: 'name', desc: '控除名' },
        { name: 'occurrence_type', desc: '発生単位（daily: 日次発生 / monthly: 月次発生）' },
        { name: 'default_unit_price', desc: '標準単価' },
        { name: 'is_active', desc: '有効フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'users', 
      tableType: '独立マスタ',
      logicalName: '認証ユーザー', 
      description: 'Supabase Authと連携するシステム全ユーザーのアカウント認証情報',
      columns: [
        { name: 'id', desc: 'ユーザーID' },
        { name: 'email', desc: 'メールアドレス' },
        { name: 'role', desc: '権限ロール' },
        { name: 'user_type', desc: 'ユーザー種別（staff/member）' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'members', 
      tableType: '従属マスタ',
      logicalName: '利用者', 
      description: '案件に参加する利用者情報',
      columns: [
        { name: 'id', desc: '利用者ID' },
        { name: 'user_id', desc: '認証ユーザーID' },
        { name: 'code', desc: '利用者コード' },
        { name: 'name', desc: '利用者名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
      physicalName: 'member_wage_evaluations', 
      tableType: 'トランザクション',
      logicalName: '利用者工賃単価評価', 
      description: '利用者の工賃単価評価・割当履歴',
      columns: [
        { name: 'id', desc: '評価ID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'wage_rate_id', desc: '工賃単価ID' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'staffs', 
      tableType: '従属マスタ',
      logicalName: '職員', 
      description: 'システムを利用する職員情報',
      columns: [
        { name: 'id', desc: '職員ID' },
        { name: 'user_id', desc: '認証ユーザーID' },
        { name: 'code', desc: '職員コード' },
        { name: 'name', desc: '職員名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'partners', 
      tableType: '独立マスタ',
      logicalName: '取引先', 
      description: '取引先情報',
      columns: [
        { name: 'id', desc: '取引先ID' },
        { name: 'code', desc: '取引先コード' },
        { name: 'name', desc: '取引先・企業名' },
        { name: 'yomigana', desc: 'フリガナ' },
        { name: 'contact_person', desc: '担当者名' },
        { name: 'phone', desc: '電話番号' },
        { name: 'is_customer', desc: '顧客フラグ' },
        { name: 'is_subcontractor', desc: '外注先フラグ' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'projects', 
      tableType: 'トランザクション',
      logicalName: '案件', 
      description: '案件基本情報',
      columns: [
        { name: 'id', desc: '案件ID' },
        { name: 'settlement_year_month', desc: '精算年月' },
        { name: 'client_id', desc: '紐づく取引先ID' },
        { name: 'code', desc: '案件コード' },
        { name: 'name', desc: '案件名' },
        { name: 'project_type', desc: '案件種別' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'project_tasks', 
      tableType: 'トランザクション',
      logicalName: '案件タスク', 
      description: '案件内の各タスク情報',
      columns: [
        { name: 'id', desc: 'タスクID' },
        { name: 'completed_at', desc: '完了日時' },
        { name: 'project_id', desc: '案件ID' },
        { name: 'name', desc: 'タスク名' },
        { name: 'assignee_type', desc: '担当者区分（内部/外部等）' },
        { name: 'is_completed', desc: '完了フラグ' },
        { name: 'is_deleted', desc: '削除フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '1. マスタ層',
      physicalName: 'project_budgets', 
      tableType: 'トランザクション',
      logicalName: '案件予算', 
      description: '案件の予算（売上・原価・予備費）',
      columns: [
        { name: 'id', desc: '予算項目ID' },
        { name: 'project_id', desc: '案件ID' },
        { name: 'task_id', desc: '関連タスクID' },
        { name: 'category', desc: '予算カテゴリ（売上/経費/予備費）' },
        { name: 'subject', desc: '科目・内容' },
        { name: 'amount', desc: '金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '5. 案件・財務トランザクション',
      physicalName: 'project_task_skills', 
      tableType: 'トランザクション',
      logicalName: '案件タスクスキル', 
      description: 'タスクに必要なスキルとレベル',
      columns: [
        { name: 'id', desc: 'ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'skill_id', desc: '要求スキルID' },
        { name: 'skill_level_id', desc: '要求スキルレベルID' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '5. 案件・財務トランザクション',
      physicalName: 'project_task_assignees', 
      tableType: 'トランザクション',
      logicalName: '案件タスク担当者', 
      description: 'タスクの割り当て担当者',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'staff_id', desc: '職員ID' },
        { name: 'client_id', desc: '取引先ID' },
        { name: 'assignee_type', desc: '担当者区分' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },

    { 
      layer: '2. 日次実績層',
      physicalName: 'daily_work_records', 
      tableType: 'トランザクション',
      logicalName: '作業実績', 
      description: '利用者の日々の作業実績（作業時間）',
      columns: [
        { name: 'id', desc: '作業実績ID' },
        { name: 'date', desc: '作業日' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'work_time', desc: '作業時間' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '2. 日次実績層',
      physicalName: 'daily_allowance_records', 
      tableType: 'トランザクション',
      logicalName: 'その他加算手当実績', 
      description: '作業実績に紐付く日次発生の加算手当実績（例: 送迎利用等）',
      columns: [
        { name: 'id', desc: '実績ID' },
        { name: 'work_record_id', desc: '作業実績ID' },
        { name: 'allowance_id', desc: '手当ID' },
        { name: 'quantity', desc: '数量・回数' },
        { name: 'unit_price', desc: '発生時単価' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '2. 日次実績層',
      physicalName: 'daily_deduction_records', 
      tableType: 'トランザクション',
      logicalName: '控除実績', 
      description: '作業実績に紐付く日次発生の控除実績（例: 昼食利用等）',
      columns: [
        { name: 'id', desc: '実績ID' },
        { name: 'work_record_id', desc: '作業実績ID' },
        { name: 'deduction_id', desc: '控除ID' },
        { name: 'quantity', desc: '数量・回数' },
        { name: 'unit_price', desc: '発生時単価' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '2. 日次実績層',
      physicalName: 'daily_work_confirmations', 
      tableType: 'トランザクション',
      logicalName: '作業実績確定', 
      description: '作業日ごとの確定状態および確定履歴',
      columns: [
        { name: 'id', desc: '確定ID' },
        { name: 'date', desc: '作業日' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'is_confirmed', desc: '確定フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '3. 月次実績層',
      physicalName: 'monthly_incentive_records', 
      tableType: 'トランザクション',
      logicalName: 'インセンティブ実績', 
      description: '案件タスクの成果・貢献度に応じた各利用者の月次分配実績',
      columns: [
        { name: 'id', desc: '実績ID' },
        { name: 'year_month', desc: '対象年月(YYYY-MM)' },
        { name: 'member_id', desc: '分配先利用者ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'allocation_amount', desc: '分配金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '3. 月次実績層',
      physicalName: 'monthly_incentive_confirmations', 
      tableType: 'トランザクション',
      logicalName: 'インセンティブ確定', 
      description: '対象年月ごとのインセンティブ分配確定状態および確定履歴',
      columns: [
        { name: 'id', desc: '確定ID' },
        { name: 'year_month', desc: '対象年月(YYYY-MM)' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'is_confirmed', desc: '確定フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '4. 月次確定・スナップショット層',
      physicalName: 'monthly_wage_summaries', 
      tableType: 'トランザクション',
      logicalName: '工賃・控除概要', 
      description: '月ごとの各利用者の計算・支給工賃記録および控除概要（基幹親テーブル）',
      columns: [
        { name: 'id', desc: '概要ID' },
        { name: 'year_month', desc: '対象年月(YYYY-MM)' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'work_time', desc: '総作業時間' },
        { name: 'wage_rate', desc: '工賃単価' },
        { name: 'basic_wage', desc: '基本支給額' },
        { name: 'incentive_total', desc: 'インセンティブ合計' },
        { name: 'other_allowance_total', desc: 'その他加算手当合計' },
        { name: 'wage_total', desc: '工賃合計' },
        { name: 'deduction_total', desc: '控除合計' },
        { name: 'payment', desc: '差引支給額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      layer: '4. 月次確定・スナップショット層',
      physicalName: 'monthly_incentive_details', 
      tableType: 'トランザクション',
      logicalName: 'インセンティブ明細', 
      description: '月次工賃確定時点のインセンティブ分配内訳スナップショット',
      columns: [
        { name: 'id', desc: '明細ID' },
        { name: 'summary_id', desc: '工賃・控除概要ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'allocation_amount', desc: '分配金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'monthly_allowance_details', 
      tableType: 'トランザクション',
      logicalName: 'その他加算手当明細', 
      description: '月次工賃確定時点のその他加算手当内訳スナップショット',
      columns: [
        { name: 'id', desc: '明細ID' },
        { name: 'summary_id', desc: '工賃・控除概要ID' },
        { name: 'allowance_id', desc: '手当ID' },
        { name: 'allowance_name', desc: '手当名' },
        { name: 'unit_price', desc: '単価' },
        { name: 'quantity', desc: '数量・日数' },
        { name: 'amount', desc: '金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'monthly_deduction_details', 
      tableType: 'トランザクション',
      logicalName: '控除明細', 
      description: '月次工賃確定時点の控除内訳スナップショット',
      columns: [
        { name: 'id', desc: '明細ID' },
        { name: 'summary_id', desc: '工賃・控除概要ID' },
        { name: 'deduction_id', desc: '控除ID' },
        { name: 'deduction_name', desc: '控除名' },
        { name: 'unit_price', desc: '単価' },
        { name: 'quantity', desc: '数量・日数' },
        { name: 'amount', desc: '金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    { 
      physicalName: 'monthly_wage_confirmations', 
      tableType: 'トランザクション',
      logicalName: '工賃・控除確定', 
      description: '対象年月ごとの工賃計算確定状態および確定履歴',
      columns: [
        { name: 'id', desc: '確定ID' },
        { name: 'year_month', desc: '対象年月(YYYY-MM)' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'is_confirmed', desc: '確定フラグ' },
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
        { name: 'recorded_date', desc: '発生日・計上日' },
        { name: 'project_id', desc: '案件ID' },
        { name: 'client_id', desc: '取引先ID' },
        { name: 'recorded_by', desc: '計上職員ID' },
        { name: 'type', desc: '収支区分（revenue: 収益 / expense: 費用 / reserve: 積立金）' },
        { name: 'activity_category', desc: '事業区分（production: 就労支援事業活動 / welfare: 福祉事業活動）' },
        { name: 'cost_category', desc: '費用区分（manufacturing: 製造原価 / sga: 販売費及び一般管理費）' },
        { name: 'subject', desc: '科目・内容' },
        { name: 'amount', desc: '金額' },
        { name: 'remarks', desc: '備考' },
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
                  <td style={{ textAlign: 'center', fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>
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
          <div>
            {/* 4層アーキテクチャ概要ガイド */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              backgroundColor: 'var(--color-bg-subtle)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border-subtle)' 
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-body-bold)', color: 'var(--color-text-main)' }}>
                工賃・インセンティブデータ構造アーキテクチャ（4層パイプライン構造）
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '10px 12px', backgroundColor: '#ebf8ff', borderRadius: '6px', borderLeft: '4px solid #3182ce' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#2b6cb0' }}>1. マスタ層</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>手当・控除・単価・利用者・スキルの基本定義</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#fffaf0', borderRadius: '6px', borderLeft: '4px solid #dd6b20' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#c05621' }}>2. 日次実績層</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>作業時間・日次加算/控除の実績 ➔ [日報確定]</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#faf5ff', borderRadius: '6px', borderLeft: '4px solid #805ad5' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#6b46c1' }}>3. 月次実績層</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>案件貢献度インセンティブ分配 ➔ [インセンティブ確定]</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#f0fff4', borderRadius: '6px', borderLeft: '4px solid #38a169' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#276749' }}>4. 月次確定・スナップショット層</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>工賃・控除概要 ＋ 各明細の不変保存 ➔ [工賃・控除確定]</div>
                </div>
              </div>
            </div>

            <table className="inventory-table">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>アーキテクチャ層</th>
                  <th style={{ width: '9%' }}>区分 (Type)</th>
                  <th style={{ width: '14%' }}>物理名 (Table Name)</th>
                  <th style={{ width: '13%' }}>論理名 (Logical Name)</th>
                  <th style={{ width: '23%' }}>説明 (Description)</th>
                  <th style={{ width: '13%' }}>カラム名</th>
                  <th style={{ width: '15%' }}>カラム説明</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let currentLayer = '';
                  return dbTables.flatMap((table, i) => {
                    const isNewLayer = table.layer !== currentLayer;
                    if (isNewLayer) {
                      currentLayer = table.layer || '';
                    }

                    const layerBgColor = 
                      table.layer === '1. マスタ層' ? '#ebf8ff' :
                      table.layer === '2. 日次実績層' ? '#fffaf0' :
                      table.layer === '3. 月次実績層' ? '#faf5ff' :
                      table.layer === '4. 月次確定・スナップショット層' ? '#f0fff4' : '#f7fafc';

                    const layerTextColor = 
                      table.layer === '1. マスタ層' ? '#2b6cb0' :
                      table.layer === '2. 日次実績層' ? '#c05621' :
                      table.layer === '3. 月次実績層' ? '#6b46c1' :
                      table.layer === '4. 月次確定・スナップショット層' ? '#276749' : '#4a5568';

                    const tableRows = table.columns.map((col, idx) => {
                      const isLastInTable = idx === table.columns.length - 1;
                      const borderBottomStyle = isLastInTable ? undefined : 'none';
                      return (
                        <tr key={`${i}-${idx}`}>
                          <td style={{ borderBottom: borderBottomStyle }}>
                            {idx === 0 ? (
                              <span style={{ 
                                display: 'inline-block', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '11px',
                                fontWeight: 'bold',
                                backgroundColor: layerBgColor,
                                color: layerTextColor,
                                border: `1px solid ${layerTextColor}40`
                              }}>
                                {table.layer}
                              </span>
                            ) : ''}
                          </td>
                          <td style={{ borderBottom: borderBottomStyle }}>
                            {idx === 0 ? (
                              <span style={{ 
                                display: 'inline-block', 
                                padding: 'var(--space-1) var(--space-2)', 
                                borderRadius: 'var(--radius-sm)', 
                                fontSize: 'var(--text-caption)',
                                backgroundColor: table.tableType === '独立マスタ' ? 'var(--palette-bluegreen-300)' : (table.tableType === '従属マスタ' ? 'var(--palette-bluegreen-200)' : 'var(--palette-yellow-300)'),
                                color: 'var(--color-text-main)'
                              }}>
                                {table.tableType}
                              </span>
                            ) : ''}
                          </td>
                          <td style={{ borderBottom: borderBottomStyle, fontWeight: idx === 0 ? 'var(--weight-heading)' : undefined }}>
                            {idx === 0 ? table.physicalName : ''}
                          </td>
                          <td style={{ borderBottom: borderBottomStyle, fontWeight: idx === 0 ? 'var(--weight-heading)' : undefined }}>
                            {idx === 0 ? table.logicalName : ''}
                          </td>
                          <td style={{ borderBottom: borderBottomStyle }}>
                            {idx === 0 ? table.description : ''}
                          </td>
                          <td style={{ color: 'var(--color-text-main)' }}>{col.name}</td>
                          <td style={{ color: 'var(--color-text-main)' }}>{col.desc}</td>
                        </tr>
                      );
                    });

                    if (isNewLayer) {
                      return [
                        <tr key={`layer-hdr-${i}`} style={{ backgroundColor: layerBgColor }}>
                          <td colSpan={7} style={{ padding: '8px 12px', fontWeight: 'bold', color: layerTextColor, borderTop: '2px solid var(--color-border-subtle)' }}>
                            ■ {table.layer}
                          </td>
                        </tr>,
                        ...tableRows
                      ];
                    }
                    return tableRows;
                  });
                })()}
              </tbody>
            </table>
          </div>
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
