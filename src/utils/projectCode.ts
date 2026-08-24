export function incrementAlphabet(str: string): string {
  if (!str) return 'A';
  const chars = str.split('');
  let i = chars.length - 1;
  while (i >= 0) {
    const code = chars[i].charCodeAt(0);
    if (code === 90) { // 'Z'
      chars[i] = 'A';
      i--;
    } else if (code === 122) { // 'z'
      chars[i] = 'a';
      i--;
    } else if ((code >= 65 && code < 90) || (code >= 97 && code < 122)) {
      chars[i] = String.fromCharCode(code + 1);
      return chars.join('');
    } else {
      break;
    }
  }
  const isLower = str[0] === str[0].toLowerCase() && str[0] !== str[0].toUpperCase();
  return (isLower ? 'a' : 'A') + chars.join('');
}

/**
 * 最終登録コードを元に、次回のIDを自動生成する。
 * 最終レコードが存在しない（1件も無い）場合は "${defaultPrefix}000001" をデフォルトとする。
 */
export function generateNextCode(lastCode?: string | null, defaultPrefix: string = 'P-'): string {
  return generateNextUnifiedCode(lastCode ? [lastCode] : [], defaultPrefix);
}

export function generateNextProjectCode(lastCode?: string | null): string {
  return generateNextCode(lastCode, 'P-');
}

/**
 * 採番ロジック（案件、利用者、職員、取引先などで統一）
 * 既存レコード（DBのデータ＋現在編集中のドラフト行）のすべてのID/コードの中から
 * 該当プレフィックスに基づく「最新/最大」の数値IDを特定し、その数値 + 1 のIDをデフォルトとする。
 * 生成したIDがレコード内に既に存在する場合は、存在しなくなるまでさらに + 1 を加算する。
 */
export function generateNextUnifiedCode(
  existingCodes: (string | null | undefined)[],
  defaultPrefix: string = 'P-'
): string {
  const codeSet = new Set<string>();
  let maxNum = 0;
  let maxDigits = 6;
  let targetPrefix = defaultPrefix;

  for (const c of existingCodes) {
    if (!c || typeof c !== 'string') continue;
    const trimmed = c.trim();
    if (!trimmed) continue;
    codeSet.add(trimmed);

    // 末尾が数字のパターン (例: "P-000007" -> prefix: "P-", num: "000007")
    const match = trimmed.match(/^(.*?)(\d+)$/);
    if (match) {
      const p = match[1];
      const numStr = match[2];
      const val = parseInt(numStr, 10);

      // 指定されたプレフィックスと致する場合 (または接頭辞を問わず最大数値を取得)
      if (!p || p.toUpperCase() === defaultPrefix.toUpperCase()) {
        if (p) targetPrefix = p;
        if (val > maxNum) {
          maxNum = val;
        }
        if (numStr.length > maxDigits) {
          maxDigits = numStr.length;
        }
      }
    }
  }

  let candidateNum = maxNum + 1;
  let candidateCode = `${targetPrefix}${candidateNum.toString().padStart(maxDigits, '0')}`;

  while (codeSet.has(candidateCode)) {
    candidateNum++;
    candidateCode = `${targetPrefix}${candidateNum.toString().padStart(maxDigits, '0')}`;
  }

  return candidateCode;
}

