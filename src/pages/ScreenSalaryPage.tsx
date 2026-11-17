import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { SalaryClosingSettingPage } from './SalaryClosingSettingPage';

export function ScreenSalaryPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_SALARY;

  const renderContent = () => {
    switch (navContext.activeTab) {
      case 'salaryClosingDate':
      default:
        return <SalaryClosingSettingPage />;
    }
  };

  const activeTabForDisplay = navContext.activeTab === 'salaryClosingDate' ? 'salaryClosingDate' : 'salaryClosingDate';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={activeTabForDisplay} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
