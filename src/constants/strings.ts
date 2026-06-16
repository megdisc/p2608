export const SYSTEM_NAME = '統合管理システム';
export const SYSTEM_NAME_INVENTORY = '在庫管理システム';
export const SYSTEM_NAME_PROJECT = '案件管理システム';
export const SYSTEM_ID = 'p2608';

export const MENU_CATEGORIES = {
  AGGREGATION: '集計系',
  RECORDING: '記録系',
  INFORMATION: '情報系',
  SETTINGS: '設定系',
};

export const MENU_SUBCATEGORIES = {
  AGGREGATION: 'レポート',
  RECORDING: 'トランザクション',
  INFORMATION: 'メインマスタ',
  SETTINGS: 'サブマスタ',
};

export const PAGE_NAMES = {
  // 在庫管理
  INVENTORY: '在庫集計',
  TRANSACTION: '受入・払出記録',
  STOCKTAKING: '棚卸記録',
  MASTER: '品目情報',
  CATEGORY: 'カテゴリ設定',
  LOCATION: '保管場所設定',
  SUPPLIER: '仕入先設定',
  STAFF: 'スタッフ設定',
  
  // 案件管理
  PROJECT_INFO: '案件情報',
  PROJECT_USER: '利用者設定',
  CLIENT: '取引先設定',
  SKILL: 'スキル設定',
  DAILY_WORK_RECORD: '日次作業記録',
};

export const TABLE_COLUMNS = {
  // 共通
  YOMIGANA: 'よみがな',
  DESCRIPTION: '説明',
  NAME: '氏名',
  CATEGORY: 'カテゴリ',
  ITEM: '品目',
  PERSON_IN_CHARGE: '記録者',
  DATE: '記録日時',

  // 保管場所
  LOCATION_NAME: '保管場所名',

  // カテゴリ
  CATEGORY_NAME: 'カテゴリ名',

  // スタッフ
  ROLE: '権限ロール',
  EMAIL: 'メールアドレス',
  PASSWORD: 'パスワード',

  // 仕入先
  SUPPLIER_NAME: '仕入先名',
  CLIENT_NAME: '取引先名',
  CONTACT_PERSON: '担当者',
  PHONE: '電話番号',

  // 品目
  STANDARD_LOCATION: '標準保管場所',
  SUPPLIER: '仕入先',
  STANDARD_PRICE: '標準単価 (円)',
  STANDARD_PURCHASE_QTY: '標準仕入数量',

  // 在庫・記録・棚卸
  BOOK_INVENTORY: '帳簿在庫',
  ACTUAL_INVENTORY: '実在庫',
  DIFFERENCE: '差異',
  LOCATION: '保管場所',
  TYPE: '区分',
  QUANTITY: '数量',
  RESTRICTION: '制限',

  // 案件情報
  PROJECT_ID: '案件ID',
  PROJECT_NAME: '案件名',
  START_DATE: '開始日',
  END_DATE: '終了日',
  CUSTOMER: '顧客',
  TASK: 'タスク',
  REQUIRED_SKILLS: '必要スキル',
  ASSIGNEE_TYPE: '担当者区分',
  ASSIGNEE: '担当者',
  SKILL_NAME: 'スキル名',
  
  // 日次作業記録
  USER_NAME: '氏名',
  WORK_CONTENT: '作業内容',
  WORK_TIME: '作業時間',
};

export const LOGIN_LABELS = {
  EMAIL: 'メールアドレス',
  PASSWORD: 'パスワード',
};

export const BUTTON_LABELS = {
  LOGIN: 'ログイン',
  LOGIN_INVENTORY: '在庫管理システムへログイン',
  LOGIN_PROJECT: '案件管理システムへログイン',
  LOGOUT: 'ログアウト',
  ADD: '追加',
  SAVE: '確定',
  CANCEL: '取消',
  DELETE: '削除',
  EDIT: '編集',
};

export const MESSAGES = {
  SAVE_SUCCESS: '保存が完了しました。',
  SAVE_ERROR: '保存中にエラーが発生しました。コンソールをご確認ください。',
  EMPTY_INVENTORY: '在庫データがありません',
  EMPTY_TRANSACTION: '記録データがありません',
  EMPTY_STOCKTAKING: '棚卸データがありません',
  EMPTY_MASTER: 'マスタデータがありません',
  EMPTY_CATEGORY: 'カテゴリデータがありません',
  EMPTY_LOCATION: '保管場所データがありません',
  EMPTY_SUPPLIER: '仕入先データがありません',
  EMPTY_STAFF: 'スタッフデータがありません',
  EMPTY_PROJECT_USER: '利用者データがありません',
  EMPTY_CLIENT: '取引先データがありません',
  EMPTY_SKILL: 'スキルデータがありません',
  EMPTY_DAILY_WORK_RECORD: '作業記録がありません',
  DELETE_CONFIRM: '本当に削除しますか？',
  RESTRICTED_EDIT: '最新棚卸以前のデータは編集不可です',
};

export const PLACEHOLDERS = {
  EMAIL: 'user@example.com',
  PASSWORD: '••••••••',
};
