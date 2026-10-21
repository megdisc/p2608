import { getPreviousDay } from './date';

export type PeriodItem = {
  id: string;
  valid_from?: string;
  valid_to?: string | null;
  validFrom?: string;
  validTo?: string | null;
  [key: string]: any;
};

export type HistoryPeriodOptions = {
  fromKey?: string;
  toKey?: string;
  deletedIds?: Set<string> | string[];
  keepDescending?: boolean;
};

/**
 * 期間履歴レコードの適用開始日・適用終了日を自動計算・連動させる共通ロジック。
 * 
 * 同じ親エンティティ（事業所・支援種別、または利用者）に紐づく複数の期間履歴レコードがある場合、
 * 適用開始日（昇順：古い順）に基づいてソートし、
 * 各レコードの適用終了日を「直後のレコードの適用開始日の前日」に自動設定する。
 * 最新（最後）のレコードの適用終了日は、継続中を表す null（または指定値）とする。
 * 
 * 画面表示用に、開始日の降順（新しい順）で並び替えて返却する。
 */
export function recomputeHistoryPeriods<T extends Record<string, any>>(
  records: T[],
  options?: HistoryPeriodOptions
): T[] {
  if (!records || records.length === 0) return [];

  const sample = records[0] || {};
  const fromKey = options?.fromKey || ('valid_from' in sample ? 'valid_from' : 'validFrom');
  const toKey = options?.toKey || ('valid_to' in sample ? 'valid_to' : 'validTo');
  
  const deletedSet = options?.deletedIds instanceof Set 
    ? options.deletedIds 
    : new Set(options?.deletedIds || []);

  // 1. 削除フラグが立っていない有効な履歴レコードを抽出
  const activeRecords = records.filter(r => !deletedSet.has(r.id));

  // 2. 開始日昇順（古い順）にソート
  const sortedActive = [...activeRecords].sort((a, b) => {
    const aVal = a[fromKey] || '9999-12-31';
    const bVal = b[fromKey] || '9999-12-31';
    return aVal.localeCompare(bVal);
  });

  // 3. 各レコードの終了日を「直後のレコードの開始日の前日」に設定
  const computedToMap = new Map<string, string | null>();
  for (let i = 0; i < sortedActive.length; i++) {
    const curr = sortedActive[i];
    const isLatest = (i === sortedActive.length - 1);
    if (isLatest) {
      // 最新のレコードは終了時期が指定されていなければ null（継続中）
      computedToMap.set(curr.id, curr[toKey] ? curr[toKey] : null);
    } else {
      const next = sortedActive[i + 1];
      const nextFrom = next[fromKey];
      if (nextFrom) {
        computedToMap.set(curr.id, getPreviousDay(nextFrom));
      } else {
        computedToMap.set(curr.id, curr[toKey] || null);
      }
    }
  }

  // 4. 元のレコード配列に終了日を反映
  const updatedRecords = records.map(r => {
    if (deletedSet.has(r.id)) return r;
    return {
      ...r,
      [toKey]: computedToMap.has(r.id) ? computedToMap.get(r.id) : r[toKey],
    };
  });

  // 5. 画面表示用に新しい順（開始日の降順）でソートして返却
  if (options?.keepDescending !== false) {
    updatedRecords.sort((a, b) => {
      const aVal = a[fromKey] || '9999-12-31';
      const bVal = b[fromKey] || '9999-12-31';
      return bVal.localeCompare(aVal);
    });
  }

  return updatedRecords;
}
