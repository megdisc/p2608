import { useState } from 'react';
import { PAGE_NAMES } from '../constants';
import { useNavigation } from '../contexts';
import type { Tab } from '../types';

type QuickAccessItem = {
  id: string;
  title: string;
  subtitle: string;
  tab: Tab;
  icon: React.ReactNode;
  categoryTag?: string;
};

export function DashboardPage() {
  const { setActiveTab } = useNavigation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 4行 × 3列 のワーク一覧（不定期、日次定期、月次定期、年次定期・低頻度）
  const quickAccessItems: QuickAccessItem[] = [
    // 1行目: 不定期のワーク
    {
      id: 'work-schedule-change',
      title: '予定変更',
      subtitle: '利用者・職員の通所・勤務予定の確認・変更',
      tab: 'scheduleMember',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
          <path d="M12 14l2 2 4-4"></path>
        </svg>
      )
    },
    {
      id: 'work-project-manage',
      title: '案件登録・変更',
      subtitle: '新規受託案件の登録・仕様や期間の変更',
      tab: 'project',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          <line x1="12" y1="11" x2="12" y2="17"></line>
          <line x1="9" y1="14" x2="15" y2="14"></line>
        </svg>
      )
    },
    {
      id: 'work-finance-check',
      title: '収支確認',
      subtitle: '就労支援事業・福祉事業の収支状況の確認',
      tab: 'financialSummary',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },

    // 2行目: 日次定期のワーク
    {
      id: 'work-member-daily',
      title: '利用者日報',
      subtitle: '利用者の日次作業実績・作業時間の入力・記録',
      tab: 'dailyWorkRecord',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      id: 'work-staff-daily',
      title: '職員日報',
      subtitle: '職員の勤務実績・支援業務内容の記録',
      tab: 'staffAttendanceRecord',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <polyline points="16 11 18 13 22 9"></polyline>
        </svg>
      )
    },
    {
      id: 'work-daily-confirm',
      title: '日報確定',
      subtitle: '当日の日次実績および作業記録の確定・ロック',
      tab: 'dailyWorkRecord',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    },

    // 3行目: 月次定期のワーク
    {
      id: 'work-project-progress',
      title: '案件進捗確認',
      subtitle: '案件タスクの進捗状況および累計作業時間の確認',
      tab: 'progressRecord',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      )
    },
    {
      id: 'work-project-settlement',
      title: '案件精算',
      subtitle: '月次・完了案件の売上・経費精算およびインセンティブ配分',
      tab: 'rewardAllocation',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
          <line x1="12" y1="6" x2="12" y2="8"></line>
          <line x1="12" y1="16" x2="12" y2="18"></line>
        </svg>
      )
    },
    {
      id: 'work-monthly-closing',
      title: '月次決算',
      subtitle: '月次工賃計算の確定および決算収支スナップショットの生成',
      tab: 'wageSummary',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },

    // 4行目: 年次定期・低頻度ワーク
    {
      id: 'work-certificate-renewal',
      title: '受給者証更新',
      subtitle: '障害福祉サービス受給者証の有効期限・支給量の更新',
      tab: 'memberRecipientCertificate',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      )
    },
    {
      id: 'work-skill-evaluation',
      title: 'スキル評価',
      subtitle: '利用者の作業スキル評価・習熟レベルの定期見直し',
      tab: 'skillEvaluation',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      )
    },
    {
      id: 'work-base-wage-evaluation',
      title: '基本工賃評価',
      subtitle: '利用者の基本工賃単価の適用・改定評価',
      tab: 'baseWageAssignment',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20"></path>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          <polyline points="7 17 12 22 17 17"></polyline>
        </svg>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.SCREEN_DASHBOARD}</h2>
      </div>

      {/* クイックアクセスセクション */}
      <section style={{ marginBottom: 'var(--space-8, 32px)' }}>
        <h3 style={{
          fontSize: 'var(--text-heading-3, 16px)',
          fontWeight: 'var(--weight-heading, 600)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4, 16px) 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          クイックアクセス
        </h3>

        {/* 4行 × 3列 のグリッド配置 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 'var(--space-4, 16px)'
        }}>
          {quickAccessItems.map(item => {
            const isHovered = hoveredId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 18px',
                  backgroundColor: isHovered ? 'var(--color-bg-subtle, #f8f9fa)' : 'var(--color-bg-main, #ffffff)',
                  border: isHovered ? '1px solid var(--color-border-focus, #555555)' : '1px solid var(--color-border, #e0e0e0)',
                  borderRadius: 'var(--radius-lg, 8px)',
                  boxShadow: isHovered ? 'var(--shadow-md, 0 4px 8px rgba(0,0,0,0.08))' : 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease-in-out',
                  transform: isHovered ? 'translateY(-1px)' : 'none',
                  position: 'relative',
                  width: '100%',
                  color: 'inherit',
                  fontFamily: 'inherit'
                }}
              >
                {/* アイコン枠 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md, 6px)',
                  backgroundColor: isHovered ? 'var(--color-bg-inverse, #222222)' : 'var(--color-bg-subtle, #f0f2f5)',
                  color: isHovered ? 'var(--color-text-inverse, #ffffff)' : 'var(--color-text-main, #333333)',
                  flexShrink: 0,
                  transition: 'background-color 0.15s ease, color 0.15s ease'
                }}>
                  {item.icon}
                </div>

                {/* テキストコンテンツ */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 'var(--weight-heading, 600)',
                      color: 'var(--color-text-main, #222222)',
                      lineHeight: '1.3'
                    }}>
                      {item.title}
                    </div>
                    {/* 遷移矢印アイコン */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isHovered ? 'var(--color-text-main, #222222)' : 'var(--color-text-muted, #999999)'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isHovered ? 'translateX(2px)' : 'none',
                        transition: 'transform 0.15s ease, stroke 0.15s ease',
                        flexShrink: 0,
                        marginLeft: '8px'
                      }}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-muted, #666666)',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 下部サマリー・インフォメーション */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-6)'
      }}>
        {/* Placeholder Card 1 */}
        <div style={{
          backgroundColor: 'var(--color-bg-main)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 'var(--text-heading-3)', color: 'var(--color-text-main)', margin: '0 0 var(--space-3) 0' }}>月次サマリー</h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: 0 }}>当月および前月の実績データ集計表示エリアです。</p>
        </div>

        {/* Placeholder Card 2 */}
        <div style={{
          backgroundColor: 'var(--color-bg-main)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 'var(--text-heading-3)', color: 'var(--color-text-main)', margin: '0 0 var(--space-3) 0' }}>最近の確定履歴</h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: 0 }}>直近の日次日報・月次精算の確定履歴を表示します。</p>
        </div>

        {/* Placeholder Card 3 */}
        <div style={{
          backgroundColor: 'var(--color-bg-main)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 'var(--text-heading-3)', color: 'var(--color-text-main)', margin: '0 0 var(--space-3) 0' }}>システム通知</h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: 0 }}>更新予定の受給者証や期限アラートを表示します。</p>
        </div>
      </div>
    </>
  );
}
