import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab, SCREEN_CONFIGS } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { CalculationFormulaPage } from './CalculationFormulaPage';

export function ScreenCalculationFormulaPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_CALCULATION_FORMULA;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.CALCULATION_FORMULA;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={navContext.activeTab === 'calculationFormula' ? 'calculationFormula' : screenConfig.tabs[0]?.id || 'calculationFormula'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>
      <CalculationFormulaPage />
    </>
  );
}
