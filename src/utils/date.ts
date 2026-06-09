/**
 * Parses a date input (string or Date) and returns a valid Date object.
 * If the string comes from Supabase and lacks timezone information, we treat it as UTC.
 */
function parseToDate(input: string | Date | null | undefined): Date {
  if (!input) return new Date(NaN);
  if (input instanceof Date) return input;
  
  // Replace space with T
  let str = input.replace(' ', 'T');
  
  // If it doesn't contain a timezone indicator, treat it as JST (local input)
  if (!str.includes('Z') && !str.includes('+') && !str.match(/-\d{2}:\d{2}$/)) {
    str += '+09:00';
  }
  
  return new Date(str);
}

/**
 * Helper to get JST date parts securely using Intl.DateTimeFormat
 */
function getJSTParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  
  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second')
  };
}

/**
 * Returns a JST string for UI display: "YYYY年MM月DD日 HH:mm"
 */
export function formatJST(input: string | Date | null | undefined): string {
  const date = parseToDate(input);
  if (isNaN(date.getTime())) return typeof input === 'string' ? input : '';
  
  const { year, month, day, hour, minute } = getJSTParts(date);
  return `${year}年${month}月${day}日 ${hour}:${minute}`;
}

/**
 * Returns a JST string for filtering/comparison: "YYYY-MM-DD"
 */
export function formatJSTDateOnly(input: string | Date | null | undefined): string {
  const date = parseToDate(input);
  if (isNaN(date.getTime())) {
    return typeof input === 'string' && input.length >= 10 ? input.substring(0, 10) : '';
  }
  
  const { year, month, day } = getJSTParts(date);
  return `${year}-${month}-${day}`;
}

/**
 * Returns a JST string suitable for `<input type="datetime-local">` : "YYYY-MM-DDTHH:mm"
 */
export function formatJSTForInput(input: string | Date | null | undefined): string {
  const date = parseToDate(input);
  if (isNaN(date.getTime())) return '';
  
  const { year, month, day, hour, minute } = getJSTParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Returns the current date formatted as "YYYY-MM-DD" in JST
 */
export function getCurrentJSTDateOnly(): string {
  return formatJSTDateOnly(new Date());
}

/**
 * Returns an ISO string for database insertion, based on current time.
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Parses user input (from date picker or datetime-local) assuming it's in JST
 * and returns a standard UTC ISO string suitable for Supabase insertion.
 */
export function parseLocalInputAsUTC(input: string): string {
  if (!input) return '';
  if (input.includes('Z') || input.includes('+') || input.match(/-\d{2}:\d{2}$/)) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? input : d.toISOString();
  }
  const isDateOnly = input.length <= 10;
  // Append +09:00 to explicitly parse as JST
  // Ensure we only append :00 if it's "YYYY-MM-DDTHH:mm" format (length 16)
  const base = input.replace(' ', 'T');
  const str = isDateOnly ? `${base}T00:00:00+09:00` : (base.length === 16 ? `${base}:00+09:00` : `${base}+09:00`);
  const date = new Date(str);
  if (isNaN(date.getTime())) return input; // fallback
  return date.toISOString();
}
