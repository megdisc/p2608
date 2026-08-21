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

export function generateNextProjectCode(existingCodes: string[]): string {
  if (!existingCodes || existingCodes.length === 0) {
    return 'P-000001';
  }

  const validCodes = existingCodes.filter(c => c && c.trim() !== '');
  if (validCodes.length === 0) return 'P-000001';

  // Sort descending by natural alphanumeric sorting
  validCodes.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
  const lastCode = validCodes[0];

  // 1. If ends with numbers: e.g. "P-000001", "P-26A001", "PRJ-99"
  const numMatch = lastCode.match(/^(.*?)(\d+)$/);
  if (numMatch) {
    const prefix = numMatch[1];
    const numStr = numMatch[2];
    const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numStr.length, '0');
    return `${prefix}${nextNum}`;
  }

  // 2. If ends with alphabets: e.g. "P-0001A", "PRJ-Z"
  const alphaMatch = lastCode.match(/^(.*?)([a-zA-Z]+)$/);
  if (alphaMatch) {
    const prefix = alphaMatch[1];
    const alphaStr = alphaMatch[2];
    return `${prefix}${incrementAlphabet(alphaStr)}`;
  }

  return `${lastCode}-1`;
}
