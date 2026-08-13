/**
 * 汎用比較・ソート関数
 * aVal/bVal を第一優先で比較します。
 * aVal と bVal が同値（0）で、オブジェクトにふりがながある場合は、ふりがな順でタイブレークを行います。
 */
export function compareValues(
  aVal: any,
  bVal: any,
  direction: 'asc' | 'desc' = 'asc',
  aObj?: any,
  bObj?: any
): number {
  if (aVal === undefined || aVal === null) aVal = '';
  if (bVal === undefined || bVal === null) bVal = '';

  let cmp = 0;

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    if (aVal < bVal) cmp = -1;
    else if (aVal > bVal) cmp = 1;
  } else if (typeof aVal === 'string' && typeof bVal === 'string') {
    cmp = aVal.localeCompare(bVal, 'ja');
  } else {
    if (aVal < bVal) cmp = -1;
    else if (aVal > bVal) cmp = 1;
  }

  // もし aVal と bVal が同値（cmp === 0）で、オブジェクトにふりがながある場合はふりがな順でタイブレーク
  if (cmp === 0 && aObj && bObj) {
    const aYomi =
      aObj.projectCode ||
      aObj.code ||
      aObj.projectYomigana ||
      aObj.taskYomigana ||
      aObj.userYomigana ||
      aObj.yomigana ||
      aObj.memberYomigana ||
      aObj.assigneeYomigana;
    const bYomi =
      bObj.projectCode ||
      bObj.code ||
      bObj.projectYomigana ||
      bObj.taskYomigana ||
      bObj.userYomigana ||
      bObj.yomigana ||
      bObj.memberYomigana ||
      bObj.assigneeYomigana;

    if (aYomi && bYomi) {
      cmp = aYomi.localeCompare(bYomi, 'ja');
    }
  }

  return direction === 'asc' ? cmp : -cmp;
}
