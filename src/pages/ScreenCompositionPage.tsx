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

interface DBColumn {
  name: string;
  desc: string;
  status?: 'added' | 'modified';
}

interface DBTable {
  layer: string;
  physicalName: string;
  tableType: string;
  logicalName: string;
  description: string;
  columns: DBColumn[];
  status?: 'added' | 'modified';
}

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
    { frequency: '随時', name: 'スキル体系登録', description: '事業所に所属する業務に必要なスキル体系およびスキルレベルを定義する。', implemented: true },
    { frequency: '随時', name: '工賃体系登録', description: '事業所に所属する基本工賃単価、加算手当、および控除項目を一括管理する工賃体系を定義する。', implemented: true },
    { frequency: '随時', name: '積立金体系登録', description: '事業所に所属する積立金ルール（工賃変動積立金・設備更新積立金等）および項目を定義する。', implemented: true },
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

  const dbTables: DBTable[] = [
    // 1. マスタ層（福祉制度）
    {
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
    // 施設・事業所マスタ
    {
      layer: '1. マスタ層',
      physicalName: 'organizations',
      tableType: '独立マスタ',
      logicalName: '法人',
      description: '運営法人・事業本部の基本情報（法人名・代表者名・法人番号・工賃明細書等各種帳票出力用属性）',
      columns: [
        { name: 'id', desc: '法人ID' },
        { name: 'name', desc: '法人名（例: 社会福祉法人〇〇会、特定非営利活動法人〇〇、一般社団法人〇〇等）' },
        { name: 'representative_name', desc: '代表者職・氏名（例: 理事長 〇〇 〇〇）' },
        { name: 'corporate_number', desc: '法人番号（13桁）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'offices',
      tableType: '独立マスタ',
      logicalName: '事業所',
      description: '法人が運営する各事業所の基本情報（多機能型事業所対応）',
      columns: [
        { name: 'id', desc: '事業所ID' },
        { name: 'code', desc: '事業所コード' },
        { name: 'name', desc: '事業所名（正式名称）' },
        { name: 'short_name', desc: '通称（サイドバー等表示用略称）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'office_service_type_settings',
      tableType: '従属マスタ',
      logicalName: '事業所支援種別割当',
      description: '事業所が指定を受けて実施する支援種別および定員・人員配置・報酬区分設定',
      status: 'modified',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'service_type_id', desc: '支援種別ID' },
        { name: 'capacity', desc: '利用定員（人）' },
        { name: 'office_number', desc: '指定事業所番号（都道府県等から付与された10桁コード。国保連請求・代理受領通知書用）', status: 'added' },
        { name: 'staffing_ratio', desc: '人員配置基準区分（7.5:1 / 10:1。基本報酬の単位数決定用）', status: 'added' },
        { name: 'wage_achievement_tier', desc: '平均工賃月額達成区分（前年度平均工賃実績区分。基本報酬単位数決定用）', status: 'added' },
        { name: 'deleted_at', desc: '削除日時（論理削除用）', status: 'added' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除用）', status: 'added' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'office_reward_summaries',
      tableType: '従属マスタ',
      logicalName: '事業所加算・減算概要',
      description: '各事業所における加算・減算の有効年月・適用期間の管理（加算・減算項目セットの履歴管理）',
      status: 'added',
      columns: [
        { name: 'id', desc: '概要ID', status: 'added' },
        { name: 'office_id', desc: '事業所ID（officesのIDを参照）', status: 'added' },
        { name: 'start_date', desc: '有効開始年月日（適用開始年月）', status: 'added' },
        { name: 'end_date', desc: '有効終了年月日（適用終了年月。NULL: 継続中）', status: 'added' },
        { name: 'is_active', desc: '有効フラグ（現在有効な設定か）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'office_reward_details',
      tableType: '従属マスタ',
      logicalName: '事業所加算・減算詳細',
      description: '事業所加算・減算概要に紐づく対象加算・減算項目の一覧（セットを構成する各項目）',
      status: 'added',
      columns: [
        { name: 'id', desc: '詳細ID', status: 'added' },
        { name: 'summary_id', desc: '概要ID（office_reward_summariesのIDを参照）', status: 'added' },
        { name: 'reward_item_id', desc: '加算・減算項目ID（reward_itemsのIDを参照）', status: 'added' },
        { name: 'created_at', desc: '作成日時', status: 'added' },
        { name: 'updated_at', desc: '更新日時', status: 'added' }
      ]
    },
    {
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
      physicalName: 'office_member_settings',
      tableType: '従属マスタ',
      logicalName: '事業所利用者割当',
      description: '利用者と事業所の多対多割当・所属情報（多拠点利用対応）',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'member_skill_settings',
      tableType: '従属マスタ',
      logicalName: '利用者スキル割当',
      description: '利用者の保有スキル評価履歴',
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
        { name: 'yomigana', desc: 'ふりがな' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'is_deleted', desc: '削除フラグ（論理削除連動生成列: deleted_at IS NOT NULL）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
      physicalName: 'office_staff_settings',
      tableType: '従属マスタ',
      logicalName: '事業所職員割当',
      description: '職員と事業所の多対多割当・所属情報および人員配置基準判定用属性',
      status: 'modified',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'staff_id', desc: '職員ID' },
        { name: 'is_primary', desc: '主たる事業所フラグ（true: メイン所属拠点 / false: 兼務拠点）' },
        { name: 'staff_role', desc: '配置職種区分（administrator: 管理者, service_manager: サービス管理責任者, direct_care: 生活支援員・職業指導員, target_evaluator: 目標工賃達成指導員 等）', status: 'added' },
        { name: 'employment_type', desc: '雇用形態（full_time: 常勤 / part_time: 非常勤。常勤換算算定用）', status: 'added' },
        { name: 'duty_type', desc: '勤務区分（exclusive: 専従 / concurrent: 兼務）', status: 'added' },
        { name: 'weekly_working_hours', desc: '週所定労働時間（常勤換算数[FTE]計算用。例: 40.0時間）', status: 'added' },
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
      physicalName: 'projects',
      tableType: '従属マスタ',
      logicalName: '案件',
      description: '案件基本情報（事業所ごとに管理）',
      columns: [
        { name: 'id', desc: '案件ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'settlement_year_month', desc: '精算年月' },
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
      layer: '1. マスタ層',
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
    // 2. 日次実績層
    {
      layer: '2. 日次実績層',
      physicalName: 'staff_attendance_records',
      tableType: 'レコード',
      logicalName: '職員勤務実績',
      description: '職員の日次の勤務・出退勤・勤務事業所・現場配置職種記録',
      columns: [
        { name: 'id', desc: '勤務記録ID' },
        { name: 'office_id', desc: '勤務事業所ID' },
        { name: 'staff_id', desc: '職員ID' },
        { name: 'work_date', desc: '勤務日' },
        { name: 'start_time', desc: '出勤時刻' },
        { name: 'end_time', desc: '退勤時刻' },
        { name: 'break_minutes', desc: '休憩時間（分）' },
        { name: 'assigned_role', desc: '配置職種・役割（サービス管理責任者/生活支援員/職業指導員など）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '2. 日次実績層',
      physicalName: 'member_attendance_records',
      tableType: 'レコード',
      logicalName: '利用者出欠実績',
      description: '利用者の日々の出欠・通所・欠席連絡・加算判定（送迎・食事・訪問・施設外就労）記録',
      status: 'modified',
      columns: [
        { name: 'id', desc: '出欠記録ID' },
        { name: 'office_id', desc: '対象事業所ID' },
        { name: 'target_period', desc: '利用予定日（対象日）' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'status', desc: '出欠区分（present: 通所 / absent: 欠席）' },
        { name: 'contact_date', desc: '欠席連絡日（連絡受付日：利用予定日との日数差で加算判定）' },
        { name: 'is_absentee_supported', desc: '欠席時対応加算適用フラグ（連絡日より自動判定＋相談援助実績・手動上書き管理用）' },
        { name: 'has_meal', desc: '食事利用フラグ' },
        { name: 'has_pickup', desc: '送迎（往路）利用フラグ' },
        { name: 'has_dropoff', desc: '送迎（復路）利用フラグ' },
        { name: 'is_visit_supported', desc: '訪問支援加算フラグ（欠席時に居宅等を訪問して相談援助を実施した場合に算定）', status: 'added' },
        { name: 'is_trial_use', desc: '体験利用支援加算フラグ（特別支援学校等の生徒が体験利用した場合に算定）', status: 'added' },
        { name: 'is_offsite_work', desc: '施設外就労・施設外支援フラグ（事業所外で就労・個別支援を実施した場合の加算・減算確認用）', status: 'added' },
        { name: 'service_hours', desc: '実サービス提供時間（時間数。短時間利用減算や報酬告示上の提供時間確認用）', status: 'added' },
        { name: 'remarks', desc: '備考・欠席理由/連絡・相談援助内容' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '2. 日次実績層',
      physicalName: 'member_work_records',
      tableType: 'レコード',
      logicalName: '利用者作業実績',
      description: '利用者のタスクごとの日次作業時間記録',
      columns: [
        { name: 'id', desc: '作業記録ID' },
        { name: 'office_id', desc: '作業実施事業所ID' },
        { name: 'target_period', desc: '対象時期・作業日' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'task_id', desc: 'タスクID' },
        { name: 'work_time', desc: '作業時間' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '2. 日次実績層',
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
      layer: '2. 日次実績層',
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
    // 3. 月次実績層
    {
      layer: '3. 月次実績層',
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
      layer: '3. 月次実績層',
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
      layer: '3. 月次実績層',
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
    // 4. スナップショット層
    {
      layer: '4. スナップショット層',
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
      layer: '4. スナップショット層',
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
      layer: '4. スナップショット層',
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
      layer: '4. スナップショット層',
      physicalName: 'allowance_details',
      tableType: 'スナップショット',
      logicalName: '加算手当明細',
      description: '工賃確定時点のその他加算手当内訳スナップショット',
      columns: [
        { name: 'id', desc: '明細ID' },
        { name: 'summary_id', desc: '工賃・控除概要ID' },
        { name: 'allowance_id', desc: '手当ID（allowance_deduction_itemsのIDを参照）' },
        { name: 'allowance_name', desc: '手当名' },
        { name: 'unit_price', desc: '単価' },
        { name: 'quantity', desc: '数量・日数' },
        { name: 'amount', desc: '金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '4. スナップショット層',
      physicalName: 'deduction_details',
      tableType: 'スナップショット',
      logicalName: '控除明細',
      description: '工賃確定時点の控除内訳スナップショット',
      columns: [
        { name: 'id', desc: '明細ID' },
        { name: 'summary_id', desc: '工賃・控除概要ID' },
        { name: 'deduction_id', desc: '控除ID（allowance_deduction_itemsのIDを参照）' },
        { name: 'deduction_name', desc: '控除名' },
        { name: 'unit_price', desc: '単価' },
        { name: 'quantity', desc: '数量・日数' },
        { name: 'amount', desc: '金額' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '4. スナップショット層',
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
      layer: '4. スナップショット層',
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
      layer: '4. スナップショット層',
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
            <div style={{
              marginBottom: '16px',
              padding: '16px 20px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e3a8a' }}>
                  就労継続支援B型 サービス費算定ロジック（10割・1割）対応 スキーマ改修設計
                </span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#1e40af', lineHeight: '1.6' }}>
                本システム（就労継続支援B型）における「サービス利用料全額（10割・総費用額）」および「利用者自己負担額（原則1割・上限月額管理判定）」の自動算定ロジック構築に向けて、網羅的な条件登録に必要なテーブル・カラムの追加・変更箇所を<strong style={{ color: '#1d4ed8' }}>青色系背景</strong>で識別表示しています。
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: '#2563eb',
                    color: '#ffffff'
                  }}>
                    新規テーブル
                  </span>
                  <span style={{ color: '#334155' }}>：新規追加テーブル（事業所加算・減算概要、事業所加算・減算詳細、サービス費概要、サービス費明細）</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: '#0284c7',
                    color: '#ffffff'
                  }}>
                    一部変更
                  </span>
                  <span style={{ color: '#334155' }}>：カラム追加・改修予定の既存テーブル</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    backgroundColor: '#2563eb',
                    color: '#ffffff'
                  }}>
                    追加
                  </span>
                  <span style={{ color: '#334155' }}>：新規追加カラム（青色背景）</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    backgroundColor: '#0284c7',
                    color: '#ffffff'
                  }}>
                    変更
                  </span>
                  <span style={{ color: '#334155' }}>：定義・区分拡張カラム（青色背景）</span>
                </div>
              </div>
            </div>

            <table className="inventory-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>アーキテクチャ層</th>
                  <th style={{ width: '10%' }}>区分 (Type)</th>
                  <th style={{ width: '20%' }}>物理名 (Table Name)</th>
                  <th style={{ width: '18%' }}>論理名 (Logical Name)</th>
                  <th style={{ width: '17%' }}>カラム名</th>
                  <th style={{ width: '20%' }}>カラム説明</th>
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
                            table.layer === '4. スナップショット層' ? '#f0fff4' : '#f7fafc';

                    const layerTextColor =
                      table.layer === '1. マスタ層' ? '#2b6cb0' :
                        table.layer === '2. 日次実績層' ? '#c05621' :
                          table.layer === '3. 月次実績層' ? '#6b46c1' :
                            table.layer === '4. スナップショット層' ? '#276749' : '#4a5568';

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

                    if (isNewLayer) {
                      return [
                        <tr key={`layer-hdr-${i}`} style={{ backgroundColor: layerBgColor }}>
                          <td colSpan={6} style={{ padding: '8px 12px', fontWeight: 'bold', color: layerTextColor, borderTop: '2px solid var(--color-border-subtle)' }}>
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
