import React, { useEffect, useState } from 'react';
import { InfoCard } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import {
  TrendGraph,
  Board,
  MetricThresholdSet,
  getDateDaysInPastUtc,
  fetchData,
} from 'react-dora-charts';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { genAuthHeaderValueLookup, getRepositoryName } from '../helper';
import { ChartTitle } from './ChartTitle';

export const AtAGlance = () => {
  const entity = useEntity();
  const configApi = useApi(configApiRef);
  const backendUrl = configApi.getString('backend.baseUrl');
  const dataEndpoint = configApi.getString('dora.dataEndpoint');
  const daysToFetch = configApi.getNumber('dora.daysToFetch');
  const includeWeekends = configApi.getOptionalBoolean('dora.includeWeekends');
  const showDetails = configApi.getOptionalBoolean('dora.showDetails');
  const rankThresholds = configApi.getOptional(
    'dora.rankThresholds'
  ) as MetricThresholdSet;
  const showTrendGraph = configApi.getOptionalBoolean('dora.showTrendGraph');
  const showIndividualTrends = configApi.getOptionalBoolean(
    'dora.showIndividualTrends'
  );

  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);

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

    let fetch = async () => {
      let fetchOptions: any = {
        api: apiUrl,
        getAuthHeaderValue: getAuthHeaderValue,
        start: getDateDaysInPastUtc(daysToFetch),
        end: getDateDaysInPastUtc(0),
        repositories: [repositoryName],
      };

      setLoading(true);

      await fetchData(
        fetchOptions,
        (data: any) => {
          setData(data);
          setLoading(false);
        },
        (_) => {
          setLoading(false);
        }
      );
    };

    fetch();
  }, []);

  const tTitle = (
    <ChartTitle
      title="DORA: 30 Days At a Glance"
      info="You DORA Trend, week over week, for the period selected"
    />
  );
  const bTitle = (
    <ChartTitle
      title="DORA: 30 Days At a Glance"
      info="How well you are doing in each of the DORA Metrics"
    />
  );

  return (
    <InfoCard title={showTrendGraph ? tTitle : bTitle}>
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
                />
              )}
            </div>
          )}
        </Box>
      </Box>
    </InfoCard>
  );
};
