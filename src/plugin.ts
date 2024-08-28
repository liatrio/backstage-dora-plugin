import {
  createComponentExtension,
  createPlugin,
  createRouteRef,
} from '@backstage/core-plugin-api';

export const entityContentRouteRef = createRouteRef({
  id: 'dora-metrics',
});

export const DORAMetricsPlugin = createPlugin({
  id: 'dora-metrics',
  routes: {
    entityContent: entityContentRouteRef,
  },
});

export const EntityDORAAtAGlance = DORAMetricsPlugin.provide(
  createComponentExtension({
    name: 'EntityDORAAtAGlance',
    component: {
      lazy: () => import('./components/AtAGlance').then((m) => m.AtAGlance),
    },
  })
);

export const EntityDORACharts = DORAMetricsPlugin.provide(
  createComponentExtension({
    name: 'EntityDORACharts',
    component: {
      lazy: () => import('./components/Charts').then((m) => m.Charts),
    },
  })
);
