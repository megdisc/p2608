import type { RegionalGradeTableItem, ServiceTypeTableItem } from '../types/db';

/**
 * 事業所の所在地（都道府県・市区町村）と支援種別（人件費割合）に基づき、
 * 地域区分（級地）および地域区分単価（1単位あたり単価・円）を自動算出する
 */
export function calculateRegionalUnitPrice(
  officeAddress: { prefecture?: string; city?: string } | undefined,
  serviceType: ServiceTypeTableItem | undefined,
  regionalGrades: RegionalGradeTableItem[]
): { regional_grade: string; unit_price: number } {
  if (!officeAddress || !officeAddress.prefecture || !officeAddress.city) {
    return { regional_grade: 'その他', unit_price: 10.00 };
  }

  const pref = officeAddress.prefecture.trim();
  const city = officeAddress.city.trim();

  // 1. 都道府県と市区町村の完全一致
  let matched = regionalGrades.find(
    rg => rg.prefecture === pref && rg.city === city
  );

  // 2. 前方一致・部分一致（「広島市中区」と「広島市」など政令指定都市等の配慮）
  if (!matched) {
    matched = regionalGrades.find(
      rg => rg.prefecture === pref && (city.startsWith(rg.city) || rg.city.startsWith(city))
    );
  }

  const grade = matched?.grade || 'その他';
  const premiumRate = matched?.premium_rate !== undefined ? Number(matched.premium_rate) : 0;
  const ratio = serviceType?.personnel_cost_ratio !== undefined ? Number(serviceType.personnel_cost_ratio) : 0.57;

  // 地域区分単価 = 10円 + 10円 × 所在地上乗せ割合 × 支援種別人件費割合 (小数第2位まで四捨五入)
  const unitPrice = Math.round((10 + 10 * premiumRate * ratio) * 100) / 100;

  return {
    regional_grade: grade,
    unit_price: unitPrice,
  };
}
