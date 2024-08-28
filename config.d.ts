export interface Config {
  /**
   * Frontend root URL
   * NOTE: Visibility applies to only this field
   * @deepVisibility frontend
   */
  dora: {
    dataEndpoint: string;
    teamListEndpoint: string;
    daysToFetch: number;
    includeWeekends?: boolean;
    showDetails?: boolean;
    teams?: string[];
    showTrendGraph?: boolean;
    showIndividualTrends?: boolean;
    rankThresholds?: {
      deployment_frequency?: {
        elite?: number;
        high?: number;
        medium?: number;
      };
      recover_time?: {
        elite?: number;
        high?: number;
        medium?: number;
      };
      change_lead_time?: {
        elite?: number;
        high?: number;
        medium?: number;
      };
      change_failure_rate?: {
        elite?: number;
        high?: number;
        medium?: number;
      };
    };
  };
}
