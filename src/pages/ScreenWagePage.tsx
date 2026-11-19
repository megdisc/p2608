import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { BaseWagePage } from './BaseWagePage';
import { AllowancePage } from './AllowancePage';
import { DeductionPage } from './DeductionPage';
import { WageClosingSettingPage } from './WageClosingSettingPage';

export function ScreenWagePage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_WAGE;
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_WAGE;

  const renderContent = () => {
    switch (navContext.activeTab) {
      case 'baseWage':
        return <BaseWagePage />;
      case 'allowance':
        return <AllowancePage />;
      case 'deduction':
        return <DeductionPage />;
      case 'closingDate':
        return <WageClosingSettingPage />;
      default:
        return <BaseWagePage />;
    }
  };

  const activeTabForDisplay = ['baseWage', 'allowance', 'deduction', 'closingDate'].includes(navContext.activeTab)
    ? navContext.activeTab
    : 'baseWage';

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={activeTabForDisplay} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
