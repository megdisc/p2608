import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { ServiceTypePage } from './ServiceTypePage';
import { BaseRewardItemPage } from './BaseRewardItemPage';
import { QualificationPage } from './QualificationPage';
import { StaffRoleMasterPage } from './StaffRoleMasterPage';
import { RewardItemPage } from './RewardItemPage';
import { RegionalGradeRatePage } from './RegionalGradeRatePage';
import { RegionalGradeLocationPage } from './RegionalGradeLocationPage';
import { CapacityTierPage } from './CapacityTierPage';
import { StaffingRatioTierPage } from './StaffingRatioTierPage';
import { WageAchievementTierPage } from './WageAchievementTierPage';

export function ScreenWelfarePage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_WELFARE;

  const renderContent = () => {
    switch (navContext.activeTab) {
      case 'serviceType':
        return <ServiceTypePage />;
      case 'baseReward':
        return <BaseRewardItemPage />;
      case 'rewardItem':
        return <RewardItemPage />;
      case 'qualification':
        return <QualificationPage />;
      case 'staffRole':
        return <StaffRoleMasterPage />;
      case 'regionalGradeRate':
        return <RegionalGradeRatePage />;
      case 'regionalGradeLocation':
      case 'regionalGrade': // 後方互換性
        return <RegionalGradeLocationPage />;
      case 'capacityTier':
        return <CapacityTierPage />;
      case 'staffingRatioTier':
        return <StaffingRatioTierPage />;
      case 'wageAchievementTier':
        return <WageAchievementTierPage />;
      default:
        return <ServiceTypePage />;
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs tabs={screenConfig.tabs} activeTab={navContext.activeTab} onChange={navContext.setActiveTab} />
          )}
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
