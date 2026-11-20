import { WORDS_PROJECT } from '../constants';

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
    const isMonthOnly = str.length === 7;
    const isDateOnly = str.length <= 10 && !isMonthOnly;
    
    if (isMonthOnly) {
      str += '-01T00:00:00+09:00';
    } else if (isDateOnly) {
      str += 'T00:00:00+09:00';
    } else if (str.length === 16) {
      str += ':00+09:00';
    } else {
      str += '+09:00';
    }
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
 * Returns a JST string for UI display: "YYYY年MM月DD日"
 */
export function formatDateJP(input: string | Date | null | undefined): string {
  const date = parseToDate(input);
  if (isNaN(date.getTime())) return typeof input === 'string' ? input : '';
  
  const { year, month, day } = getJSTParts(date);
  return `${year}年${month}月${day}日`;
}

/**
 * Returns a JST string for UI display: "YYYY年MM月"
 */
export function formatMonthJP(input: string | Date | null | undefined): string {
  const date = parseToDate(input);
  if (isNaN(date.getTime())) return typeof input === 'string' ? input : '';
  
  const { year, month } = getJSTParts(date);
  return `${year}年${month}月`;
}

/**
 * Returns a JST string for UI display: "YYYY年"
 */
export function formatYearJP(input: string | Date | null | undefined): string {
  const date = parseToDate(input);
  if (isNaN(date.getTime())) return typeof input === 'string' ? input : '';
  
  const { year } = getJSTParts(date);
  return `${year}年`;
}

/**
 * 時刻文字列（例: "09:30:00", "09:30", "9:30", または ISO 文字列）を "HH:mm" 形式にフォーマットする
 */
export function formatTime(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // ISO文字列または "YYYY-MM-DDTHH:mm:ss" の場合
  if (trimmed.includes('T')) {
    const timePart = trimmed.split('T')[1];
    return timePart ? timePart.substring(0, 5) : '';
  }

  // "HH:mm:ss" または "H:mm" の場合
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }

  return trimmed.substring(0, 5);
}

/**
 * 開始時刻・終了時刻から "HH:mm 〜 HH:mm" の範囲文字列をフォーマットする
 */
export function formatTimeRange(start?: string | null, end?: string | null, fallback = '-'): string {
  const fStart = formatTime(start);
  const fEnd = formatTime(end);
  if (fStart && fEnd) {
    return `${fStart} 〜 ${fEnd}`;
  }
  if (fStart) return fStart;
  if (fEnd) return fEnd;
  return fallback;
}

/**
 * UIの時刻文字列（"HH:mm"）をDB保存用（"HH:mm:00"）に整形する
 */
export function formatTimeForDb(timeStr?: string | null): string | null {
  if (!timeStr || typeof timeStr !== 'string' || timeStr.trim() === '') return null;
  const trimmed = timeStr.trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
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
 * Returns the current year and month formatted as "YYYY-MM" in JST
 */
export function getCurrentJSTMonth(): string {
  const dateOnly = getCurrentJSTDateOnly();
  return dateOnly.substring(0, 7);
}

/**
 * Given a "YYYY-MM" string, returns the previous month "YYYY-MM"
 */
export function getPreviousMonth(yearMonth: string): string {
  if (!yearMonth || yearMonth.length < 7) return yearMonth;
  const [yearStr, monthStr] = yearMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  
  if (isNaN(year) || isNaN(month)) return yearMonth;
  
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Given a "YYYY-MM-DD" date string, returns the previous day formatted as "YYYY-MM-DD"
 */
export function getPreviousDay(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const [yStr, mStr, dStr] = dateStr.substring(0, 10).split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  
  const resY = date.getUTCFullYear();
  const resM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const resD = String(date.getUTCDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
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

/**
 * 基準日設定（月区分・日）と対象年月から、具体的な日付（YYYY-MM-DD）を算出する
 */
export function calcPaymentDate(
  yearMonth: string,
  setting?: {
    monthType?: 'current' | 'next' | 'next_next' | string | null;
    payment_month_type?: 'current' | 'next' | 'next_next' | string | null;
    day?: number | string | null;
    payment_day?: number | string | null;
  }
): string {
  if (!yearMonth || !yearMonth.includes('-')) return '';
  const [yearStr, monthStr] = yearMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10); // 1-12

  const monthType = setting?.monthType || setting?.payment_month_type || 'next';
  const rawDay = setting?.day !== undefined ? setting?.day : setting?.payment_day;
  const targetDay = Number(rawDay) || 99;

  if (monthType === 'next') {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  } else if (monthType === 'next_next') {
    month += 2;
    if (month > 12) {
      month -= 12;
      year += 1;
    }
  }

  // その月の末日を取得
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = (targetDay === 99 || targetDay > daysInMonth) ? daysInMonth : targetDay;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 工賃基準日設定と対象年月から、工賃支給日（取引時期）を自動算出する（互換用）
 */
export function calcWagePaymentDate(
  yearMonth: string,
  closingSetting?: {
    payment_month_type?: 'current' | 'next' | 'next_next';
    payment_day?: number;
  }
): string {
  return calcPaymentDate(yearMonth, closingSetting);
}

export interface DefaultTransactionDateContext {
  targetYearMonth?: string;
  client?: any | null; // 案件の取引先（顧客、または外注先）
  outsourceClient?: any | null; // 外注先
  salaryClosingSetting?: { payment_month_type?: any; payment_day?: any } | null;
  wageClosingSetting?: { payment_month_type?: any; payment_day?: any } | null;
  reserveSettings?: any[] | null;
}

/**
 * 勘定科目に応じた取引時期（デフォルト日付 YYYY-MM-DD）を算出する
 * - 就労支援事業収益：当該取引先顧客の入金日
 * - 外注加工費：当該取引先外注先への支払日（出金日）
 * - 材料費：本日の日付
 * - 経費：本日の日付
 * - 労務費（利用者工賃以外）：給与体系画面の給与支給日
 * - 労務費（利用者工賃）：工賃・控除体系画面で定義した工賃支給日
 * - 工賃変動積立金・設備等修繕維持積立金（繰入・取崩）：積立金画面で定義した各日付
 */
export function getDefaultTransactionDate(
  subject: string,
  context: DefaultTransactionDateContext = {}
): string {
  const ym = context.targetYearMonth || getCurrentJSTMonth();
  const today = getCurrentJSTDateOnly();

  // 1. 就労支援事業収益：当該取引先顧客の入金日
  if (
    subject === WORDS_PROJECT.SUBJECT_REVENUE_SALES ||
    subject.includes('就労支援事業収益') ||
    subject.includes('売上高')
  ) {
    const c = context.client;
    if (c) {
      const monthType = c.customerPaymentMonthType || c.customer_payment_month_type;
      const day = c.customerPaymentDay || c.customer_payment_day;
      if (monthType || day) {
        return calcPaymentDate(ym, { monthType, day });
      }
    }
    // デフォルト（翌月末日）
    return calcPaymentDate(ym, { monthType: 'next', day: 99 });
  }

  // 2. 外注加工費：当該取引先外注先への支払日（出金日）
  if (
    subject === WORDS_PROJECT.SUBJECT_EXPENSE_OUTSOURCE ||
    subject.includes('外注加工費')
  ) {
    const c = context.outsourceClient || context.client;
    if (c) {
      const monthType = c.subcontractorPaymentMonthType || c.subcontractor_payment_month_type;
      const day = c.subcontractorPaymentDay || c.subcontractor_payment_day;
      if (monthType || day) {
        return calcPaymentDate(ym, { monthType, day });
      }
    }
    // デフォルト（翌月末日）
    return calcPaymentDate(ym, { monthType: 'next', day: 99 });
  }

  // 3. 材料費：本日の日付
  if (
    subject === WORDS_PROJECT.SUBJECT_EXPENSE_MATERIAL ||
    subject.includes('材料費')
  ) {
    return today;
  }

  // 4. 経費：本日の日付
  if (
    subject === WORDS_PROJECT.SUBJECT_EXPENSE_OTHER ||
    subject.includes('経費')
  ) {
    return today;
  }

  // 5. 労務費（利用者工賃以外）：給与体系画面の給与支給日
  if (
    subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER ||
    subject.includes('労務費（利用者工賃以外）') ||
    subject.includes('職員等労務費') ||
    subject.includes('職員給与')
  ) {
    const s = context.salaryClosingSetting;
    return calcPaymentDate(ym, {
      monthType: s?.payment_month_type || 'next',
      day: s?.payment_day || 10,
    });
  }

  // 6. 労務費（利用者工賃）：工賃・控除体系画面で定義した工賃支給日
  if (
    subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER ||
    subject.includes('労務費（利用者工賃）') ||
    subject.includes('利用者工賃') ||
    subject === '工賃'
  ) {
    const w = context.wageClosingSetting;
    return calcPaymentDate(ym, {
      monthType: w?.payment_month_type || 'next',
      day: w?.payment_day || 10,
    });
  }

  // 7. 工賃変動積立金・設備等修繕維持積立金（繰入・取崩）
  if (
    subject.includes('工賃変動積立金') ||
    subject.includes('設備等修繕維持積立金') ||
    subject.includes('積立金')
  ) {
    const isWageReserve = subject.includes('工賃変動');
    const isWithdrawal = subject.includes('取崩');

    const matchedItem = (context.reserveSettings || []).find(r => {
      const type = r.reserveType || r.name || '';
      return isWageReserve ? type.includes('工賃変動') : type.includes('設備等修繕');
    });

    if (matchedItem) {
      if (isWithdrawal) {
        return calcPaymentDate(ym, {
          monthType: matchedItem.transferOutMonthType || matchedItem.transfer_out_month_type,
          day: matchedItem.transferOutDay || matchedItem.transfer_out_day,
        });
      } else {
        return calcPaymentDate(ym, {
          monthType: matchedItem.transferInMonthType || matchedItem.transfer_in_month_type,
          day: matchedItem.transferInDay || matchedItem.transfer_in_day,
        });
      }
    }
    // デフォルト（翌月末日）
    return calcPaymentDate(ym, { monthType: 'next', day: 99 });
  }

  return today;
}
