import { PAGE_NAMES } from '../constants';
import { getScreenConfigForTab } from '../config';
import { useNavigation } from '../contexts';
import { Tabs } from '../components/ui';

import { ProjectUserPage } from './ProjectUserPage';
import { SkillEvaluationPage } from './SkillEvaluationPage';
import { BaseWageAssignmentPage } from './BaseWageAssignmentPage';
import { DailyWorkRecordPage } from './DailyWorkRecordPage';
import { AssigneeSummaryPage } from './AssigneeSummaryPage';

export function ScreenUserPage() {
  const navContext = useNavigation();
  const screenConfig = getScreenConfigForTab(navContext.activeTab);
  const displayTitle = screenConfig ? screenConfig.screenName : PAGE_NAMES.SCREEN_USER;

  const renderContent = () => {
    switch (navContext.activeTab) {
      case 'projectUser':
        return <ProjectUserPage />;
      case 'skillEvaluation':
        return <SkillEvaluationPage />;
      case 'baseWageAssignment':
        return <BaseWageAssignmentPage />;
      case 'dailyWorkRecord':
        return <DailyWorkRecordPage />;
      case 'assigneeSummary':
        return <AssigneeSummaryPage />;
      default:
        return <ProjectUserPage />;
    }
  };

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
      
      {renderContent()}
    </>
  );
}
