const fs = require('fs');
const content = fs.readFileSync('src/pages/WageSummaryPage.tsx', 'utf8');

const importReact = `import React, { useEffect, useState } from 'react';`;

const hooksAddition = `  const {
    loading,
    currentMonth,
    setCurrentMonth,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    fetchWageSummary,
    totalPages,
    paginatedRows,
  } = useWageSummary();
  const { showAlert } = useAlert();
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);`;

const newHeaderRows = `  const headerRows: HeaderCell[][] = [
    [
      { label: '氏名', rowSpan: 2, width: '200px', sortKey: 'name' },
      { label: '工賃', colSpan: 3 },
      { label: '控除', colSpan: 3 },
      { label: '支給額', rowSpan: 2, width: '150px' }
    ],
    [
      { label: '科目', width: '150px' },
      { label: '内容' },
      { label: '金額', width: '120px' },
      { label: '科目', width: '150px' },
      { label: '内容' },
      { label: '金額', width: '120px' },
    ]
  ];`;

const newBody = `          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-message">表示するデータがありません</td>
              </tr>
            ) : (
              paginatedRows.map(row => {
                const wageItems = [
                  { subject: '基本工賃', content: \`工賃単価¥\${row.wageRate?.toLocaleString() ?? 0}*作業時間\${row.workTime}h\`, amount: row.basicWage, isBold: false },
                  { subject: '基本工賃合計', content: '', amount: row.basicWage, isBold: true },
                  ...row.taskIncentives.map(t => ({ subject: 'インセンティブ', content: \`\${t.projectName}：\${t.taskName}\`, amount: t.amount, isBold: false })),
                  { subject: 'インセンティブ差引', content: '', amount: row.basicWage, isBold: false },
                  { subject: 'インセンティブ合計', content: '', amount: row.incentiveTotal, isBold: true },
                  { subject: 'その他加算', content: '未設計', amount: 0, isBold: false },
                  { subject: 'その他加算手当合計', content: '', amount: 0, isBold: true },
                  { subject: '工賃合計', content: '', amount: row.wageTotal, isBold: true },
                ];
                
                const maxRows = wageItems.length;
                
                return (
                  <React.Fragment key={row.id}>
                    {wageItems.map((item, index) => {
                      const isLast = index === maxRows - 1;
                      return (
                        <tr 
                          key={\`\${row.id}-item-\${index}\`}
                          onMouseEnter={() => setHoveredMemberId(isLast ? row.id : null)}
                          onMouseLeave={() => setHoveredMemberId(null)}
                        >
                          {index === 0 && (
                            <td 
                              rowSpan={maxRows} 
                              style={{ 
                                verticalAlign: 'top',
                                backgroundColor: hoveredMemberId === row.id ? 'var(--color-bg-subtle)' : undefined,
                                transition: 'background-color 0.2s'
                              }}
                            >
                              {row.name}
                            </td>
                          )}
                          <td style={item.isBold ? { fontWeight: 'bold' } : undefined}>
                            {item.subject}
                          </td>
                          <td style={item.isBold ? { fontWeight: 'bold' } : undefined}>
                            {item.content}
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', ...(item.isBold ? { fontWeight: 'bold' } : {}) }}>
                            {item.amount === null ? '-' : \`¥\${item.amount.toLocaleString()}\`}
                          </td>
                          {isLast ? (
                            <>
                              <td style={{ fontWeight: 'bold' }}>控除合計</td>
                              <td></td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                                {row.dedTotal === null ? '-' : \`¥\${row.dedTotal.toLocaleString()}\`}
                              </td>
                            </>
                          ) : (
                            <>
                              <td></td>
                              <td></td>
                              <td></td>
                            </>
                          )}
                          {isLast ? (
                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                              ¥{row.payment.toLocaleString()}
                            </td>
                          ) : (
                            <td></td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>`;

let updated = content.replace(
  /import React, \{ useEffect \} from 'react';/,
  importReact
).replace(
  /  const \{\n    loading,[\s\S]*?const \{ showAlert \} = useAlert\(\);/,
  hooksAddition
).replace(
  /  const headerRows: HeaderCell\[\]\[\] = \[[\s\S]*?\];\n/,
  newHeaderRows + '\\n'
).replace(
  /          <tbody>[\s\S]*?<\/tbody>/,
  newBody
);

fs.writeFileSync('src/pages/WageSummaryPage.tsx', updated);
