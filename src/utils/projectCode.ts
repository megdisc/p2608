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
  if (!lastCode || lastCode.trim() === '') {
    return `${defaultPrefix}000001`;
  }

  const code = lastCode.trim();

  // 1. 末尾が数字の場合: 例 "P-000001" -> "P-000002", "M-000001" -> "M-000002", "PRJ-99" -> "PRJ-100"
  const numMatch = code.match(/^(.*?)(\d+)$/);
  if (numMatch) {
    const prefix = numMatch[1];
    const numStr = numMatch[2];
    const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numStr.length, '0');
    return `${prefix}${nextNum}`;
  }

  // 2. 末尾がアルファベットの場合: 例 "M-0001A" -> "M-0001B", "PRJ-Z" -> "PRJ-AA"
  const alphaMatch = code.match(/^(.*?)([a-zA-Z]+)$/);
  if (alphaMatch) {
    const prefix = alphaMatch[1];
    const alphaStr = alphaMatch[2];
    return `${prefix}${incrementAlphabet(alphaStr)}`;
  }

  return `${code}-1`;
}

export function generateNextProjectCode(lastCode?: string | null): string {
  return generateNextCode(lastCode, 'P-');
}
