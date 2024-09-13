import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { InfoCard } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import {
  TrendGraph,
  Board,
  MetricThresholdSet,
  getDateDaysInPastUtc,
  fetchData,
  Theme,
} from '@liatrio/react-dora-charts';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import {
  COLOR_DARK,
  COLOR_LIGHT,
  genAuthHeaderValueLookup,
  getRepositoryName,
} from '../helper';
import { ChartTitle } from './ChartTitle';
import { Tooltip } from 'react-tooltip';

export const AtAGlance = () => {
  const entity = useEntity();
  const configApi = useApi(configApiRef);
  const backendUrl = configApi.getString('backend.baseUrl');
  const dataEndpoint = configApi.getString('dora.dataEndpoint');
  const daysToFetch = configApi.getNumber('dora.daysToFetch');
  const includeWeekends = configApi.getOptionalBoolean('dora.includeWeekends');
  const showDetails = configApi.getOptionalBoolean('dora.showDetails');
  const rankThresholds = configApi.getOptional(
    'dora.rankThresholds',
  ) as MetricThresholdSet;
  const showTrendGraph = configApi.getOptionalBoolean('dora.showTrendGraph');
  const showIndividualTrends = configApi.getOptionalBoolean(
    'dora.showIndividualTrends',
  );

  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const backstageTheme = useTheme();
  const theme =
    backstageTheme.palette.mode === 'dark' ? Theme.Dark : Theme.Light;

  const getAuthHeaderValue = genAuthHeaderValueLookup();

  const apiUrl = `${backendUrl}/api/proxy/dora/api/${dataEndpoint}`;
  const repositoryName = getRepositoryName(entity);
  const startDate = getDateDaysInPastUtc(31);
  const endDate = getDateDaysInPastUtc(0);
  const message = '';

  useEffect(() => {
    if (!repositoryName) {
      return;
    }

    const fetch = async () => {
      const fetchOptions: any = {
        api: apiUrl,
        getAuthHeaderValue: getAuthHeaderValue,
        start: getDateDaysInPastUtc(daysToFetch),
        end: getDateDaysInPastUtc(0),
        repositories: [repositoryName],
      };

      setLoading(true);

      await fetchData(
        fetchOptions,
        (respData: any) => {
          setData(respData);
          setLoading(false);
        },
        _ => {
          setLoading(false);
        },
      );
    };

    fetch();
  }, []);

  const tTitle = (
    <ChartTitle
      title="DORA: 30 Days At a Glance"
      info="You DORA Trend, week over week, for the period selected"
      theme={theme}
    />
  );
  const bTitle = (
    <ChartTitle
      title="DORA: 30 Days At a Glance"
      info="How well you are doing in each of the DORA Metrics"
      theme={theme}
    />
  );

  return (
    <InfoCard title={showTrendGraph ? tTitle : bTitle}>
      <Tooltip
        id="metric_tooltip"
        place="bottom"
        border={`1px solid ${theme === Theme.Dark ? COLOR_LIGHT : COLOR_DARK}`}
        opacity="1"
        style={{
          borderRadius: '10px',
          maxWidth: '300px',
          padding: '10px',
          zIndex: '100',
          backgroundColor: backstageTheme.palette.background.default,
        }}
      />
      <Box position="relative">
        <Box display="flex" justifyContent="flex-end">
          {repositoryName === '' ? (
            <div>
              DORA Metrics are not available for Non-GitHub repos currently
            </div>
          ) : (
            <div style={{ width: '750px', height: '200px' }}>
              {showTrendGraph ? (
                <TrendGraph
                  showIndividualTrends={showIndividualTrends}
                  data={data}
                  loading={loading}
                  graphStart={startDate}
                  graphEnd={endDate}
                  metricThresholdSet={rankThresholds}
                  message={message}
                  theme={theme}
                />
              ) : (
                <Board
                  data={data}
                  loading={loading}
                  alwaysShowDetails={showDetails}
                  includeWeekendsInCalculations={includeWeekends}
                  graphStart={startDate}
                  graphEnd={endDate}
                  metricThresholdSet={rankThresholds}
                  message={message}
                  theme={theme}
                />
              )}
            </div>
          )}
        </Box>
      </Box>
    </InfoCard>
  );
};
