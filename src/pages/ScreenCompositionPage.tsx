import { PAGE_NAMES } from '../constants';

export function ScreenCompositionPage() {
  const rows = [
    {
      screen: PAGE_NAMES.SCREEN_PROJECT,
      tab: ['案件情報', '予算編成', '担当者割当', '進捗状況', '案件状況集計'],
      existing: ['案件情報', '予算編成', '担当者割当', '進捗状況', '案件状況集計'],
    },
    {
      screen: PAGE_NAMES.SCREEN_USER,
      tab: ['利用者マスタ', '職員マスタ', '日次作業記録', '担当状況集計'],
      existing: ['利用者設定', '職員設定', '日次作業記録', '担当状況集計'],
    },
    {
      screen: PAGE_NAMES.SCREEN_CLIENT,
      tab: ['取引先マスタ'],
      existing: ['取引先設定'],
    },
    {
      screen: PAGE_NAMES.SCREEN_FINANCE,
      tab: ['報酬配分', '収支記録'],
      existing: ['報酬配分', '収支記録'],
    },
    {
      screen: PAGE_NAMES.SCREEN_SKILL,
      tab: ['スキルマスタ', 'スキルレベル設定', 'スキル評価'],
      existing: ['スキル設定', 'スキルレベル設定', 'スキル評価'],
    },
    {
      screen: PAGE_NAMES.SCREEN_WAGE,
      tab: ['工賃単価設定', '工賃単価割当', '工賃・控除集計'],
      existing: ['工賃単価設定', '工賃単価割当', '工賃・控除集計'],
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>画面構成表</h2>
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th style={{ width: '200px' }}>画面</th>
              <th>タブ</th>
              <th>既存の画面名称</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ verticalAlign: 'top', fontWeight: 'bold' }}>{row.screen}</td>
                <td style={{ verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {row.tab.map((item, idx) => (
                      <div key={idx}>{item}</div>
                    ))}
                  </div>
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {row.existing.map((item, idx) => (
                      <div key={idx}>{item}</div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
