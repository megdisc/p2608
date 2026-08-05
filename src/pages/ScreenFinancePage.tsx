
import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { FinancialRecordPage } from './FinancialRecordPage';
import { FinancialSummaryPage } from './FinancialSummaryPage';
import { WageSummaryPage } from './WageSummaryPage';

export function ScreenFinancePage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_FINANCE;
  const isSummary = navContext.activeTab === 'financialSummary';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={navContext.activeTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {navContext.activeTab === 'wageSummary' ? <WageSummaryPage /> : isSummary ? <FinancialSummaryPage /> : <FinancialRecordPage />}
    </>
  );
}
