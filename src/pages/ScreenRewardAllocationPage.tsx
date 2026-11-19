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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>{displayTitle}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
