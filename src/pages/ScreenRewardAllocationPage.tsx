import { PAGE_NAMES } from '../constants';
import { SCREEN_CONFIGS, getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';
import { RewardAllocationPage } from './RewardAllocationPage';

export function ScreenRewardAllocationPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab) || SCREEN_CONFIGS.SCREEN_REWARD_ALLOCATION;
  const displayTitle = screenConfig?.screenName || PAGE_NAMES.SCREEN_REWARD_ALLOCATION;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">{displayTitle}</h2>
        <div className="page-header-actions">
          {screenConfig && (
            <Tabs
              tabs={screenConfig.tabs}
              activeTab={'rewardAllocation'}
              onChange={navContext.setActiveTab}
            />
          )}
        </div>
      </div>

      <RewardAllocationPage />
    </>
  );
}
