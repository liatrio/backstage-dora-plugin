# Badges

[![CodeQL](https://github.com/liatrio/backstage-liatrio-dora-plugin/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/liatrio/backstage-liatrio-dora-plugin/actions/workflows/codeql.yml)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[![Release](https://github.com/liatrio/backstage-dora-plugin/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/liatrio/backstage-dora-plugin/actions/workflows/release.yml)

![GitHub top language](https://img.shields.io/github/languages/top/liatrio/backstage-dora-plugin)

# Introduction

This is a plugin for the [Backstage](https://backstage.io/) Project that provides a seamless way to display [DORA Metrics](https://dora.dev/guides/dora-metrics-four-keys/) in your developer portals.

Our goal is to provide an Open Source plugin that works with the Open Telemetry backend collecting your DORA metrics in a non-opinionated manner.

**This plugin is currently loosely tied to GitHub and Loki DB, we plan to expand to GitLab and other platforms in the future**

# Components

## `At A Glance`

This offers you a quick view of the state of a component or team.

Depending on how you have set up your configuration for this plugin, it will show:

- The individual DORA Metrics for the last 30 days
  - `Deployment Frequency`- The average how often you are deploying, failed or successful
    - Weekends, unless included, and holidays, if set, are subtracted from timespans that go over them
  - `Change Lead Time` - The average of time merged to `main` to deployment success
    - Weekends, unless included, and holidays, if set, are subtracted from timespans that go over them
  - `Change Failure Rate` - The average number of changes that result in a failed deployment
  - `Recovery Time` - The average of a failed deployment to the next successful deployment
    - Regardless of configuration, includes weekends and does not subtract the holidays if set.
- The DORA Metrics overall trend over the last 30 days
  - The Trend is calculated on a per-week basis
  - If a component has gone stale or is too new, you will see a note about there not being enough data to render a trend.
  - There is an option to also show each DORA Metric as a line on the graph, a legend will appear in this case

Here are some examples:

| Metric View with Details Always Showing                                                                                     | Metric View with Details on Hover                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ![Metrics](https://raw.githubusercontent.com/liatrio/backstage-dora-plugin/main/screenshots/ranked/atAGlance.png 'Metrics') | ![Metrics](https://raw.githubusercontent.com/liatrio/backstage-dora-plugin/main/screenshots/ranked/atAGlance_hover.png?raw=true 'Metrics') |

| Overall Trend View                                                                                                              | Overall Trend View with Individual Metric Trends                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --- |
| ![Trend](https://raw.githubusercontent.com/liatrio/backstage-dora-plugin/main/screenshots/trend/atAGlance.png?raw=true 'Trend') | ![Trend](https://raw.githubusercontent.com/liatrio/backstage-dora-plugin/main/screenshots/trend/atAGlanceIndividual.png?raw=true 'Trend') |     |

## `Charts`

This is a set of charts that for the DORA metrics.

It has two different modes `Team View` and `Component View`:

- `Component View` - You will see this when you access a specific Component in the Catalog.
- `Team View` - You will see this when you access the `DORA Metrics` sidebar navigation.

Here are some examples:

| Component View                                                                                                                 | Team View                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| ![Metrics](https://raw.githubusercontent.com/liatrio/backstage-dora-plugin/main/screenshots/ranked/tab.png?raw=true 'Metrics') | ![Trend](https://raw.githubusercontent.com/liatrio/backstage-dora-plugin/main/screenshots/trend/teamView.png?raw=true 'Trend') |

# Dependencies

This plugin relies on the following dependencies:

- [Liatrio DORA React Components](https://github.com/liatrio/react-dora-charts)
- [Liatrio OTel Collector](https://github.com/liatrio/liatrio-otel-collector)
- An instance of Loki DB
  - **You can swap out for any Time Series DB, but you will need to fork and modify the [Liatrio DORA API](https://github.com/liatrio/liatrio-dora-api) to do so**
- A GitHub Organization hosting your repositories
  - **We will expand this to more platforms in the future**

# Installation of Dependencies

## Docker Compose

In the `dependencies` folder, you will find a docker-compose file. Using this will spin up the following in docker containers:

- An instance of Loki DB with persistent storage
- An instance of Promtail, which is required by Loki DB
- An instance of an OTel Collector configured to accept events from GitHub
- An instance of the [Liatrio DORA API](https://github.com/liatrio/liatrio-dora-api), which this plugin can call to get the data it needs

You will need to update the `.env` file with your `GitHub Org`, `User` and `PAT` (with full repo access) for the API to be able to return a list of teams

## Kubernetes

If you have a Kubernetes Cluster, we have a quick start guide that installs `Loki DB` and [Liatrio OTel Collector](https://github.com/liatrio/liatrio-otel-collector) (among a few other tools) that can be found [here](https://github.com/liatrio/tag-o11y-quick-start-manifests)

This quick start manifest does not set up the [Liatrio DORA API](https://github.com/liatrio/liatrio-dora-api) or any other API which you would need to sit between this plugin and the Loki DB.

## Configuring GitHub

Once you have the dependencies configured and running, you will need to update your GitHub Organization to send events to the OTel Collector.

You can do this by setting up a new `Webhook` and configuring the `Webhook` to send the following events:

- Deployments
- Issues
- Pull Requests
- Deployment Statuses

# Installation into Backstage

To Install this plugin you'll need to do the following:

1. Install the `@liatrio/backstage-dora-plugin` package into the `/packages/app` folder

   ```shell
   npm install @liatrio/backstage-dora-plugin

   yarn add @liatrio/backstage-dora-plugin
   ```

2. Update the `/packages/app/src/App.tsx` file:

   - Add this to your imports:

   ```typescript
   import { EntityDORACharts } from '@liatrio/backstage-dora-plugin';
   ```

   - Add this into the `FlatRoutes` element as a child:

   ```typescript
   <Route path="/dora" element={<EntityDORACharts showTeamSelection />} />
   ```

3. Update the `/packages/app/src/components/catalog/EntityPage.tsx` file:

   - Add this to your imports:

   ```typescript
   import {
     EntityDORACharts,
     EntityDORAAtAGlance,
   } from '@liatrio/backstage-dora-plugin';
   ```

   - Define this constant:

   ```typescript
   const doraContent = (
   <Grid container spacing={3} alignItems="stretch">
     {entityWarningContent}
     <EntityDORACharts showTeamSelection={false} />
   </Grid>
   );
   ```

   - Add this into the `serviceEntityPage`, `websiteEntityPage`, `defaultEntityPage` `EntityLayoutWrapper` elements:

   ```typescript
   <EntityLayout.Route path="/dora" title="DORA">
     {doraContent}
   </EntityLayout.Route>
   ```

   - Add this into the `overviewContent` `Grid`:

   ```typescript
   <Grid item md={6}>
     <EntityDORAAtAGlance />
   </Grid>
   ```

4. Update the `app-config.yaml`:

   - Add this to the `proxy.endpoints` and use the correct URL for your API:

   ```yaml
   /dora/api:
     target: [URL_TO_DORA_API]
   ```

   - Add this root property `dora` to the file and then add the following under it:

     - Required:

       - `dataEndpoint`: This the endpoint on the proxy that provides the deployment data. If you are using the `liatrio-dora-api` this will be `data`
       - `teamListEndpiont`: This the endpoint on the proxy that provides the team and repo ownership data. If you are using the `liatrio-dora-api` this will be `teams`
       - `daysToFetch`: This is the number of days worth of data that will be fetched for the charts to have available for display

     - Optional:

       - `showWeekends`: This boolean will toggle the `Deployment Frequency Chart` to hide weekends or show them. The default is to hide them.
       - `includeWeekends`: This boolean will toggle whether weekends are included in scoring your `Deployment Frequency` and `Change Lead Time`. The default is to exclude them.
       - `showDetails`: This boolean will toggle whether or not the `DORA At a Glance` shows the exact scores on hover or as static text. The default is to show them on hover.
       - `showTrendGraph`: Enabling this field will change the `DORA At a Glance` to be a Trend Graph rather than have Metric indicators
       - `showIndividualTrends`: Enabling this field will add individual Metric Trends to the Trend Graph in the `DORA At a Glance` component
       - `rankThresholds`: This is an object to override the default rank thresholds for DORA Score Board and is fully optional all the way down to the individual ranks.

         There are 4 scores, all are optional:

         - `deployment_frequency` measured in hours
         - `change_lead_time` measured in hours
         - `change_failure_rate` measured as a percentage
         - `recover_time` measured in hours

         Each score has the following rank options:

         - `elite`
         - `high`
         - `medium`

         **Note: Anything outside `medium` is considered `low`**

         The default rank thresholds are:

         - deployment_frequency
           - elite: 24 (1 day or less)
           - high: 168 (1 week or less)
           - medium: 720 (1 month or less)
         - change_lead_time
           - elite: 24 (1 day or less)
           - high: 168 (1 week or less)
           - medium: 720 (1 month or less)
         - change_failure_rate
           - elite: 5
           - high: 10
           - medium: 45
         - recover_time
           - elite: 1 (1 hr or less)
           - high: 24 (1 day or less)
           - medium: 168 (1 week or less)
