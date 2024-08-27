export interface Config {
  /**
   * Frontend root URL
   * NOTE: Visibility applies to only this field
   * @deepVisibility frontend
   */
  dora: {
    dataEndpoint: string
    teamListEndpoint: string
    showWeekends: boolean
    includeWeekends: boolean
    showDetails: boolean
    teams: string[]
    rankThresholds: {
      deployment_frequency: {
        elite: number,
        high: number,
        medium: number,
        low: number,
      },
      recover_time: {
        elite: number,
        high: number,
        medium: number,
        low: number,
      },
      change_lead_time: {
        elite: number,
        high: number,
        medium: number,
        low: number,
      },
      change_failure_rate: {
        elite: number,
        high: number,
        medium: number,
        low: number,
      }
    }
  };
}