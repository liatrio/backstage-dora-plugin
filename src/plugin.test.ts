import {
  DORAMetricsPlugin,
  EntityDORAAtAGlance,
  EntityDORACharts,
} from './plugin';

describe('DORAMetricsPlugin', () => {
  it('should have the correct id', () => {
    expect(DORAMetricsPlugin.getId()).toBe('dora-metrics');
  });

  it('should provide EntityDORAAtAGlance component', () => {
    expect(EntityDORAAtAGlance).toBeDefined();
  });

  it('should provide EntityDORACharts component', () => {
    expect(EntityDORACharts).toBeDefined();
  });
});
