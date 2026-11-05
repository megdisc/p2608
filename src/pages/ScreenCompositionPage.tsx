import { useMemo } from 'react';
import { PAGE_NAMES, MENU_CATEGORIES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

const CATEGORY_INDEPENDENT_MASTER = MENU_CATEGORIES.INDEPENDENT_MASTER || '独立マスタ系';
const CATEGORY_DEPENDENT_MASTER = MENU_CATEGORIES.DEPENDENT_MASTER || '従属マスタ系';
const CATEGORY_RECORD = MENU_CATEGORIES.RECORD || 'レコード系';
const CATEGORY_SUMMARY = MENU_CATEGORIES.SUMMARY || '集計結果系';

const getTabCategory = (tabId: string): string => {
  // 1. 独立マスタ系
  const independentMasterTabIds = [
    'serviceType', // 福祉制度: 支援種別
    'qualification', // 福祉制度: 資格
    'staffRole', // 福祉制度: 職種
    'regionalGrade', // 福祉制度: 所在地級数
    'organization', // 施設: 法人
    'client', // 取引先: 基本情報
    'skillCategory', // スキル体系: カテゴリ
    'baseWage', // 工賃・控除体系: 工賃単価
    'allowance', // 工賃・控除体系: 加算手当
    'deduction', // 工賃・控除体系: 控除
    'reserveSetting', // 積立金体系: 基本情報
  ];

  // 2. 従属マスタ系
  const dependentMasterTabIds = [
    'rewardItem', // 福祉制度: 加算・減算
    'office', // 施設: 事業所
    'officeServiceType', // 施設: 支援種別
    'officeReward', // 施設: 加算・減算
    'skill', // スキル体系: スキル
    'skillLevel', // スキル体系: レベル
    'staff', // 職員: 基本情報
    'staffQualification', // 職員: 資格
    'staffOffice', // 職員: 所属事業所
    'staffWorkStyle', // 職員: 職種
    'staffSchedule', // 職員: 勤務予定
    'projectUser', // 利用者: 基本情報
    'memberRecipientCertificate', // 利用者: 受給者証
    'memberOffice', // 利用者: 事業所
    'memberSchedule', // 利用者: 利用予定
    'baseWageAssignment', // 利用者: 工賃単価
    'project', // 案件: 基本情報
    'budgetPlanning', // 案件: 予算
    'assigneeAllocation', // 案件: 担当者
  ];

  // 3. レコード系
  const recordTabIds = [
    'calendarDailyReportCalendar', // カレンダー・日報: カレンダー
    'calendarDailyReportDay', // カレンダー・日報: 日報
    'attendanceMonth', // 勤怠・出欠: 月
    'attendanceDay', // 勤怠・出欠: 日
    'skillEvaluation', // 利用者: スキル評価
    'progressRecord', // 案件: 進捗
    'projectFinancialRecord', // 案件: 材料費・経費記録
    'staffAttendanceRecord', // 日報: 勤務記録
    'dailyWorkRecord', // 日報: 利用記録
    'financialRecord', // 収支: 収支一覧
  ];

  // 4. 集計結果系
  const summaryTabIds = [
    'rewardAllocation', // 案件: 精算
    'wageSummary', // 収支: 工賃・控除明細
    'averageWage', // 収支: 平均工賃
    'projectFinancialSummary', // 収支: 就労支援事業活動収支（案件別）
    'financialSummary', // 収支: 就労支援事業活動収支（期間別）
    'welfareFinancialSummary', // 収支: 福祉事業活動収支
    'dashboard', // ダッシュボード
  ];

  if (independentMasterTabIds.includes(tabId)) return CATEGORY_INDEPENDENT_MASTER;
  if (dependentMasterTabIds.includes(tabId)) return CATEGORY_DEPENDENT_MASTER;
  if (recordTabIds.includes(tabId)) return CATEGORY_RECORD;
  if (summaryTabIds.includes(tabId)) return CATEGORY_SUMMARY;

  return CATEGORY_DEPENDENT_MASTER;
};

const getCategoryColor = (category: string) => {
  if (category === CATEGORY_INDEPENDENT_MASTER) return 'var(--palette-red-300)';
  if (category === CATEGORY_DEPENDENT_MASTER) return 'var(--palette-blue-300)';
  if (category === CATEGORY_RECORD) return 'var(--palette-bluegreen-300)';
  if (category === CATEGORY_SUMMARY) return 'var(--palette-yellow-300)';
  return 'transparent';
};

interface DBColumn {
  name: string;
  desc: string;
  status?: 'added' | 'modified';
}

interface DBTable {
  category: string;
  categoryDescription?: string;
  subCategory?: string;
  physicalName: string;
  tableType: string;
  logicalName: string;
  description: string;
  columns: DBColumn[];
  status?: 'added' | 'modified';
}

export function ScreenCompositionPage() {
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const list: { screen: string; tabs: { id: string; label: string }[] }[] = [];
    for (const config of Object.values(SCREEN_CONFIGS)) {
      if (!seen.has(config.screenName)) {
        seen.add(config.screenName);
        list.push({
          screen: config.screenName,
          tabs: config.tabs.map(t => ({ id: t.id, label: t.label })),
        });
      }
    }
    return list;
  }, []);

  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : '画面構成表';

  const isTableComposition = navContext.activeTab === 'tableComposition';

  const dbTables: DBTable[] = [
    {
      category: '1. 福祉制度',
      categoryDescription: '福祉制度で定められている値を管理するスキーマ群である。',
      physicalName: 'service_types',
      tableType: '独立マスタ',
      logicalName: '支援種別',
      description: '法令に基づく障害福祉サービス等の支援種別の定義マスターデータ',
      columns: [
        { name: 'id', desc: '支援種別ID' },
        { name: 'code', desc: 'サービス種類コード（厚生労働省公定2桁コード。例: 21: 就労継続支援B型, 22: 就労継続支援A型, 15: 就労移行支援 など）' },
        { name: 'name', desc: 'サービス種類名称' },
        { name: 'description', desc: '説明・概要' },
        { name: 'personnel_cost_ratio', desc: '支援種別人件費割合（公定価格基準。例: 就労B型は0.5700、生活介護は0.6100。地域区分単価算出用）', status: 'added' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '1. 福祉制度',
      categoryDescription: '福祉制度で定められている値を管理するスキーマ群である。',
      physicalName: 'reward_items',
      tableType: '従属マスタ',
      logicalName: '加算・減算',
      description: '法令・報酬告示に基づく公定価格基準の基本報酬・体制加減算マスタ（給付費算定用）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '項目ID' },
        { name: 'service_type_id', desc: '所属支援種別ID' },
        { name: 'code', desc: 'サービス詳細コード（国保連給付費算定6桁コード。例: 521111: 送迎加算, 521121: 欠席時対応加算 など）' },
        { name: 'name', desc: 'サービス詳細名称' },
        { name: 'item_category', desc: '項目区分（base_reward: 基本報酬 / addition: 体制加算 / subtraction: 体制減算）', status: 'modified' },
        { name: 'calc_type', desc: '算定方式（fixed_units: 固定単位数 / rate_percent: 所定単位数×率 / conditional: 条件分岐算定）', status: 'added' },
        { name: 'unit_value', desc: '加減算単位数' },
        { name: 'calc_rate', desc: '定率算定率[%]' },
        { name: 'occurrence_type', desc: '発生単位（daily: 日次発生 / monthly: 月次発生）' },
        { name: 'monthly_limit_count', desc: '月間算定上限回数' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '1. 福祉制度',
      categoryDescription: '福祉制度で定められている値を管理するスキーマ群である。',
      physicalName: 'qualifications',
      tableType: '独立マスタ',
      logicalName: '資格',
      description: '給付費・加算算定や配置基準に関わる資格・研修の定義マスターデータ',
      columns: [
        { name: 'id', desc: '資格ID' },
        { name: 'code', desc: '職種区分コード（障害福祉指定体制届出2桁コード。例: 01: サービス管理責任者, 03: 社会福祉士, 13: 生活支援員 など）' },
        { name: 'name', desc: '資格・職種名称' },
        { name: 'category', desc: '資格区分' },
        { name: 'description', desc: '資格概要' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '1. 福祉制度',
      categoryDescription: '福祉制度で定められている値を管理するスキーマ群である。',
      physicalName: 'staff_roles',
      tableType: '独立マスタ',
      logicalName: '職種',
      description: '法令に基づく障害福祉サービス等の人員配置基準および加算対象となる職種の定義マスターデータ',
      status: 'added',
      columns: [
        { name: 'id', desc: '職種ID', status: 'added' },
        { name: 'code', desc: '職種コード（公定2桁コード。01: 管理者, 02: サービス管理責任者, 03: 職業指導員, 04: 生活支援員, 05: 目標工賃達成指導員 等）', status: 'added' },
        { name: 'name', desc: '職種名称', status: 'added' },
        { name: 'category', desc: '職種区分（必置職種 / 加算職種 / 関連職種）', status: 'added' },
        { name: 'is_direct_care', desc: '直接処遇職員フラグ（常勤換算比率の対象となる職種か否か）', status: 'added' },
        { name: 'description', desc: '職種概要・役割説明', status: 'added' },
        { name: 'sort_order', desc: '表示並び順', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '1. 福祉制度',
      categoryDescription: '福祉制度で定められている値を管理するスキーマ群である。',
      physicalName: 'regional_grade_rates',
      tableType: '独立マスタ',
      logicalName: '所在地級数上乗せ割合',
      description: '障害福祉サービス公定の級地（1級地〜7級地、その他）および上乗せ割合マスタ（地域手当準拠）',
      status: 'added',
      columns: [
        { name: 'id', desc: '上乗せ割合ID', status: 'added' },
        { name: 'grade', desc: '級地名称（例: 1級地〜7級地、その他）', status: 'added' },
        { name: 'premium_rate', desc: '上乗せ割合（公務員地域手当準拠。例: 0.2000〜0.0000）', status: 'added' },
        { name: 'display_order', desc: '表示順', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '1. 福祉制度',
      categoryDescription: '福祉制度で定められている値を管理するスキーマ群である。',
      physicalName: 'regional_grade_locations',
      tableType: '独立マスタ',
      logicalName: '所在地級数所在地',
      description: '市区町村ごとの障害福祉サービス所在地級数（級地）対応マスタ',
      status: 'added',
      columns: [
        { name: 'id', desc: '所在地ID', status: 'added' },
        { name: 'prefecture', desc: '都道府県名（例: 広島県）', status: 'added' },
        { name: 'city', desc: '市区町村名（例: 広島市、安芸郡府中町）', status: 'added' },
        { name: 'grade', desc: '級地名称（FK: regional_grade_rates.grade）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.1. 概要',
      physicalName: 'organizations',
      tableType: '独立マスタ',
      logicalName: '法人',
      description: '運営法人・事業本部の基本情報（法人名・代表者名・法人番号・集計有効期間等）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '法人ID' },
        { name: 'name', desc: '法人名（例: 社会福祉法人〇〇会、特定非営利活動法人〇〇、一般社団法人〇〇等）' },
        { name: 'representative_name', desc: '代表者職・氏名（例: 理事長 〇〇 〇〇）' },
        { name: 'corporate_number', desc: '法人番号（13桁）' },
        { name: 'valid_from', desc: '設立日（運営開始・法人設立年月日）', status: 'added' },
        { name: 'valid_to', desc: '解散日（運営終了・解散年月日。NULL: 運営中・無期限）', status: 'added' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.1. 概要',
      physicalName: 'offices',
      tableType: '独立マスタ',
      logicalName: '事業所',
      description: '法人が運営する各事業所の基本情報（多機能型事業所対応・集計有効期間管理）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '事業所ID' },
        { name: 'code', desc: '事業所コード' },
        { name: 'name', desc: '事業所名（正式名称）' },
        { name: 'short_name', desc: '通称（サイドバー等表示用略称）' },
        { name: 'valid_from', desc: '開設日（開設・指定年月日）', status: 'added' },
        { name: 'valid_to', desc: '廃止日（廃止年月日。NULL: 運営中・継続中）', status: 'added' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.1. 概要',
      physicalName: 'office_service_type_setting_summaries',
      tableType: '従属マスタ',
      logicalName: '事業所支援種別割当概要',
      description: '事業所が指定を受けて実施する支援種別セットの適用期間・履歴管理（多機能型事業所等の年度・指定変更対応。「支援種別」タブで管理）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '概要ID' },
        { name: 'office_id', desc: '事業所ID（FK -> offices.id）' },
        { name: 'valid_from', desc: '適用開始日（指定・適用開始年月日）' },
        { name: 'valid_to', desc: '適用終了日（指定・適用終了年月日。NULL: 継続中）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.1. 概要',
      physicalName: 'office_service_type_setting_details',
      tableType: '従属マスタ',
      logicalName: '事業所支援種別割当詳細',
      description: '事業所支援種別割当概要に紐づく個別の指定支援種別設定（定員・人員配置・報酬区分等。「支援種別」タブで管理）',
      status: 'added',
      columns: [
        { name: 'id', desc: '詳細ID' },
        { name: 'summary_id', desc: '概要ID（FK -> office_service_type_setting_summaries.id）' },
        { name: 'service_type_id', desc: '支援種別ID（FK -> service_types.id）' },
        { name: 'capacity', desc: '利用定員（人）' },
        { name: 'office_number', desc: '指定事業所番号（都道府県等から付与された10桁コード。国保連請求・代理受領通知書用）' },
        { name: 'staffing_ratio', desc: '人員配置基準区分（7.5:1 / 10:1。基本報酬の単位数決定用）' },
        { name: 'wage_achievement_tier', desc: '平均工賃月額達成区分（前年度平均工賃実績区分。基本報酬単位数決定用）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.1. 概要',
      physicalName: 'office_reward_setting_summaries',
      tableType: '従属マスタ',
      logicalName: '事業所加算・減算割当概要',
      description: '各事業所における加算・減算割当の有効年月・適用期間の管理（加算・減算項目セットの履歴管理）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '概要ID', status: 'added' },
        { name: 'office_id', desc: '事業所ID（officesのIDを参照）', status: 'added' },
        { name: 'service_type_id', desc: '支援種別ID（service_typesのIDを参照）', status: 'added' },
        { name: 'valid_from', desc: '有効期間（開始）', status: 'added' },
        { name: 'valid_to', desc: '有効期間（終了。NULL: 継続中）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.1. 概要',
      physicalName: 'office_reward_setting_details',
      tableType: '従属マスタ',
      logicalName: '事業所加算・減算割当詳細',
      description: '事業所加算・減算割当概要に紐づく対象加算・減算項目の一覧（セットを構成する各項目）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '詳細ID', status: 'added' },
        { name: 'summary_id', desc: '概要ID（office_reward_setting_summariesのIDを参照）', status: 'added' },
        { name: 'reward_item_id', desc: '加算・減算項目ID（reward_itemsのIDを参照）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.2. 取引先',
      physicalName: 'partners',
      tableType: '独立マスタ',
      logicalName: '取引先',
      description: '取引先情報',
      columns: [
        { name: 'id', desc: '取引先ID' },
        { name: 'code', desc: '取引先コード' },
        { name: 'name', desc: '取引先・企業名' },
        { name: 'yomigana', desc: 'ふりがな' },
        { name: 'is_customer', desc: '顧客フラグ' },
        { name: 'is_subcontractor', desc: '外注先フラグ' },
        { name: 'is_other', desc: 'その他フラグ' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.2. 取引先',
      physicalName: 'partner_contacts',
      tableType: '従属マスタ',
      logicalName: '取引先担当者',
      description: '取引先ごとの担当者情報（1対多。電話・FAX・メールは割当テーブルにて管理）',
      columns: [
        { name: 'id', desc: '担当者ID' },
        { name: 'partner_id', desc: '取引先ID' },
        { name: 'name', desc: '担当者名' },
        { name: 'yomigana', desc: 'ふりがな' },
        { name: 'department', desc: '部署' },
        { name: 'position', desc: '役職' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.3. 運営体系',
      physicalName: 'wage_rate_items',
      tableType: '従属マスタ',
      logicalName: '工賃単価項目',
      description: '事業所に所属する工賃単価のマスターデータ（直持ち所属事業所IDで管理）',
      columns: [
        { name: 'id', desc: '工賃単価ID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'wage', desc: '工賃単価（円/時 または 円/日）' },
        { name: 'description', desc: '説明・摘要' },
        { name: 'sort_order', desc: '表示順序（昇順ソート用数値）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.3. 運営体系',
      physicalName: 'allowance_deduction_items',
      tableType: '従属マスタ',
      logicalName: '加算手当・控除項目',
      description: '事業所に所属する事業所独自規定の加算手当および控除項目のマスターデータ（直持ち所属事業所IDで管理）',
      columns: [
        { name: 'id', desc: '項目ID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'name', desc: '項目名（例: 資格手当、皆勤手当、食事代控除、送迎実費控除など）' },
        { name: 'item_category', desc: '項目分類区分（allowance: 加算手当 / deduction: 控除）' },
        { name: 'occurrence_type', desc: '頻度（daily: 日次 / monthly: 月次）' },
        { name: 'calc_trigger_basis', desc: '基準（manual, work_hours, attendance_days, absence_days, attendance_rate, absence_rate, meal_count, transport_round, transport_one_way, transport_outbound, transport_inbound）' },
        { name: 'threshold_value', desc: '基準値（数値）' },
        { name: 'threshold_unit', desc: '単位（hours: 時間 / days: 日 / percent: 率 / times: 回）' },
        { name: 'threshold_operator', desc: '範囲（gte: 以上 / lte: 以下 / gt: 超過 / lt: 未満 / eq: 一致）' },
        { name: 'unit_price', desc: '標準発生単価・金額（円）' },
        { name: 'sort_order', desc: '表示順序（昇順ソート用数値）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.3. 運営体系',
      physicalName: 'reserve_items',
      tableType: '従属マスタ',
      logicalName: '積立金項目',
      description: '事業所に所属する積立金のマスターデータ（工賃変動積立金、設備等修繕維持積立金など、直持ち所属事業所IDで管理。案件収益に対して定額/定率で設定）',
      columns: [
        { name: 'id', desc: '積立金ID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'name', desc: '積立金名' },
        { name: 'calc_type', desc: '計算方式区分（fixed_amount: 定額 / fixed_rate: 定率）' },
        { name: 'fixed_amount', desc: '定額金額（円）' },
        { name: 'fixed_rate', desc: '定率（%）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.3. 運営体系',
      physicalName: 'skill_categories',
      tableType: '従属マスタ',
      logicalName: 'スキルカテゴリ',
      description: 'スキルの分類カテゴリマスターデータ（親テーブル: skill_categories ↔ 子テーブル: skill_items の1対N関係）',
      columns: [
        { name: 'id', desc: 'カテゴリID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'name', desc: 'カテゴリ名' },
        { name: 'description', desc: 'カテゴリの説明' },
        { name: 'sort_order', desc: '表示順序（昇順ソート用数値）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.3. 運営体系',
      physicalName: 'skill_items',
      tableType: '従属マスタ',
      logicalName: 'スキル項目',
      description: '事業所に所属するスキルのマスターデータ（タスクおよび利用者に紐付け、直持ち所属事業所IDで管理）',
      columns: [
        { name: 'id', desc: 'スキルID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'category_id', desc: 'スキルカテゴリID（skill_categories参照、NULL可）' },
        { name: 'name', desc: 'スキル名' },
        { name: 'description', desc: 'スキルの説明' },
        { name: 'sort_order', desc: '表示順序（昇順ソート用数値）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '2. 法人・事業所',
      subCategory: '2.3. 運営体系',
      physicalName: 'skill_level_items',
      tableType: '従属マスタ',
      logicalName: 'スキルレベル項目',
      description: '事業所に所属するスキルレベルの定義マスターデータ（直持ち所属事業所IDで管理）',
      columns: [
        { name: 'id', desc: 'スキルレベルID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'level_value', desc: 'レベル数値' },
        { name: 'description', desc: 'レベルの説明' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.1. アカウント',
      physicalName: 'auth_users',
      tableType: '独立マスタ',
      logicalName: '認証ユーザー',
      description: 'Supabase Authと連携するシステム全ユーザーのアカウント認証情報',
      columns: [
        { name: 'id', desc: 'ユーザーID' },
        { name: 'email', desc: 'メールアドレス' },
        { name: 'role', desc: '権限ロール' },
        { name: 'user_type', desc: 'ユーザー種別（staff/member）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.2. 職員',
      physicalName: 'staffs',
      tableType: '従属マスタ',
      logicalName: '職員',
      description: 'システムを利用する職員情報',
      columns: [
        { name: 'id', desc: '職員ID' },
        { name: 'user_id', desc: '認証ユーザーID' },
        { name: 'code', desc: '職員コード' },
        { name: 'name', desc: '職員名' },
        { name: 'yomigana', desc: 'ふりがな' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.2. 職員',
      physicalName: 'staff_qualification_settings',
      tableType: '従属マスタ',
      logicalName: '職員資格割当',
      description: '職員が保有する資格・登録番号・取得日・更新研修期限情報',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'staff_id', desc: '職員ID' },
        { name: 'qualification_id', desc: '資格ID' },
        { name: 'license_number', desc: '資格・登録番号' },
        { name: 'acquired_on', desc: '取得年月日・修了日' },
        { name: 'valid_until', desc: '有効期限・更新研修期限' },
        { name: 'is_primary', desc: '主要資格フラグ（true: 主要資格 / false: サブ資格）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.2. 職員',
      physicalName: 'office_staff_setting_summaries',
      tableType: '従属マスタ',
      logicalName: '事業所職員割当概要',
      description: '各事業所における職員配属・所属期間の履歴管理（「事業所」タブで管理）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '概要ID' },
        { name: 'office_id', desc: '事業所ID（FK -> offices.id）' },
        { name: 'valid_from', desc: '所属開始日（配属・所属開始年月日）' },
        { name: 'valid_to', desc: '所属終了日（配属・所属終了年月日。NULL: 継続中）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.2. 職員',
      physicalName: 'office_staff_setting_details',
      tableType: '従属マスタ',
      logicalName: '事業所職員割当詳細',
      description: '事業所職員割当概要に紐づく職員の個別所属割当（複数事業所兼務・所属定義対応。「事業所」タブで管理）',
      status: 'added',
      columns: [
        { name: 'id', desc: '詳細ID' },
        { name: 'summary_id', desc: '概要ID（FK -> office_staff_setting_summaries.id）' },
        { name: 'staff_id', desc: '職員ID（FK -> staffs.id）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.2. 職員',
      physicalName: 'staff_role_setting_summaries',
      tableType: '従属マスタ',
      logicalName: '職員職種割当概要',
      description: '事業所職員割当詳細（親）に紐づく雇用形態・勤務区分・所定時間および適用期間の履歴管理（「職種」タブで管理）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '概要ID' },
        { name: 'office_staff_setting_id', desc: '事業所職員割当詳細ID（FK -> office_staff_setting_details.id）', status: 'modified' },
        { name: 'employment_type', desc: '雇用形態（full_time: 常勤 / part_time: 非常勤。常勤換算算定用）' },
        { name: 'duty_type', desc: '勤務区分（dedicated: 専従 / concurrent: 兼務）' },
        { name: 'weekly_working_hours', desc: '週所定労働時間（常勤換算数[FTE]計算用。例: 40.0時間）' },
        { name: 'valid_from', desc: '有効期間（開始）' },
        { name: 'valid_to', desc: '有効期間（終了。NULL: 継続中）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.2. 職員',
      physicalName: 'staff_role_setting_details',
      tableType: '従属マスタ',
      logicalName: '職員職種割当詳細',
      description: '職員職種割当概要に紐づく個別の配置職種区分（1人の職員による複数職種の兼務に対応。「職種」タブで管理）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '詳細ID' },
        { name: 'summary_id', desc: '概要ID（staff_role_setting_summariesのIDを参照）' },
        { name: 'staff_role_id', desc: '職種ID（FK -> staff_roles.id）', status: 'added' },
        { name: 'staff_role', desc: '配置職種区分コード（公定2桁コード。01: 管理者, 02: サービス管理責任者 等。staff_roles.codeと連動）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.2. 職員',
      physicalName: 'staff_basic_schedules',
      tableType: '従属マスタ',
      logicalName: '職員基本勤務予定',
      description: '曜日（日〜土）ごとの職員の定例勤務パターン（勤務曜日・標準出退勤時刻・休憩・所定時間）。日報（勤務記録）の初期自動セット基準',
      status: 'added',
      columns: [
        { name: 'id', desc: '基本勤務予定ID', status: 'added' },
        { name: 'office_id', desc: '所属事業所ID（FK -> offices.id）', status: 'added' },
        { name: 'staff_id', desc: '職員ID（FK -> staffs.id）', status: 'added' },
        { name: 'day_of_week', desc: '曜日番号（0: 日曜日 〜 6: 土曜日）', status: 'added' },
        { name: 'is_work_day', desc: '定例勤務フラグ（true: 勤務日 / false: 公休・法定休日）', status: 'added' },
        { name: 'start_time', desc: '基本始業時刻（出勤時刻。例: 08:30）', status: 'added' },
        { name: 'end_time', desc: '基本終業時刻（退勤時刻。例: 17:30）', status: 'added' },
        { name: 'break_minutes', desc: '基本休憩時間（分。例: 60）', status: 'added' },
        { name: 'scheduled_hours', desc: '基本所定労働時間（時間数。始業・終業時刻および休憩時間から自動算出。例: 8.00）', status: 'added' },
        { name: 'remarks', desc: '備考・定例勤務パターンメモ（例: 早番、遅番、通常、時短等）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.3. 利用者',
      physicalName: 'members',
      tableType: '従属マスタ',
      logicalName: '利用者',
      description: '案件に参加する利用者基本情報',
      columns: [
        { name: 'id', desc: '利用者ID' },
        { name: 'user_id', desc: '認証ユーザーID' },
        { name: 'code', desc: '利用者コード' },
        { name: 'name', desc: '利用者名' },
        { name: 'yomigana', desc: 'ふりがな' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.3. 利用者',
      physicalName: 'member_recipient_certificates',
      tableType: '従属マスタ',
      logicalName: '利用者受給者証',
      description: '利用者の受給者証情報（受給者証番号・交付市町村・負担上限月額・所得階層区分・障害支援区分・支給決定期間等）の履歴管理マスタ',
      columns: [
        { name: 'id', desc: '履歴ID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'certificate_number', desc: '受給者証番号（10桁）' },
        { name: 'issuing_municipality', desc: '交付市町村' },
        { name: 'income_category', desc: '所得階層区分（welfare: 生活保護 / low_income: 低所得 / general_1: 一般1 / general_2: 一般2）' },
        { name: 'copayment_limit_amount', desc: '負担上限月額（円）' },
        { name: 'disability_support_class', desc: '障害支援区分（none: 区分なし / class_1〜class_6）' },
        { name: 'copayment_management_type', desc: '上限額管理区分（self_internal: 自法人 / other: 他法人 / none: なし）' },
        { name: 'copayment_office_id', desc: '自法人内の上限額管理事業所ID（FK -> offices.id）' },
        { name: 'copayment_office_code', desc: '他法人管理事業所番号（10桁）' },
        { name: 'copayment_office_name', desc: '他法人管理事業所名' },
        { name: 'valid_from', desc: '支給決定開始日' },
        { name: 'valid_to', desc: '支給決定終了日' },
        { name: 'remarks', desc: '備考・特記事項' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.3. 利用者',
      physicalName: 'office_member_setting_summaries',
      tableType: '従属マスタ',
      logicalName: '事業所利用者割当概要',
      description: '各事業所における利用者の在籍・利用契約期間の履歴管理（「事業所」タブで管理）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '概要ID' },
        { name: 'office_id', desc: '事業所ID（FK -> offices.id）' },
        { name: 'valid_from', desc: '契約開始日（利用契約・在籍開始年月日）' },
        { name: 'valid_to', desc: '契約終了日（利用契約・在籍終了年月日。NULL: 継続中）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.3. 利用者',
      physicalName: 'office_member_setting_details',
      tableType: '従属マスタ',
      logicalName: '事業所利用者割当詳細',
      description: '事業所利用者割当概要に紐づく利用者の個別割当（多拠点利用対応。「事業所」タブで管理）',
      status: 'added',
      columns: [
        { name: 'id', desc: '詳細ID' },
        { name: 'summary_id', desc: '概要ID（FK -> office_member_setting_summaries.id）' },
        { name: 'member_id', desc: '利用者ID（FK -> members.id）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.3. 利用者',
      physicalName: 'member_skill_setting_summaries',
      tableType: '従属マスタ',
      logicalName: '利用者スキル割当概要',
      description: '利用者ごとのスキル評価履歴期間を管理（「スキル」タブで管理）',
      status: 'added',
      columns: [
        { name: 'id', desc: '概要ID' },
        { name: 'member_id', desc: '利用者ID（FK -> members.id）' },
        { name: 'valid_from', desc: '有効期間（開始）' },
        { name: 'valid_to', desc: '有効期間（終了。NULL: 継続中）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.3. 利用者',
      physicalName: 'member_skill_setting_details',
      tableType: '従属マスタ',
      logicalName: '利用者スキル割当詳細',
      description: '利用者スキル割当概要に紐づく各スキル項目の到達レベル評価（「スキル」タブで管理）',
      status: 'added',
      columns: [
        { name: 'id', desc: '詳細ID' },
        { name: 'summary_id', desc: '概要ID（FK -> member_skill_setting_summaries.id）' },
        { name: 'skill_id', desc: 'スキル項目ID（FK -> skill_items.id）' },
        { name: 'skill_level_id', desc: 'スキルレベルID（FK -> skill_level_items.id）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.3. 利用者',
      physicalName: 'member_wage_settings',
      tableType: '従属マスタ',
      logicalName: '利用者工賃単価割当',
      description: '利用者の工賃単価評価・割当履歴（適用期間別の単価履歴を管理）',
      columns: [
        { name: 'id', desc: '割当履歴ID' },
        { name: 'member_id', desc: '利用者ID（FK -> members.id）' },
        { name: 'wage_rate_id', desc: '工賃単価ID（FK -> wage_rate_items.id）' },
        { name: 'start_period', desc: '適用開始年月（YYYY-MM、当月1日より適用）' },
        { name: 'end_period', desc: '適用終了年月（YYYY-MM、NULL: 適用継続中・無期限）' },
        { name: 'remarks', desc: '改定理由・備考（定期昇給、能力評価見直し、規程改定等）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '3. アカウントとユーザー',
      subCategory: '3.3. 利用者',
      physicalName: 'member_basic_schedules',
      tableType: '従属マスタ',
      logicalName: '利用者基本利用予定',
      description: '曜日（日〜土）ごとの利用者の定例通所パターン（通所曜日・標準提供時間・食事利用・送迎利用）。日報（利用記録）の初期自動セット基準',
      status: 'added',
      columns: [
        { name: 'id', desc: '基本利用予定ID', status: 'added' },
        { name: 'office_id', desc: '対象事業所ID（FK -> offices.id）', status: 'added' },
        { name: 'member_id', desc: '利用者ID（FK -> members.id）', status: 'added' },
        { name: 'day_of_week', desc: '曜日番号（0: 日曜日 〜 6: 土曜日）', status: 'added' },
        { name: 'is_scheduled', desc: '定例利用フラグ（true: 毎週通所利用日 / false: 非通所日・休み）', status: 'added' },
        { name: 'status', desc: '定例出欠区分（present: 通所 / offsite: 施設外就労 / remote: 在宅利用 等）', status: 'added' },
        { name: 'start_time', desc: '基本サービス開始時刻（通所時刻。例: 09:30）', status: 'added' },
        { name: 'end_time', desc: '基本サービス終了時刻（退所時刻。例: 15:30）', status: 'added' },
        { name: 'break_minutes', desc: '基本休憩時間（分。例: 60）', status: 'added' },
        { name: 'service_hours', desc: '基本サービス提供時間（時間数。開始・終了時刻および休憩時間から自動算出。例: 5.00）', status: 'added' },
        { name: 'has_meal', desc: '定例食事利用フラグ（true: 昼食あり / false: なし）', status: 'added' },
        { name: 'has_pickup', desc: '定例送迎（往路・迎え）利用フラグ', status: 'added' },
        { name: 'has_dropoff', desc: '定例送迎（復路・送り）利用フラグ', status: 'added' },
        { name: 'remarks', desc: '備考・週間通所計画メモ', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '4. 連絡先',
      physicalName: 'addresses',
      tableType: '独立マスタ',
      logicalName: '住所',
      description: '所在地・住所情報の実体データマスタ（重複防止・名寄せ一元管理）',
      columns: [
        { name: 'id', desc: '住所ID' },
        { name: 'postal_code_prefix', desc: '郵便番号上3桁' },
        { name: 'postal_code_suffix', desc: '郵便番号下4桁' },
        { name: 'prefecture', desc: '都道府県' },
        { name: 'city', desc: '市区町村・郡' },
        { name: 'town_street', desc: '町名・丁目・番地' },
        { name: 'building', desc: '建物名・部屋番号' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '4. 連絡先',
      physicalName: 'entity_address_settings',
      tableType: '従属マスタ',
      logicalName: '住所割当',
      description: '法人・事業所・利用者・職員・取引先等と住所の多対多割当・属性管理マスタ',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'owner_type', desc: '所有エンティティ種別（organization: 法人 / office: 事業所 / member: 利用者 / staff: 職員 / partner: 取引先）' },
        { name: 'owner_id', desc: '所有エンティティID' },
        { name: 'address_id', desc: '住所ID' },
        { name: 'address_type', desc: '住所種別（main: 所在地・本社 / home: 自宅 / billing: 請求先 / shipping: 納品先）' },
        { name: 'is_primary', desc: '主たる住所フラグ（true: メイン住所 / false: サブ住所）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '4. 連絡先',
      physicalName: 'phone_numbers',
      tableType: '独立マスタ',
      logicalName: '電話・FAX番号',
      description: '電話・携帯・FAX番号の実体データマスタ（数字のみ正規化保持・重複防止）',
      columns: [
        { name: 'id', desc: '電話番号ID' },
        { name: 'phone_type', desc: '電話種別（phone: 固定電話 / mobile: 携帯電話 / fax: FAX）' },
        { name: 'phone_number', desc: '電話番号（ハイフンなし数字のみ正規化保持）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '4. 連絡先',
      physicalName: 'entity_phone_settings',
      tableType: '従属マスタ',
      logicalName: '電話・FAX番号割当',
      description: '事業所・利用者・職員・取引先等と電話・携帯・FAX番号の多対多割当・属性管理マスタ',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'owner_type', desc: '所有エンティティ種別（organization: 法人 / office: 事業所 / member: 利用者 / staff: 職員 / partner: 取引先）' },
        { name: 'owner_id', desc: '所有エンティティID' },
        { name: 'phone_number_id', desc: '電話番号ID' },
        { name: 'label', desc: 'ラベル・窓口名（例: 本部代表、直通、保護者携帯、緊急窓口等）' },
        { name: 'is_emergency', desc: '緊急連絡先フラグ（true: 緊急連絡先 / false: 通常連絡先）' },
        { name: 'is_primary', desc: '優先連絡先フラグ（true: 優先連絡先 / false: サブ連絡先）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '4. 連絡先',
      physicalName: 'email_addresses',
      tableType: '独立マスタ',
      logicalName: 'メールアドレス',
      description: '電子メールアドレスの実体データマスタ（RFC規格・小文字正規化保持・重複防止）',
      columns: [
        { name: 'id', desc: 'メールアドレスID' },
        { name: 'email', desc: 'メールアドレス（RFC規格・小文字正規化保持）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '4. 連絡先',
      physicalName: 'entity_email_settings',
      tableType: '従属マスタ',
      logicalName: 'メールアドレス割当',
      description: '事業所・利用者・職員・取引先等とメールアドレスの多対多割当・属性管理マスタ',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'owner_type', desc: '所有エンティティ種別（organization: 法人 / office: 事業所 / member: 利用者 / staff: 職員 / partner: 取引先）' },
        { name: 'owner_id', desc: '所有エンティティID' },
        { name: 'email_address_id', desc: 'メールアドレスID' },
        { name: 'label', desc: 'ラベル・用途名（例: 連絡用、請求書用、保護者宛等）' },
        { name: 'is_emergency', desc: '緊急連絡先フラグ（true: 緊急連絡先 / false: 通常連絡先）' },
        { name: 'is_primary', desc: '優先連絡先フラグ（true: 優先連絡先 / false: サブ連絡先）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '5. 案件',
      physicalName: 'projects',
      tableType: '従属マスタ',
      logicalName: '案件',
      description: '案件基本情報（事業所ごとに管理・実施期間別の集計管理）',
      status: 'modified',
      columns: [
        { name: 'id', desc: '案件ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'settlement_year_month', desc: '精算年月' },
        { name: 'start_date', desc: '着手日（案件開始・着手年月日）', status: 'added' },
        { name: 'end_date', desc: '完了日（案件終了・完了予定年月日。NULL: 進行中）', status: 'added' },
        { name: 'client_id', desc: '紐づく取引先ID' },
        { name: 'code', desc: '案件コード' },
        { name: 'name', desc: '案件名' },
        { name: 'project_type', desc: '案件種別' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '5. 案件',
      physicalName: 'project_tasks',
      tableType: '従属マスタ',
      logicalName: '案件タスク',
      description: '案件内の各タスク情報',
      columns: [
        { name: 'id', desc: 'タスクID' },
        { name: 'completed_at', desc: '完了日時' },
        { name: 'project_id', desc: '案件ID' },
        { name: 'name', desc: 'タスク名' },
        { name: 'assignee_type', desc: '担当者区分（内部/外部等）' },
        { name: 'is_completed', desc: '完了フラグ' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '5. 案件',
      physicalName: 'task_skill_settings',
      tableType: '従属マスタ',
      logicalName: 'タスクスキル割当',
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
      category: '5. 案件',
      physicalName: 'task_assignee_settings',
      tableType: '従属マスタ',
      logicalName: 'タスク担当者割当',
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
      category: '5. 案件',
      physicalName: 'project_budgets',
      tableType: '従属マスタ',
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
      category: '6. 日次実績の記録',
      subCategory: '6.1. 職員の予定と実績',
      physicalName: 'staff_exception_schedules',
      tableType: 'レコード',
      logicalName: '職員例外勤務予定',
      description: '日別の職員勤務例外（有休・特別休暇・シフト振替・勤務時間変更）。日報（勤務記録）の自動セット時に基本予定より優先適用',
      status: 'added',
      columns: [
        { name: 'id', desc: '例外勤務予定ID', status: 'added' },
        { name: 'office_id', desc: '勤務事業所ID（FK -> offices.id）', status: 'added' },
        { name: 'staff_id', desc: '職員ID（FK -> staffs.id）', status: 'added' },
        { name: 'target_date', desc: '対象年月日（特定の対象日。YYYY-MM-DD）', status: 'added' },
        { name: 'is_work_day', desc: '当日勤務フラグ（true: 勤務日 / false: 休み・休暇）', status: 'added' },
        { name: 'start_time', desc: '変更後始業時刻（出勤時刻。休みの場合はNULL。例: 08:30）', status: 'added' },
        { name: 'end_time', desc: '変更後終業時刻（退勤時刻。休みの場合はNULL。例: 17:30）', status: 'added' },
        { name: 'break_minutes', desc: '変更後休憩時間（分。例: 60）', status: 'added' },
        { name: 'scheduled_hours', desc: '変更後所定労働時間（時間数。始業・終業時刻および休憩時間から自動算出。例: 8.00）', status: 'added' },
        { name: 'remarks', desc: '備考・変更理由メモ（例: 有休取得、シフト振替、研修参加、時短等）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '6. 日次実績の記録',
      subCategory: '6.1. 職員の予定と実績',
      physicalName: 'staff_attendance_records',
      tableType: 'レコード',
      logicalName: '職員勤務実績',
      description: '職員の日次の勤務・出退勤・勤務事業所・現場配置職種・実労働時間記録',
      status: 'modified',
      columns: [
        { name: 'id', desc: '勤務記録ID' },
        { name: 'office_id', desc: '勤務事業所ID' },
        { name: 'staff_id', desc: '職員ID' },
        { name: 'work_date', desc: '勤務日' },
        { name: 'start_time', desc: '出勤時刻' },
        { name: 'end_time', desc: '退勤時刻' },
        { name: 'break_minutes', desc: '休憩時間（分）' },
        { name: 'actual_work_hours', desc: '実労働時間（時間数。出退勤時刻および休憩時間から自動算出。常勤換算や人員配置基準判定用）', status: 'added' },
        { name: 'assigned_role', desc: '配置職種・役割（サービス管理責任者/生活支援員/職業指導員など）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '6. 日次実績の記録',
      subCategory: '6.2. 利用者の予定と実績',
      physicalName: 'member_exception_schedules',
      tableType: 'レコード',
      logicalName: '利用者例外利用予定',
      description: '日別の利用者利用予定変更（通所日振替・事前欠席届・通院時間変更・臨時送迎/食事変更）。日報（利用記録）の自動セット時に基本予定より優先適用',
      status: 'added',
      columns: [
        { name: 'id', desc: '例外利用予定ID', status: 'added' },
        { name: 'office_id', desc: '対象事業所ID（FK -> offices.id）', status: 'added' },
        { name: 'member_id', desc: '利用者ID（FK -> members.id）', status: 'added' },
        { name: 'target_date', desc: '対象年月日（特定の対象日。YYYY-MM-DD）', status: 'added' },
        { name: 'is_scheduled', desc: '当日利用フラグ（true: 利用あり / false: 休み・事前欠席）', status: 'added' },
        { name: 'status', desc: '当日出欠区分（present: 通所 / offsite: 施設外就労 / remote: 在宅利用 等）', status: 'added' },
        { name: 'start_time', desc: '変更後サービス開始時刻（通所時刻。例: 10:00）', status: 'added' },
        { name: 'end_time', desc: '変更後サービス終了時刻（退所時刻。例: 14:00）', status: 'added' },
        { name: 'break_minutes', desc: '変更後休憩時間（分。例: 60）', status: 'added' },
        { name: 'service_hours', desc: '当日サービス提供時間（時間数。開始・終了時刻および休憩時間から自動算出。例: 3.00）', status: 'added' },
        { name: 'has_meal', desc: '当日食事利用フラグ（true: 昼食あり / false: なし）', status: 'added' },
        { name: 'has_pickup', desc: '当日送迎（往路・迎え）利用フラグ', status: 'added' },
        { name: 'has_dropoff', desc: '当日送迎（復路・送り）利用フラグ', status: 'added' },
        { name: 'remarks', desc: '備考・変更理由メモ（例: 通院のため遅刻早退、祝日振替利用、体調不良連絡等）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '6. 日次実績の記録',
      subCategory: '6.2. 利用者の予定と実績',
      physicalName: 'member_attendance_records',
      tableType: 'レコード',
      logicalName: '利用者出欠実績',
      description: '利用者の日々の出欠・通所・提供時間帯（開始/終了/休憩）・欠席連絡・加算判定（送迎・食事・訪問・施設外就労）記録',
      status: 'modified',
      columns: [
        { name: 'id', desc: '出欠記録ID' },
        { name: 'office_id', desc: '対象事業所ID' },
        { name: 'target_period', desc: '利用予定日（対象日）' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'status', desc: '出欠区分（present: 通所 / absent: 欠席）' },
        { name: 'start_time', desc: 'サービス提供開始時刻（通所時刻）', status: 'added' },
        { name: 'end_time', desc: 'サービス提供終了時刻（退所時刻）', status: 'added' },
        { name: 'break_minutes', desc: '休憩時間（分）', status: 'added' },
        { name: 'service_hours', desc: '実サービス提供時間（時間数。開始・終了時刻および休憩時間から自動算出。短時間利用減算や報酬告示上の提供時間確認用）', status: 'added' },
        { name: 'contact_date', desc: '欠席連絡日（連絡受付日：利用予定日との日数差で加算判定）' },
        { name: 'is_absentee_supported', desc: '欠席時対応加算適用フラグ（連絡日より自動判定＋相談援助実績・手動上書き管理用）' },
        { name: 'has_meal', desc: '食事利用フラグ' },
        { name: 'has_pickup', desc: '送迎（往路）利用フラグ' },
        { name: 'has_dropoff', desc: '送迎（復路）利用フラグ' },
        { name: 'is_visit_supported', desc: '訪問支援加算フラグ（欠席時に居宅等を訪問して相談援助を実施した場合に算定）', status: 'added' },
        { name: 'is_trial_use', desc: '体験利用支援加算フラグ（特別支援学校等の生徒が体験利用した場合に算定）', status: 'added' },
        { name: 'is_offsite_work', desc: '施設外就労・施設外支援フラグ（事業所外で就労・個別支援を実施した場合の加算・減算確認用）', status: 'added' },
        { name: 'remarks', desc: '備考・欠席理由/連絡・相談援助内容' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '6. 日次実績の記録',
      subCategory: '6.2. 利用者の予定と実績',
      physicalName: 'member_work_records',
      tableType: 'レコード',
      logicalName: '利用者作業実績',
      description: '利用者のタスクごとの日次作業時間・作業場所記録',
      status: 'modified',
      columns: [
        { name: 'id', desc: '作業記録ID' },
        { name: 'office_id', desc: '作業実施事業所ID' },
        { name: 'target_period', desc: '対象時期・作業日' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'work_time', desc: '作業時間' },
        { name: 'work_location_id', desc: '作業場所（取引先ID。施設外就労先企業等。未設定時は自事業所または未指定）', status: 'added' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '6. 日次実績の記録',
      subCategory: '6.2. 利用者の予定と実績',
      physicalName: 'allowance_deduction_records',
      tableType: 'レコード',
      logicalName: '加算手当・控除実績',
      description: '日次発生の加算手当・控除記録（例: 送迎利用、資格手当、昼食利用、物品購入費等）',
      columns: [
        { name: 'id', desc: '手当・控除記録ID' },
        { name: 'target_period', desc: '対象時期・日付' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'item_id', desc: '手当・控除項目ID（allowance_deduction_itemsのIDを参照）' },
        { name: 'quantity', desc: '数量・回数' },
        { name: 'unit_price', desc: '発生時単価' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '6. 日次実績の記録',
      subCategory: '6.3. 確定',
      physicalName: 'daily_record_closings',
      tableType: 'レコード',
      logicalName: '日次実績確定',
      description: '作業日ごとの確定状態および確定履歴',
      columns: [
        { name: 'id', desc: '確定ID' },
        { name: 'target_period', desc: '対象時期・作業日' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'is_confirmed', desc: '確定フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '7. 月次実績の記録',
      subCategory: '7.1. 案件ごとの収支',
      physicalName: 'general_financial_records',
      tableType: 'レコード',
      logicalName: '一般収支実績',
      description: '日々の出入金、材料費購入、経費発生、売上請求などの一般収支明細データ',
      columns: [
        { name: 'id', desc: '一般収支記録ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'target_period', desc: '対象時期・取引日' },
        { name: 'project_id', desc: '関連案件ID' },
        { name: 'client_id', desc: '関連取引先ID' },
        { name: 'subject', desc: '勘定科目・摘要' },
        { name: 'amount', desc: '金額' },
        { name: 'type', desc: '区分（revenue: 収益 / expense: 費用 / reserve: 積立金）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '7. 月次実績の記録',
      subCategory: '7.1. 案件ごとの収支',
      physicalName: 'incentive_records',
      tableType: 'レコード',
      logicalName: 'インセンティブ実績',
      description: '案件タスクの成果・貢献度に応じた各利用者の月次分配記録',
      columns: [
        { name: 'id', desc: '記録ID' },
        { name: 'target_period', desc: '対象時期(YYYY-MM)' },
        { name: 'member_id', desc: '分配先利用者ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'allocation_amount', desc: '分配金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '7. 月次実績の記録',
      subCategory: '7.2. 確定',
      physicalName: 'monthly_record_closings',
      tableType: 'レコード',
      logicalName: '月次実績確定',
      description: '対象年月ごとの実績・インセンティブ分配等の確定状態および確定履歴',
      columns: [
        { name: 'id', desc: '確定ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'target_period', desc: '対象時期(YYYY-MM)' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'is_confirmed', desc: '確定フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '8. 集計結果の記録',
      subCategory: '8.1. 工賃・控除以外の収支',
      physicalName: 'general_financial_details',
      tableType: 'スナップショット',
      logicalName: '一般収支明細',
      description: '締め時点で確定・集計保存された勘定科目別の決算収支データ（就労支援事業/福祉事業）',
      columns: [
        { name: 'id', desc: '明細ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'target_period', desc: '対象時期' },
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
    {
      category: '8. 集計結果の記録',
      subCategory: '8.2. 工賃・控除の収支',
      physicalName: 'wage_summaries',
      tableType: 'スナップショット',
      logicalName: '工賃・控除概要',
      description: '月ごとの各利用者の計算・支給工賃記録、サービス利用料控除額、およびその他控除概要（基幹親テーブル）',
      columns: [
        { name: 'id', desc: '概要ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'target_period', desc: '対象時期(YYYY-MM)' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'work_time', desc: '総作業時間' },
        { name: 'wage_rate', desc: '工賃単価' },
        { name: 'basic_wage', desc: '基本支給額' },
        { name: 'incentive_total', desc: 'インセンティブ合計' },
        { name: 'other_allowance_total', desc: 'その他加算手当合計' },
        { name: 'wage_total', desc: '工賃合計' },
        { name: 'service_fee_total', desc: 'サービス利用料総額（10割全額）' },
        { name: 'service_fee_copayment', desc: '実際に利用者が支払う額（サービス利用料控除額）' },
        { name: 'is_copayment_limit_applied', desc: '負担上限月額適用フラグ' },
        { name: 'managed_copayment_amount', desc: '上限額管理調整後負担額（複数事業所利用時の上限管理結果・調整後負担額）' },
        { name: 'deduction_total', desc: '控除合計' },
        { name: 'payment', desc: '差引支給額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '8. 集計結果の記録',
      subCategory: '8.2. 工賃・控除の収支',
      physicalName: 'incentive_details',
      tableType: 'スナップショット',
      logicalName: 'インセンティブ明細',
      description: '工賃確定時点のインセンティブ分配内訳スナップショット',
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
      category: '8. 集計結果の記録',
      subCategory: '8.2. 工賃・控除の収支',
      physicalName: 'allowance_deduction_details',
      tableType: 'スナップショット',
      logicalName: '加算手当・控除明細',
      description: '工賃確定時点のその他加算手当・控除内訳スナップショット',
      status: 'modified',
      columns: [
        { name: 'id', desc: '明細ID' },
        { name: 'summary_id', desc: '工賃・控除概要ID（FK -> wage_summaries.id）' },
        { name: 'item_id', desc: '項目ID（FK -> allowance_deduction_items.id）' },
        { name: 'item_category', desc: '項目区分（allowance: 加算手当, deduction: 控除）' },
        { name: 'item_name', desc: '項目名（手当名または控除名）' },
        { name: 'unit_price', desc: '単価' },
        { name: 'quantity', desc: '数量・日数' },
        { name: 'amount', desc: '金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      category: '8. 集計結果の記録',
      subCategory: '8.2. 工賃・控除の収支',
      physicalName: 'service_billing_summaries',
      tableType: 'スナップショット',
      logicalName: 'サービス費概要',
      description: '利用者ごとの月次サービス利用料全額（10割・総費用額）、利用者負担額（1割・上限月額判定）、および自治体請求額（9割・介護給付費等）の確定スナップショット',
      status: 'added',
      columns: [
        { name: 'id', desc: '概要ID', status: 'added' },
        { name: 'office_id', desc: '事業所ID', status: 'added' },
        { name: 'member_id', desc: '利用者ID', status: 'added' },
        { name: 'target_period', desc: '対象時期(YYYY-MM)', status: 'added' },
        { name: 'attendance_days', desc: '当月実利用日数（算定日数）', status: 'added' },
        { name: 'base_reward_units', desc: '基本報酬算定単位数（基本報酬×日数）', status: 'added' },
        { name: 'addition_units', desc: '加算単位数合計（送迎・食事・指導員配置・目標工賃等各種加算）', status: 'added' },
        { name: 'subtraction_units', desc: '減算単位数合計（定員超過減算・人員欠員減算・身体拘束未実施等）', status: 'added' },
        { name: 'total_units', desc: '総算定単位数（基本単位＋加算−減算）', status: 'added' },
        { name: 'unit_price', desc: '地域区分1単位単価（円）', status: 'added' },
        { name: 'total_cost_amount', desc: 'サービス費用総額（10割。総単位数 × 単価）', status: 'added' },
        { name: 'calculated_copayment_amount', desc: '利用者負担基準額（原則1割 = 10%）', status: 'added' },
        { name: 'copayment_limit_amount', desc: '利用者負担上限月額（受給者証記載の自己負担上限額。0円/9,300円/37,200円等）', status: 'added' },
        { name: 'final_copayment_amount', desc: '決定利用者自己負担額（基準額と上限月額の小さい方。実際に利用者が支払うサービス利用料）', status: 'added' },
        { name: 'benefit_billing_amount', desc: '国保連／自治体請求給付費（総額10割 − 決定自己負担額。原則9割相当）', status: 'added' },
        { name: 'actual_expense_amount', desc: '実費費用合計（食材料費・送迎燃料費・その他自己負担実費）', status: 'added' },
        { name: 'total_member_billed_amount', desc: '利用者総請求額（決定利用者負担額 ＋ 実費費用合計）', status: 'added' },
        { name: 'status', desc: '確定ステータス（draft: 計算中, confirmed: 月次締め確定済み）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      category: '8. 集計結果の記録',
      subCategory: '8.2. 工賃・控除の収支',
      physicalName: 'service_billing_details',
      tableType: 'スナップショット',
      logicalName: 'サービス費明細',
      description: 'サービス費集計の内訳明細スナップショット（基本報酬・送迎加算・食事提供加算・目標工賃達成加算等の個別項目算定ログ）',
      status: 'added',
      columns: [
        { name: 'id', desc: '明細ID', status: 'added' },
        { name: 'summary_id', desc: 'サービス費概要ID（service_billing_summariesのIDを参照）', status: 'added' },
        { name: 'reward_item_id', desc: '加減算・報酬項目ID（reward_itemsのIDを参照）', status: 'added' },
        { name: 'service_code', desc: '国保連サービス種類・項目コード（6桁コード）', status: 'added' },
        { name: 'item_name', desc: '算定項目名称', status: 'added' },
        { name: 'item_category', desc: '項目区分（base_reward / addition / subtraction）', status: 'added' },
        { name: 'unit_value', desc: '単位数（1回・1日あたり単価単位数）', status: 'added' },
        { name: 'count', desc: '算定回数・日数', status: 'added' },
        { name: 'total_item_units', desc: '算定単位数小計（単位数 × 回数）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' }
      ]
    },
    {
      category: '8. 集計結果の記録',
      subCategory: '8.3. 確定',
      physicalName: 'monthly_financial_closings',
      tableType: 'スナップショット',
      logicalName: '月次収支確定',
      description: '対象年月ごとの工賃計算確定および事業活動収支の締め確定状態および確定履歴',
      columns: [
        { name: 'id', desc: '確定ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'target_period', desc: '対象時期(YYYY-MM)' },
        { name: 'confirmed_at', desc: '確定日時' },
        { name: 'confirmed_by', desc: '確定職員ID' },
        { name: 'is_confirmed', desc: '確定フラグ' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    }
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
          <div>
            <table className="inventory-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>区分 (Type)</th>
                  <th style={{ width: '22%' }}>物理名 (Table Name)</th>
                  <th style={{ width: '20%' }}>論理名 (Logical Name)</th>
                  <th style={{ width: '20%' }}>カラム名</th>
                  <th style={{ width: '26%' }}>カラム説明</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let currentCategory = '';
                  let currentSubCategory = '';

                  const getCategoryStyle = (cat: string) => {
                    if (cat.startsWith('1.')) return { bg: '#eff6ff', text: '#1e40af', badgeBg: '#3b82f6', border: '#bfdbfe' };
                    if (cat.startsWith('2.')) return { bg: '#f0fdf4', text: '#166534', badgeBg: '#16a34a', border: '#bbf7d0' };
                    if (cat.startsWith('3.')) return { bg: '#fefce8', text: '#854d0e', badgeBg: '#ca8a04', border: '#fef08a' };
                    if (cat.startsWith('4.')) return { bg: '#faf5ff', text: '#6b21a8', badgeBg: '#9333ea', border: '#e9d5ff' };
                    if (cat.startsWith('5.')) return { bg: '#fdf2f8', text: '#9d174d', badgeBg: '#db2777', border: '#fbcfe8' };
                    if (cat.startsWith('6.')) return { bg: '#fff7ed', text: '#9a3412', badgeBg: '#ea580c', border: '#fed7aa' };
                    if (cat.startsWith('7.')) return { bg: '#f5f3ff', text: '#5b21b6', badgeBg: '#7c3aed', border: '#ddd6fe' };
                    if (cat.startsWith('8.')) return { bg: '#ecfdf5', text: '#065f46', badgeBg: '#059669', border: '#a7f3d0' };
                    return { bg: '#f8fafc', text: '#334155', badgeBg: '#64748b', border: '#cbd5e1' };
                  };

                  return dbTables.flatMap((table, i) => {
                    const isNewCategory = table.category !== currentCategory;
                    if (isNewCategory) {
                      currentCategory = table.category;
                      currentSubCategory = '';
                    }

                    const isNewSubCategory = !!(table.subCategory && table.subCategory !== currentSubCategory);
                    if (isNewSubCategory) {
                      currentSubCategory = table.subCategory || '';
                    }

                    const catStyle = getCategoryStyle(table.category);

                    const tableRows = table.columns.map((col, idx) => {
                      const isLastInTable = idx === table.columns.length - 1;
                      const borderBottomStyle = isLastInTable ? undefined : 'none';
                      const isTableAdded = table.status === 'added';
                      const isColAdded = col.status === 'added';
                      const isColModified = col.status === 'modified';

                      const rowBgColor = isTableAdded ? '#f0f7ff' : (isColAdded || isColModified) ? '#f8fafc' : undefined;

                      const colNameBg = isColAdded
                        ? '#dbeafe'
                        : isColModified
                          ? '#e0f2fe'
                          : isTableAdded
                            ? '#e0f2fe'
                            : undefined;

                      const colDescBg = isColAdded
                        ? '#eff6ff'
                        : isColModified
                          ? '#f0f9ff'
                          : isTableAdded
                            ? '#f0f7ff'
                            : undefined;

                      return (
                        <tr key={`${i}-${idx}`} style={{ backgroundColor: rowBgColor }}>
                          <td style={{
                            borderBottom: borderBottomStyle,
                            backgroundColor: isTableAdded ? '#f0f7ff' : undefined
                          }}>
                            {idx === 0 ? (
                              <span style={{
                                display: 'inline-block',
                                padding: 'var(--space-1) var(--space-2)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--text-caption)',
                                backgroundColor:
                                  table.tableType === '独立マスタ' ? '#ebf8ff' :
                                  table.tableType === '従属マスタ' ? '#e6fffa' :
                                  table.tableType === 'レコード' ? '#fffaf0' :
                                  table.tableType === 'スナップショット' ? '#f0fff4' : 'var(--palette-bluegreen-300)',
                                color:
                                  table.tableType === '独立マスタ' ? '#2b6cb0' :
                                  table.tableType === '従属マスタ' ? '#234e52' :
                                  table.tableType === 'レコード' ? '#c05621' :
                                  table.tableType === 'スナップショット' ? '#276749' : 'var(--color-text-main)',
                                border: `1px solid ${
                                  table.tableType === '独立マスタ' ? '#bee3f8' :
                                  table.tableType === '従属マスタ' ? '#b2f5ea' :
                                  table.tableType === 'レコード' ? '#feebc8' :
                                  table.tableType === 'スナップショット' ? '#c6f6d5' : 'transparent'
                                }`
                              }}>
                                {table.tableType}
                              </span>
                            ) : ''}
                          </td>
                          <td style={{
                            borderBottom: borderBottomStyle,
                            fontWeight: idx === 0 ? 'var(--weight-heading)' : undefined,
                            backgroundColor: isTableAdded ? '#f0f7ff' : undefined
                          }}>
                            {idx === 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ color: isTableAdded ? '#1e40af' : undefined, fontWeight: 'bold' }}>
                                  {table.physicalName}
                                </span>
                                {table.status === 'added' && (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff'
                                  }}>
                                    新規
                                  </span>
                                )}
                                {table.status === 'modified' && (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    backgroundColor: '#0284c7',
                                    color: '#ffffff'
                                  }}>
                                    一部変更
                                  </span>
                                )}
                              </div>
                            ) : ''}
                          </td>
                          <td style={{
                            borderBottom: borderBottomStyle,
                            fontWeight: idx === 0 ? 'var(--weight-heading)' : undefined,
                            backgroundColor: isTableAdded ? '#f0f7ff' : undefined
                          }}>
                            {idx === 0 ? (
                              <span style={{ color: isTableAdded ? '#1e40af' : undefined, fontWeight: 'bold' }}>
                                {table.logicalName}
                              </span>
                            ) : ''}
                          </td>
                          <td style={{
                            backgroundColor: colNameBg,
                            borderLeft: (isColAdded || isColModified) ? '3px solid #2563eb' : (isTableAdded ? '3px solid #60a5fa' : undefined),
                            color: (isColAdded || isTableAdded) ? '#1e3a8a' : isColModified ? '#0369a1' : 'var(--color-text-main)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isColAdded && (
                                <span style={{
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  backgroundColor: '#2563eb',
                                  color: '#ffffff',
                                  whiteSpace: 'nowrap'
                                }}>
                                  追加
                                </span>
                              )}
                              {isColModified && (
                                <span style={{
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  whiteSpace: 'nowrap'
                                }}>
                                  変更
                                </span>
                              )}
                              <span style={{ fontWeight: (isColAdded || isColModified || isTableAdded) ? '600' : 'normal' }}>
                                {col.name}
                              </span>
                            </div>
                          </td>
                          <td style={{
                            backgroundColor: colDescBg,
                            color: (isColAdded || isTableAdded) ? '#1e40af' : isColModified ? '#075985' : 'var(--color-text-main)'
                          }}>
                            {col.desc}
                          </td>
                        </tr>
                      );
                    });

                    const headerRows: React.ReactElement[] = [];

                    if (isNewCategory) {
                      headerRows.push(
                        <tr key={`cat-hdr-${i}`} style={{ backgroundColor: catStyle.bg }}>
                          <td colSpan={5} style={{
                            padding: '10px 16px',
                            fontWeight: 'bold',
                            borderTop: '2px solid var(--color-border-subtle)',
                            borderBottom: `1px solid ${catStyle.border}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                backgroundColor: catStyle.badgeBg,
                                color: '#ffffff'
                              }}>
                                ■ {table.category}
                              </span>
                              {table.categoryDescription && (
                                <span style={{ fontSize: '12px', color: catStyle.text, fontWeight: 'normal' }}>
                                  {table.categoryDescription}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    if (isNewSubCategory && table.subCategory) {
                      headerRows.push(
                        <tr key={`subcat-hdr-${i}`} style={{ backgroundColor: '#f8fafc' }}>
                          <td colSpan={5} style={{
                            padding: '6px 16px 6px 24px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            color: '#334155',
                            borderTop: '1px solid var(--color-border-subtle)',
                            borderBottom: '1px solid var(--color-border-subtle)'
                          }}>
                            <span style={{ color: '#64748b', marginRight: '6px' }}>▼</span>
                            {table.subCategory}
                          </td>
                        </tr>
                      );
                    }

                    return [...headerRows, ...tableRows];
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <table className="inventory-table auto-height-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>画面</th>
                <th style={{ width: '20%' }}>{CATEGORY_INDEPENDENT_MASTER}</th>
                <th style={{ width: '20%' }}>{CATEGORY_DEPENDENT_MASTER}</th>
                <th style={{ width: '20%' }}>{CATEGORY_RECORD}</th>
                <th style={{ width: '20%' }}>{CATEGORY_SUMMARY}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isNoTabScreen = ['システム構成（開発用）', PAGE_NAMES.SCREEN_COMPOSITION].includes(row.screen);
                const activeTabs = isNoTabScreen ? [] : row.tabs;
                const independentMasterTabs = activeTabs.filter(t => getTabCategory(t.id) === CATEGORY_INDEPENDENT_MASTER);
                const dependentMasterTabs = activeTabs.filter(t => getTabCategory(t.id) === CATEGORY_DEPENDENT_MASTER);
                const recordTabs = activeTabs.filter(t => getTabCategory(t.id) === CATEGORY_RECORD);
                const summaryTabs = activeTabs.filter(t => getTabCategory(t.id) === CATEGORY_SUMMARY);

                return (
                  <tr key={i} style={{ height: 'auto', minHeight: '42px' }}>
                    <td style={{
                      fontWeight: 'var(--weight-heading)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      height: 'auto',
                      minHeight: '42px',
                      maxHeight: 'none',
                      padding: '8px 12px',
                      verticalAlign: 'middle'
                    }}>
                      {row.screen}
                    </td>
                    <td style={{
                      backgroundColor: getCategoryColor(CATEGORY_INDEPENDENT_MASTER),
                      color: 'var(--color-text-main)',
                      height: 'auto',
                      minHeight: '42px',
                      maxHeight: 'none',
                      padding: '8px 12px',
                      verticalAlign: 'middle'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', height: 'auto', maxHeight: 'none' }}>
                        {independentMasterTabs.map(t => <div key={t.id}>{t.label}</div>)}
                      </div>
                    </td>
                    <td style={{
                      backgroundColor: getCategoryColor(CATEGORY_DEPENDENT_MASTER),
                      color: 'var(--color-text-main)',
                      height: 'auto',
                      minHeight: '42px',
                      maxHeight: 'none',
                      padding: '8px 12px',
                      verticalAlign: 'middle'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', height: 'auto', maxHeight: 'none' }}>
                        {dependentMasterTabs.map(t => <div key={t.id}>{t.label}</div>)}
                      </div>
                    </td>
                    <td style={{
                      backgroundColor: getCategoryColor(CATEGORY_RECORD),
                      color: 'var(--color-text-main)',
                      height: 'auto',
                      minHeight: '42px',
                      maxHeight: 'none',
                      padding: '8px 12px',
                      verticalAlign: 'middle'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', height: 'auto', maxHeight: 'none' }}>
                        {recordTabs.map(t => <div key={t.id}>{t.label}</div>)}
                      </div>
                    </td>
                    <td style={{
                      backgroundColor: getCategoryColor(CATEGORY_SUMMARY),
                      color: 'var(--color-text-main)',
                      height: 'auto',
                      minHeight: '42px',
                      maxHeight: 'none',
                      padding: '8px 12px',
                      verticalAlign: 'middle'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', height: 'auto', maxHeight: 'none' }}>
                        {summaryTabs.map(t => <div key={t.id}>{t.label}</div>)}
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
