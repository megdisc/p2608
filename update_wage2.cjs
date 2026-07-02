const fs = require('fs');
const content = fs.readFileSync('src/pages/WageSummaryPage.tsx', 'utf8');

const oldArrayRegex = /const wageItems = \[\s*\{ subject: '基本工賃'[\s\S]*?\];/;
const newArray = `const incentiveRows = row.taskIncentives.length > 0 
                  ? [
                      ...row.taskIncentives.map((t, i) => ({ 
                        subject: 'インセンティブ', 
                        content: \`\${t.projectName}：\${t.taskName}\`, 
                        amount: t.amount, 
                        isBold: false,
                        rowSpan: i === 0 ? row.taskIncentives.length + 2 : undefined,
                        hideSubject: i > 0
                      })),
                      { subject: 'インセンティブ', content: 'インセンティブ差引', amount: row.basicWage, isBold: false, hideSubject: true },
                      { subject: 'インセンティブ', content: 'インセンティブ合計', amount: row.incentiveTotal, isBold: true, hideSubject: true }
                    ]
                  : [
                      { subject: 'インセンティブ', content: 'インセンティブ差引', amount: row.basicWage, isBold: false, rowSpan: 2 },
                      { subject: 'インセンティブ', content: 'インセンティブ合計', amount: row.incentiveTotal, isBold: true, hideSubject: true }
                    ];

                const wageItems = [
                  { subject: '基本工賃', content: \`工賃単価¥\${row.wageRate?.toLocaleString() ?? 0}*作業時間\${row.workTime}h\`, amount: row.basicWage, isBold: false, rowSpan: 2 },
                  { subject: '基本工賃', content: '基本工賃合計', amount: row.basicWage, isBold: true, hideSubject: true },
                  ...incentiveRows,
                  { subject: 'その他加算', content: '未設計', amount: 0, isBold: false, rowSpan: 2 },
                  { subject: 'その他加算', content: 'その他加算合計', amount: 0, isBold: true, hideSubject: true },
                  { subject: '工賃合計', content: '', amount: row.wageTotal, isBold: true },
                ];`;

const oldMapRegex = /<td style=\{item\.isBold \? \{ fontWeight: 'bold' \} : undefined\}>\s*\{item\.subject\}\s*<\/td>/;
const newMap = `{!item.hideSubject && (
                            <td 
                              rowSpan={item.rowSpan}
                              style={item.isBold ? { fontWeight: 'bold', verticalAlign: 'top' } : { verticalAlign: 'top' }}
                            >
                              {item.subject}
                            </td>
                          )}`;

let updated = content.replace(oldArrayRegex, newArray);
updated = updated.replace(oldMapRegex, newMap);

fs.writeFileSync('src/pages/WageSummaryPage.tsx', updated);
