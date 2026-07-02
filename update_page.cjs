const fs = require('fs');
const content = fs.readFileSync('src/pages/WageSummaryPage.tsx', 'utf8');

const newHeaderRows = `  const headerRows: HeaderCell[][] = [
    [
      { label: '氏名', rowSpan: 2, width: '200px', sortKey: 'name' },
      { label: '工賃', colSpan: 2 },
      { label: '控除', colSpan: 2 },
      { label: '支給額', rowSpan: 2, width: '150px' }
    ],
    [
      { label: '科目' },
      { label: '金額', width: '120px' },
      { label: '科目' },
      { label: '金額', width: '120px' },
    ]
  ];`;

const newBody = `          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              paginatedRows.map(row => {
                const wageItems = [
                  { subject: \`基本工賃（工賃単価¥\${row.wageRate?.toLocaleString() ?? 0}*作業時間\${row.workTime}h）\`, amount: row.basicWage, isBold: false },
                  { subject: '基本工賃合計', amount: row.basicWage, isBold: true },
                  ...row.taskIncentives.map(t => ({ subject: \`インセンティブ（\${t.projectName}：\${t.taskName}）\`, amount: t.amount, isBold: false })),
                  { subject: 'インセンティブ差引', amount: row.basicWage, isBold: false },
                  { subject: 'インセンティブ合計', amount: row.incentiveTotal, isBold: true },
                  { subject: 'その他加算（未設計）', amount: 0, isBold: false },
                  { subject: 'その他加算手当合計', amount: 0, isBold: true },
                  { subject: '工賃合計', amount: row.wageTotal, isBold: true },
                ];
                
                const maxRows = wageItems.length;
                
                return (
                  <React.Fragment key={row.id}>
                    {wageItems.map((item, index) => {
                      const isLast = index === maxRows - 1;
                      return (
                        <tr key={\`\${row.id}-item-\${index}\`}>
                          {index === 0 && (
                            <td rowSpan={maxRows} style={{ verticalAlign: 'top' }}>
                              {row.name}
                            </td>
                          )}
                          <td style={item.isBold ? { fontWeight: 'bold' } : undefined}>
                            {item.subject}
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', ...(item.isBold ? { fontWeight: 'bold' } : {}) }}>
                            {item.amount === null ? '-' : \`¥\${item.amount.toLocaleString()}\`}
                          </td>
                          {isLast ? (
                            <>
                              <td style={{ fontWeight: 'bold' }}>控除合計</td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                                {row.dedTotal === null ? '-' : \`¥\${row.dedTotal.toLocaleString()}\`}
                              </td>
                            </>
                          ) : (
                            <>
                              <td></td>
                              <td></td>
                            </>
                          )}
                          {index === 0 && (
                            <td rowSpan={maxRows} style={{ verticalAlign: 'top', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                              ¥{row.payment.toLocaleString()}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>`;

const importReact = `import React, { useEffect } from 'react';`;

let updated = content.replace(
  /const headerRows: HeaderCell\[\]\[\] = \[[\s\S]*?\];\n/,
  newHeaderRows + '\n'
).replace(
  /<tbody>[\s\S]*?<\/tbody>/,
  newBody
).replace(
  /import \{ useEffect \} from 'react';/,
  importReact
);

fs.writeFileSync('src/pages/WageSummaryPage.tsx', updated);
