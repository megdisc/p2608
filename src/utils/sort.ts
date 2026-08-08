/**
 * ふりがな（yomigana）に基づいた汎用比較・ソート関数
 * aVal/bVal が文字列の場合、yomigana フィールドがあればそれを優先して比較します。
 */
export function compareValues(
  aVal: any,
  bVal: any,
  direction: 'asc' | 'desc' = 'asc',
  aObj?: any,
  bObj?: any
): number {
  if (aObj && bObj) {
    const aYomi =
      aObj.yomigana ||
      aObj.memberYomigana ||
      aObj.assigneeYomigana ||
      aObj.userYomigana ||
      aObj.projectYomigana ||
      aObj.taskYomigana;
    const bYomi =
      bObj.yomigana ||
      bObj.memberYomigana ||
      bObj.assigneeYomigana ||
      bObj.userYomigana ||
      bObj.projectYomigana ||
      bObj.taskYomigana;

    // もし比較値が文字列で、かつ両方のオブジェクトにふりがながある場合はふりがなで比較
    if (aYomi && bYomi && typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aYomi.localeCompare(bYomi, 'ja');
      return direction === 'asc' ? cmp : -cmp;
    }
  }

  if (aVal === undefined || aVal === null) aVal = '';
  if (bVal === undefined || bVal === null) bVal = '';

  if (typeof aVal === 'string' && typeof bVal === 'string') {
    const cmp = aVal.localeCompare(bVal, 'ja');
    return direction === 'asc' ? cmp : -cmp;
  }

  if (aVal < bVal) return direction === 'asc' ? -1 : 1;
  if (aVal > bVal) return direction === 'asc' ? 1 : -1;
  return 0;
}
