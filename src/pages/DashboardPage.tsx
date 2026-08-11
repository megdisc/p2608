
import { PAGE_NAMES } from '../constants';

export function DashboardPage() {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ margin: 0 }}>{PAGE_NAMES.SCREEN_DASHBOARD}</h2>
      </div>
      
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
          <h3 style={{ fontSize: 'var(--text-heading-3)', color: 'var(--color-text-main)', margin: '0 0 var(--space-3) 0' }}>サマリー</h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: 0 }}>データは現在準備中です。</p>
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
          <h3 style={{ fontSize: 'var(--text-heading-3)', color: 'var(--color-text-main)', margin: '0 0 var(--space-3) 0' }}>最近のアクティビティ</h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: 0 }}>データは現在準備中です。</p>
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
          <h3 style={{ fontSize: 'var(--text-heading-3)', color: 'var(--color-text-main)', margin: '0 0 var(--space-3) 0' }}>通知</h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-muted)', margin: 0 }}>新しい通知はありません。</p>
        </div>
      </div>
    </>
  );
}
