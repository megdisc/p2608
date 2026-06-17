export const TRANSACTION_TYPE_OPTIONS = [
  { label: '', value: '' },
  { label: '受入', value: '受入' },
  { label: '払出', value: '払出' }
];

export const STAFF_ROLE_OPTIONS = [
  { label: '', value: '' },
  { label: 'システム管理者', value: 'システム管理者' },
  { label: '職員', value: 'スタッフ' } // ※ DB側のvalueとしての 'スタッフ' は要件次第ですが、一旦表示(label)を職員とします
];

export const MEMBER_ROLE_OPTIONS = [
  { label: '', value: '' },
  { label: '利用者', value: '利用者' }
];
