import { createDevApp } from '@backstage/dev-utils';
import { DORAMetricsPlugin } from '../src/plugin';

createDevApp().registerPlugin(DORAMetricsPlugin).render();
