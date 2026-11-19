import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { SkillCategoryPage } from './SkillCategoryPage';
import { SkillPage } from './SkillPage';
import { SkillLevelPage } from './SkillLevelPage';

export function ScreenSkillPage() {
  const navContext = useNavigation();
  const effectiveTab = navContext.activeTab === 'screenSkill' ? 'skill' : navContext.activeTab;
  const screenConfig = getScreenConfigForTab(effectiveTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_SKILL;

  const renderContent = () => {
    switch (effectiveTab) {
      case 'skillCategory':
        return <SkillCategoryPage />;
      case 'skill':
        return <SkillPage />;
      case 'skillLevel':
        return <SkillLevelPage />;
      default:
        return <SkillPage />;
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={effectiveTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
