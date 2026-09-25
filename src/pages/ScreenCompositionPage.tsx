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

  const dbTables = [
    // 1. マスタ層
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
        { name: 'is_active', desc: '適用フラグ（true: 適用/有効, false: 非適用/無効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'reward_items',
      tableType: '独立マスタ',
      logicalName: '加算・減算項目',
      description: '法令・報酬告示に基づく公定価格基準の体制加減算・報酬項目マスタ（給付費算定用）',
      columns: [
        { name: 'id', desc: '項目ID' },
        { name: 'service_type_id', desc: '所属支援種別ID' },
        { name: 'code', desc: 'サービス詳細コード（国保連給付費算定6桁コード。例: 521111: 送迎加算, 521121: 欠席時対応加算 など）' },
        { name: 'name', desc: 'サービス詳細名称' },
        { name: 'item_category', desc: '項目区分（addition: 体制加算 / subtraction: 体制減算）' },
        { name: 'unit_value', desc: '加減算単位数' },
        { name: 'calc_rate', desc: '定率算定率[%]' },
        { name: 'occurrence_type', desc: '発生単位（daily: 日次発生 / monthly: 月次発生）' },
        { name: 'monthly_limit_count', desc: '月間算定上限回数' },
        { name: 'is_active', desc: '適用フラグ' },
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
        { name: 'is_active', desc: '適用フラグ（true: 適用/有効, false: 非適用/無効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'organizations',
      tableType: '独立マスタ',
      logicalName: '法人',
      description: '運営法人・事業本部の基本情報（法人名・代表者名・法人番号・工賃明細書等各種帳票出力用属性）',
      columns: [
        { name: 'id', desc: '法人ID' },
        { name: 'name', desc: '法人名（例: 社会福祉法人〇〇会、特定非営利活動法人〇〇、一般社団法人〇〇等）' },
        { name: 'yomigana', desc: 'ふりがな' },
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
      description: '法人が運営する各事業所の基本情報（多機能型事業所・地域区分単価対応）',
      columns: [
        { name: 'id', desc: '事業所ID' },
        { name: 'code', desc: '事業所コード' },
        { name: 'name', desc: '事業所名' },
        { name: 'yomigana', desc: 'ふりがな' },
        { name: 'unit_price', desc: '地域区分単価（1単位あたりの単価）' },
        { name: 'service_type_ids', desc: '割当支援種別（office_service_type_settings との連動割当）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'office_service_type_settings',
      tableType: '割当マスタ',
      logicalName: '事業所支援種別割当',
      description: '事業所が指定を受けて実施する支援種別および定員設定',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'service_type_id', desc: '支援種別ID' },
        { name: 'capacity', desc: '利用定員（人）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
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
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'entity_address_settings',
      tableType: '割当マスタ',
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
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'entity_phone_settings',
      tableType: '割当マスタ',
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
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'entity_email_settings',
      tableType: '割当マスタ',
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
      physicalName: 'wage_schemes',
      tableType: '体系マスタ',
      logicalName: '工賃体系',
      description: '事業所に所属する基本工賃単価・加算手当・控除項目を一括管理する工賃体系マスタ',
      columns: [
        { name: 'id', desc: '工賃体系ID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'name', desc: '工賃体系名（例: B型標準工賃体系、特別工賃体系など）' },
        { name: 'description', desc: '体系の説明・適用条件' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'wage_rate_items',
      tableType: '体系マスタ',
      logicalName: '工賃単価項目',
      description: '工賃体系に属する工賃単価のマスターデータ',
      columns: [
        { name: 'id', desc: '工賃単価ID' },
        { name: 'wage_scheme_id', desc: '所属工賃体系ID' },
        { name: 'wage', desc: '工賃単価（円/時 または 円/日）' },
        { name: 'description', desc: '説明・摘要' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'allowance_deduction_items',
      tableType: '体系マスタ',
      logicalName: '加算手当・控除項目',
      description: '工賃体系に属する事業所独自規定の加算手当および控除項目のマスターデータ',
      columns: [
        { name: 'id', desc: '項目ID' },
        { name: 'wage_scheme_id', desc: '所属工賃体系ID' },
        { name: 'name', desc: '項目名（例: 資格手当、皆勤手当、食事代控除、送迎実費控除など）' },
        { name: 'item_category', desc: '項目分類区分（allowance: 加算手当 / deduction: 控除）' },
        { name: 'occurrence_type', desc: '発生単位（daily: 日次発生 / monthly: 月次発生）' },
        { name: 'unit_price', desc: '標準発生単価・金額（円）' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'reserve_schemes',
      tableType: '体系マスタ',
      logicalName: '積立金体系',
      description: '事業所に所属する積立金ルールをパッケージ管理するマスターデータ',
      columns: [
        { name: 'id', desc: '積立金体系ID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'name', desc: '積立金体系名（例: 標準積立金体系）' },
        { name: 'description', desc: '体系の説明・適用条件' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'reserve_items',
      tableType: '体系マスタ',
      logicalName: '積立金項目',
      description: '積立金体系に属する積立金のマスターデータ（工賃変動積立金、設備更新積立金など）',
      columns: [
        { name: 'id', desc: '積立金ID' },
        { name: 'reserve_scheme_id', desc: '所属積立金体系ID' },
        { name: 'name', desc: '積立金名' },
        { name: 'occurrence_type', desc: '発生単位（daily: 日次発生 / monthly: 月次発生）' },
        { name: 'default_unit_price', desc: '標準単価・金額' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'skill_schemes',
      tableType: '体系マスタ',
      logicalName: 'スキル体系',
      description: '事業所に所属するスキル・スキルレベルをパッケージ管理するマスターデータ',
      columns: [
        { name: 'id', desc: 'スキル体系ID' },
        { name: 'office_id', desc: '所属事業所ID' },
        { name: 'name', desc: 'スキル体系名（例: 全社標準スキル体系、IT作業スキル体系など）' },
        { name: 'description', desc: '体系の説明・適用条件' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'skill_items',
      tableType: '体系マスタ',
      logicalName: 'スキル項目',
      description: 'スキル体系に属するスキルのマスターデータ（タスクおよび利用者に紐付け）',
      columns: [
        { name: 'id', desc: 'スキルID' },
        { name: 'skill_scheme_id', desc: '所属スキル体系ID' },
        { name: 'name', desc: 'スキル名' },
        { name: 'description', desc: 'スキルの説明' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'skill_level_items',
      tableType: '体系マスタ',
      logicalName: 'スキルレベル項目',
      description: 'スキル体系に属するスキルレベルの定義',
      columns: [
        { name: 'id', desc: 'スキルレベルID' },
        { name: 'skill_scheme_id', desc: '所属スキル体系ID' },
        { name: 'level_value', desc: 'レベル数値' },
        { name: 'description', desc: 'レベルの説明' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
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
        { name: 'contact_person', desc: '担当者名' },
        { name: 'is_customer', desc: '顧客フラグ' },
        { name: 'is_subcontractor', desc: '外注先フラグ' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
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
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'staff_qualification_settings',
      tableType: '割当マスタ',
      logicalName: '職員資格割当',
      description: '職員が保有する資格・登録番号・取得日・更新研修期限情報',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'staff_id', desc: '職員ID' },
        { name: 'qualification_id', desc: '資格ID' },
        { name: 'license_number', desc: '資格・登録番号' },
        { name: 'acquired_on', desc: '取得年月日・修了日' },
        { name: 'valid_until', desc: '有効期限・更新研修期限' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'office_staff_settings',
      tableType: '割当マスタ',
      logicalName: '事業所職員割当',
      description: '職員と事業所の多対多割当・所属情報（多拠点兼務対応）',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'staff_id', desc: '職員ID' },
        { name: 'is_primary', desc: '主たる事業所フラグ（true: メイン所属拠点 / false: 兼務拠点）' },
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
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'office_member_settings',
      tableType: '割当マスタ',
      logicalName: '事業所利用者割当',
      description: '利用者と事業所の多対多割当・所属情報（多拠点利用対応）',
      columns: [
        { name: 'id', desc: '割当ID' },
        { name: 'office_id', desc: '事業所ID' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'is_primary', desc: '主たる事業所フラグ（true: メイン所属拠点 / false: サブ利用拠点）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'member_skill_settings',
      tableType: '評価マスタ',
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
      tableType: '評価マスタ',
      logicalName: '利用者工賃単価割当',
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
      physicalName: 'projects',
      tableType: '業務マスタ',
      logicalName: '案件',
      description: '案件基本情報',
      columns: [
        { name: 'id', desc: '案件ID' },
        { name: 'settlement_year_month', desc: '精算年月' },
        { name: 'client_id', desc: '紐づく取引先ID' },
        { name: 'code', desc: '案件コード' },
        { name: 'name', desc: '案件名' },
        { name: 'project_type', desc: '案件種別' },
        { name: 'deleted_at', desc: '削除日時（NULL: 有効）' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'project_tasks',
      tableType: '業務マスタ',
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
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '1. マスタ層',
      physicalName: 'task_skill_settings',
      tableType: '業務マスタ',
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
      tableType: '業務マスタ',
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
      tableType: '業務マスタ',
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
      tableType: 'トランザクション',
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
      tableType: 'トランザクション',
      logicalName: '利用者出欠実績',
      description: '利用者の日々の出欠・通所・欠席連絡・欠席時対応自動判定記録',
      columns: [
        { name: 'id', desc: '出欠記録ID' },
        { name: 'office_id', desc: '対象事業所ID' },
        { name: 'target_period', desc: '利用予定日（対象日）' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'status', desc: '出欠区分（present: 通所 / absent: 欠席）' },
        { name: 'contact_date', desc: '欠席連絡日（連絡受付日：利用予定日との日数差で加算判定）' },
        { name: 'is_absentee_supported', desc: '欠席時対応加算適用フラグ（連絡日より自動判定＋相談援助実績・手動上書き管理用）' },
        { name: 'remarks', desc: '備考・欠席理由/連絡・相談援助内容' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '2. 日次実績層',
      physicalName: 'member_work_records',
      tableType: 'トランザクション',
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
      physicalName: 'allowance_records',
      tableType: 'トランザクション',
      logicalName: '加算手当実績',
      description: '日次発生の加算手当記録（例: 送迎利用、資格手当等）',
      columns: [
        { name: 'id', desc: '手当記録ID' },
        { name: 'target_period', desc: '対象時期・日付' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'allowance_id', desc: '手当ID（allowance_deduction_itemsのIDを参照）' },
        { name: 'quantity', desc: '数量・回数' },
        { name: 'unit_price', desc: '発生時単価' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '2. 日次実績層',
      physicalName: 'deduction_records',
      tableType: 'トランザクション',
      logicalName: '控除実績',
      description: '日次発生の控除記録（例: 昼食利用、物品購入費、独自サービス利用等）',
      columns: [
        { name: 'id', desc: '控除記録ID' },
        { name: 'target_period', desc: '対象時期・日付' },
        { name: 'member_id', desc: '利用者ID' },
        { name: 'deduction_id', desc: '控除ID（allowance_deduction_itemsのIDを参照）' },
        { name: 'quantity', desc: '数量・回数' },
        { name: 'unit_price', desc: '発生時単価' },
        { name: 'created_at', desc: '作成日時' },
        { name: 'updated_at', desc: '更新日時' }
      ]
    },
    {
      layer: '2. 日次実績層',
      physicalName: 'daily_record_closings',
      tableType: 'トランザクション',
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
      tableType: 'トランザクション',
      logicalName: '一般収支実績',
      description: '日々の出入金、材料費購入、経費発生、売上請求などの一般収支明細データ',
      columns: [
        { name: 'id', desc: '一般収支記録ID' },
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
      tableType: 'トランザクション',
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
      tableType: 'トランザクション',
      logicalName: '月次実績確定',
      description: '対象年月ごとの実績・インセンティブ分配等の確定状態および確定履歴',
      columns: [
        { name: 'id', desc: '確定ID' },
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
      tableType: 'トランザクション',
      logicalName: '一般収支明細',
      description: '締め時点で確定・集計保存された勘定科目別の決算収支データ（就労支援事業/福祉事業）',
      columns: [
        { name: 'id', desc: '明細ID' },
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
      tableType: 'トランザクション',
      logicalName: '工賃・控除概要',
      description: '月ごとの各利用者の計算・支給工賃記録、サービス利用料控除額、およびその他控除概要（基幹親テーブル）',
      columns: [
        { name: 'id', desc: '概要ID' },
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
      tableType: 'トランザクション',
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
      tableType: 'トランザクション',
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
      tableType: 'トランザクション',
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
      physicalName: 'monthly_financial_closings',
      tableType: 'トランザクション',
      logicalName: '月次収支確定',
      description: '対象年月ごとの工賃計算確定および事業活動収支の締め確定状態および確定履歴',
      columns: [
        { name: 'id', desc: '確定ID' },
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
            {/* 4層アーキテクチャ概要ガイド */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-body-bold)', color: 'var(--color-text-main)' }}>
                工賃・収支データ構造アーキテクチャ（4層パイプライン構造）
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '10px 12px', backgroundColor: '#ebf8ff', borderRadius: '6px', borderLeft: '4px solid #3182ce' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#2b6cb0' }}>1. マスタ層</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>法人・事業所（地域区分）・住所/電話番号/メールアドレス・報酬体制設定・割当・受給者証（負担割合/上限額）・工賃体系・手当/控除（単位加減算連動）・積立体系・単価・利用者・職員・取引先・スキル・案件・予算等の定義</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#fffaf0', borderRadius: '6px', borderLeft: '4px solid #dd6b20' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#c05621' }}>2. 日次実績層</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>出欠・通所/欠席時対応記録・タスク作業実績記録・日次手当/控除記録 ➔ [日報確定]</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#faf5ff', borderRadius: '6px', borderLeft: '4px solid #805ad5' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#6b46c1' }}>3. 月次実績層</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>日次/随時収支 ＋ インセンティブ分配 ＋ 月次サービス利用実績（単位数・全額・負担額算定） ➔ [月次確定]</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#f0fff4', borderRadius: '6px', borderLeft: '4px solid #38a169' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#276749' }}>4. スナップショット層</div>
                  <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>利用者工賃明細（サービス利用料控除額含む）・収支明細スナップショット ＋ 工賃/収支締め確定の不変保存 ➔ [月次締め]</div>
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
                                backgroundColor: table.tableType.includes('マスタ') ? 'var(--palette-bluegreen-300)' : 'var(--palette-yellow-300)',
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
                          <td style={{ color: 'var(--color-text-main)' }}>{col.name}</td>
                          <td style={{ color: 'var(--color-text-main)' }}>{col.desc}</td>
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

            {/* 5. 旧テーブル名互換ビュー */}
            <div style={{
              marginTop: '32px',
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: '#edf2f7',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid #4a5568'
            }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-body-bold)', color: '#2d3748' }}>
                5. 旧テーブル名互換ビュー (Backward-Compatible Views)
              </h4>
              <div style={{ fontSize: '12px', color: '#4a5568', marginTop: '4px' }}>
                アプリケーション互換性維持のため、4層ベーステーブルにマッピングされたビュー群
              </div>
            </div>

            <table className="inventory-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>ビュー名 (View Name)</th>
                  <th style={{ width: '25%' }}>参照ベーステーブル (Base Table)</th>
                  <th style={{ width: '50%' }}>説明・補足</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'users', baseTable: 'auth_users', desc: '認証ユーザー互換ビュー（is_deleted 列を deleted_at から自動計算）' },
                  { name: 'wage_rates', baseTable: 'wage_rate_items', desc: '工賃単価互換ビュー（is_deleted 列を deleted_at から自動計算）' },
                  { name: 'allowances', baseTable: 'allowance_items', desc: '加算手当互換ビュー（is_deleted, is_active 列を deleted_at から自動計算）' },
                  { name: 'deductions', baseTable: 'deduction_items', desc: '控除互換ビュー（is_deleted, is_active 列を deleted_at から自動計算）' },
                  { name: 'reserve_settings', baseTable: 'reserve_items', desc: '積立金設定互換ビュー（is_deleted, is_active 列を deleted_at から自動計算）' },
                  { name: 'skills', baseTable: 'skill_items', desc: 'スキル互換ビュー（is_deleted 列を deleted_at から自動計算）' },
                  { name: 'skill_levels', baseTable: 'skill_level_items', desc: 'スキルレベル互換ビュー（is_deleted 列を deleted_at から自動計算）' },
                  { name: 'member_skill_evaluations', baseTable: 'member_skill_settings', desc: '利用者スキル割当エイリアスビュー' },
                  { name: 'member_wage_evaluations', baseTable: 'member_wage_settings', desc: '利用者工賃単価割当エイリアスビュー' },
                  { name: 'project_task_skills', baseTable: 'task_skill_settings', desc: 'タスクスキル割当エイリアスビュー' },
                  { name: 'project_task_assignees', baseTable: 'task_assignee_settings', desc: 'タスク担当者割当エイリアスビュー' },
                  { name: 'service_schemes', baseTable: 'wage_schemes', desc: '給付費・工賃サービス体系互換ビュー' },
                  { name: 'office_service_scheme_settings', baseTable: 'wage_schemes', desc: '事業所サービス体系割当互換ビュー' },
                  { name: 'office_service_settings', baseTable: 'wage_schemes', desc: '事業所サービス設定互換ビュー' },
                  { name: 'staff_work_records', baseTable: 'staff_attendance_records', desc: '職員勤務実績エイリアスビュー' },
                  { name: 'attendance_records', baseTable: 'member_attendance_records', desc: '利用者出欠実績エイリアスビュー' },
                  { name: 'work_records', baseTable: 'member_work_records', desc: '利用者作業実績エイリアスビュー' },
                  { name: 'daily_work_records', baseTable: 'member_work_records', desc: '作業実績エイリアスビュー' },
                  { name: 'daily_allowance_records', baseTable: 'allowance_records', desc: '加算手当実績エイリアスビュー' },
                  { name: 'daily_deduction_records', baseTable: 'deduction_records', desc: '控除実績エイリアスビュー' },
                  { name: 'daily_work_confirmations', baseTable: 'daily_record_closings', desc: '日次実績確定エイリアスビュー' },
                  { name: 'financial_records', baseTable: 'general_financial_details', desc: '一般収支明細エイリアスビュー' },
                  { name: 'daily_financial_records', baseTable: 'general_financial_details', desc: '一般収支明細エイリアスビュー' },
                  { name: 'monthly_incentive_records', baseTable: 'incentive_records', desc: 'インセンティブ実績エイリアスビュー' },
                  { name: 'monthly_incentive_confirmations', baseTable: 'monthly_record_closings', desc: '月次実績確定エイリアスビュー' },
                  { name: 'monthly_wage_confirmations', baseTable: 'monthly_record_closings', desc: '月次実績確定エイリアスビュー' },
                  { name: 'monthly_confirmation_details', baseTable: 'general_financial_details', desc: '一般収支明細エイリアスビュー' },
                  { name: 'monthly_wage_summaries', baseTable: 'wage_summaries', desc: '工賃・控除概要エイリアスビュー' },
                  { name: 'monthly_incentive_details', baseTable: 'incentive_details', desc: 'インセンティブ明細エイリアスビュー' },
                  { name: 'monthly_allowance_details', baseTable: 'allowance_details', desc: '加算手当明細エイリアスビュー' },
                  { name: 'monthly_deduction_details', baseTable: 'deduction_details', desc: '控除明細エイリアスビュー' },
                  { name: 'monthly_financial_confirmations', baseTable: 'monthly_financial_closings', desc: '月次収支確定エイリアスビュー' },
                ].map((v, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'var(--weight-heading)', color: 'var(--color-text-main)' }}>{v.name}</td>
                    <td style={{ color: 'var(--color-text-main)' }}>{v.baseTable}</td>
                    <td style={{ color: 'var(--color-text-main)' }}>{v.desc}</td>
                  </tr>
                ))}
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
