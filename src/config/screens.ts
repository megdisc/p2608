import { PAGE_NAMES } from '../constants';
import type { Tab } from '../types';

export type ScreenTabConfig = {
  id: Tab;
  label: string;
};

export type ScreenConfig = {
  screenName: string;
  tabs: ScreenTabConfig[];
};

export const SCREEN_CONFIGS: Record<string, ScreenConfig> = {
  SCREEN_DASHBOARD: {
    screenName: PAGE_NAMES.SCREEN_DASHBOARD,
    tabs: [
      { id: 'dashboard', label: PAGE_NAMES.SCREEN_DASHBOARD },
    ],
  },
  SCREEN_DAILY_WORK: {
    screenName: PAGE_NAMES.SCREEN_DAILY_WORK,
    tabs: [
      { id: 'dailyWorkRecord', label: PAGE_NAMES.DAILY_WORK_RECORD },
    ],
  },
  SCREEN_PROJECT: {
    screenName: PAGE_NAMES.SCREEN_PROJECT,
    tabs: [
      { id: 'project', label: PAGE_NAMES.PROJECT_INFO },
      { id: 'budgetPlanning', label: PAGE_NAMES.BUDGET_PLANNING },
      { id: 'assigneeAllocation', label: PAGE_NAMES.ASSIGNEE_ALLOCATION },
      { id: 'projectFinancialRecord', label: PAGE_NAMES.PROJECT_FINANCIAL_RECORD },
      { id: 'progressRecord', label: PAGE_NAMES.PROGRESS_RECORD },
      { id: 'rewardAllocation', label: PAGE_NAMES.REWARD_ALLOCATION },
    ],
  },
  SCREEN_FINANCE: {
    screenName: PAGE_NAMES.SCREEN_FINANCE,
    tabs: [
      { id: 'financialRecord', label: PAGE_NAMES.FINANCIAL_RECORD },
      { id: 'wageSummary', label: PAGE_NAMES.WAGE_SUMMARY },
      { id: 'projectFinancialSummary', label: PAGE_NAMES.PROJECT_FINANCIAL_SUMMARY },
      { id: 'financialSummary', label: PAGE_NAMES.FINANCIAL_SUMMARY },
      { id: 'welfareFinancialSummary', label: PAGE_NAMES.WELFARE_FINANCIAL_SUMMARY },
    ],
  },
  SCREEN_USER: {
    screenName: PAGE_NAMES.SCREEN_USER,
    tabs: [
      { id: 'projectUser', label: PAGE_NAMES.PROJECT_USER },
      { id: 'skillEvaluation', label: PAGE_NAMES.SKILL_EVALUATION },
      { id: 'baseWageAssignment', label: PAGE_NAMES.BASE_WAGE_ASSIGNMENT },
    ],
  },
  SCREEN_STAFF: {
    screenName: PAGE_NAMES.SCREEN_STAFF,
    tabs: [
      { id: 'staff', label: PAGE_NAMES.STAFF },
    ],
  },
  SCREEN_CLIENT: {
    screenName: PAGE_NAMES.SCREEN_CLIENT,
    tabs: [
      { id: 'client', label: PAGE_NAMES.CLIENT },
    ],
  },
  SCREEN_SKILL: {
    screenName: PAGE_NAMES.SCREEN_SKILL,
    tabs: [
      { id: 'skill', label: PAGE_NAMES.SKILL },
      { id: 'skillLevel', label: PAGE_NAMES.SKILL_LEVEL },
    ],
  },
  SCREEN_WAGE: {
    screenName: PAGE_NAMES.SCREEN_WAGE,
    tabs: [
      { id: 'baseWage', label: PAGE_NAMES.BASE_WAGE },
    ],
  },
  SCREEN_COMPOSITION: {
    screenName: 'システム構成（開発用）',
    tabs: [
      { id: 'screenComposition', label: PAGE_NAMES.TAB_SCREEN_COMPOSITION },
      { id: 'tableComposition', label: PAGE_NAMES.TAB_TABLE_COMPOSITION },
      { id: 'mainFeatures', label: PAGE_NAMES.TAB_MAIN_FEATURES },
      { id: 'workflow', label: PAGE_NAMES.TAB_WORKFLOW },
    ],
  }
};

export function getScreenConfigForTab(tabId: Tab): ScreenConfig | null {
  for (const config of Object.values(SCREEN_CONFIGS)) {
    if (config.tabs.some(t => t.id === tabId)) {
      return config;
    }
  }
  return null;
}
