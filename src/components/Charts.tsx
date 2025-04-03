import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { InfoCard } from '@backstage/core-components';
import { Box, Grid } from '@material-ui/core';
import { Tooltip } from 'react-tooltip';
import {
  RecoverTimeGraph,
  ChangeFailureRateGraph,
  ChangeLeadTimeGraph,
  DeploymentFrequencyGraph,
  Board,
  TrendGraph,
  fetchData,
  getDateDaysInPast,
  buildDoraStateForPeriod,
  MetricThresholdSet,
  DoraState,
  getDateDaysInPastUtc,
  DoraRecord,
  Theme,
} from '@liatrio/react-dora-charts';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import {
  COLOR_DARK,
  COLOR_LIGHT,
  useAuthHeaderValueLookup,
  getRepositoryName,
} from '../helper';
import { makeStyles } from '@material-ui/core/styles';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChartTitle } from './ChartTitle';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

const useStyles = makeStyles(theme => ({
  doraCalendar: {
    '& .react-datepicker__header': {
      backgroundColor: theme.palette.background.default,
    },
    '& .react-datepicker__month-container': {
      backgroundColor: theme.palette.background.default,
    },
    '& .react-datepicker__current-month': {
      color: theme.palette.text.primary,
    },
    '& .react-datepicker__day': {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: 'rgb(92, 92, 92)',
      },
    },
    '& .react-datepicker__day-name': {
      color: theme.palette.text.primary,
    },
    '& .react-datepicker__day--in-range': {
      backgroundColor: 'green',
      '&:hover': {
        backgroundColor: 'rgb(0, 161, 0)',
      },
    },
    '& .react-datepicker__input-container input': {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      padding: '10px',
    },
    '& .react-datepicker': {
      borderWidth: '2px',
    },
  },
  doraContainer: {
    '& .doraCard > :first-child': {
      padding: '6px 16px 6px 20px',
    },
    '& .doraGrid': {
      paddingBottom: '0px',
    },
    '& .Dropdown-root': {
      width: '50%',
    },
    '& .Dropdown-control': {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
    },
    '& .Dropdown-option is-selected': {
      backgroundColor: 'green',
      color: theme.palette.text.primary,
    },
    '& .Dropdown-option': {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
    },
    '& .Dropdown-option:hover': {
      backgroundColor: 'green',
      color: theme.palette.text.primary,
    },
    '& .Dropdown-menu': {
      backgroundColor: theme.palette.background.default,
    },
    '& .doraOptions': {
      overflow: 'visible',
    },
  },
  pageView: {
    padding: '10px',
  },
}));

export interface ChartProps {
  showServiceSelection?: boolean;
}

const defaultMetric = {
  average: 0,
  display: '',
  color: '',
  trend: 0,
  rank: 0,
};

const defaultMetrics: DoraState = {
  deploymentFrequency: defaultMetric,
  changeLeadTime: defaultMetric,
  changeFailureRate: defaultMetric,
  recoverTime: defaultMetric,
};

export const Charts = (props: ChartProps) => {
  // Always call useEntity unconditionally
  const entityContext = useEntity();
  // Then conditionally use the result
  const entity = props.showServiceSelection ? null : entityContext;
  const configApi = useApi(configApiRef);
  const backendUrl = configApi.getString('backend.baseUrl');
  const dataEndpoint = configApi.getString('dora.dataEndpoint');
  const serviceListEndpoint = configApi.getString('dora.serviceListEndpoint');
  const includeWeekends = configApi.getOptionalBoolean('dora.includeWeekends');
  const showDetails = configApi.getOptionalBoolean('dora.showDetails');
  const servicesList = configApi.getOptional('dora.services') as string[];
  const showTrendGraph = configApi.getOptionalBoolean('dora.showTrendGraph');
  const showIndividualTrends = configApi.getOptionalBoolean(
    'dora.showIndividualTrends',
  );
  const daysToFetch = configApi.getNumber('dora.daysToFetch');
  const rankThresholds = configApi.getOptional(
    'dora.rankThresholds',
  ) as MetricThresholdSet;

  const getAuthHeaderValue = useAuthHeaderValueLookup();

  const apiUrl = `${backendUrl}/api/proxy/dora/api/${dataEndpoint}`;
  const serviceListUrl = `${backendUrl}/api/proxy/dora/api/${serviceListEndpoint}`;

  const [serviceIndex, setServiceIndex] = useState<number>(0);
  const [services, setServices] = useState<any[]>([
    {
      value: '',
      label: 'Please Select',
    },
  ]);
  const [repository, setRepository] = useState<string>('');
  const [data, setData] = useState<DoraRecord[]>([]);
  const [startDate, setStartDate] = useState<Date>(getDateDaysInPast(30));
  const [endDate, setEndDate] = useState<Date>(getDateDaysInPast(0));
  const [calendarStartDate, setCalendarStartDate] = useState<Date>(
    getDateDaysInPast(30),
  );
  const [calendarEndDate, setCalendarEndDate] = useState<Date>(
    getDateDaysInPast(0),
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<DoraState>({ ...defaultMetrics });
  const [message, setMessage] = useState<string>('');

  const classes = useStyles();
  const backstageTheme = useTheme();
  const theme =
    backstageTheme.palette.mode === 'dark' ? Theme.Dark : Theme.Light;

  const getMetrics = (respData: any) => {
    if (!respData || respData.length === 0) {
      setMetrics({ ...defaultMetrics });
      return;
    }

    const metricsData = buildDoraStateForPeriod(
      {
        data: [],
        metricThresholdSet: rankThresholds,
        holidays: [],
        includeWeekendsInCalculations: includeWeekends,
        graphEnd: endDate,
        graphStart: startDate,
      },
      respData,
      startDate,
      endDate,
    );

    setMetrics(metricsData);
  };

  const updateData = (
    respData: any,
    start?: Date,
    end?: Date,
    msg?: string,
  ) => {
    if (!respData || respData.length < 1) {
      setData([]);
      setMetrics({ ...defaultMetrics });
      setMessage('');
    } else {
      setData(respData);
    }

    getMetrics(respData);

    if (msg !== undefined) {
      setMessage(msg);
    }

    if (start) {
      setStartDate(start);
    }

    if (end) {
      setEndDate(end);
    }
  };

  const makeFetchOptions = (service?: string, repositories?: string[]) => {
    const fetchOptions: any = {
      api: apiUrl,
      getAuthHeaderValue: getAuthHeaderValue,
      start: getDateDaysInPast(daysToFetch),
      end: getDateDaysInPastUtc(0),
    };

    if (!props.showServiceSelection) {
      fetchOptions.repositories = repositories!;
    } else {
      fetchOptions.service = service;
    }

    return fetchOptions;
  };

  const fetchServicesData = async (
    url: string,
    getAuthHeader: () => string | Promise<string | undefined>,
    onSuccess: (data: any) => void,
    onError: (error: any) => void,
  ) => {
    try {
      const authHeader = await Promise.resolve(getAuthHeader());
      const response = await fetch(url, {
        headers: {
          Authorization: authHeader || '',
          // 'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching services: ${response.statusText}`);
      }

      const responseData = await response.json();
      onSuccess(responseData);
    } catch (error) {
      // console.error('Error fetching services:', error);
      onError(error);
    }
  };

  const callFetchData = async (idx: number, repo: string) => {
    const fetchOptions = makeFetchOptions(services[idx]?.value, [repo]);

    setLoading(true);

    await fetchData(
      fetchOptions,
      (respData: any) => {
        updateData(respData, undefined, undefined, '');
        setLoading(false);
      },
      _ => {
        setLoading(false);
      },
    );
  };

  const updateService = async (value: any) => {
    const newIndex = services.findIndex(
      (range: { value: string; label: string }) => range.label === value.label,
    );

    setServiceIndex(newIndex);

    if (!startDate || !endDate) {
      return;
    }

    if (newIndex === 0) {
      updateData(null, undefined, undefined, 'Please select a Service');
      return;
    }

    setMessage('');

    await callFetchData(newIndex, repository);
  };

  const updateDateRange = async (dates: any) => {
    const [newStartDate, newEndDate] = dates;

    setCalendarStartDate(newStartDate);
    setCalendarEndDate(newEndDate);

    if (
      !newStartDate ||
      !newEndDate ||
      (props.showServiceSelection && serviceIndex === 0)
    ) {
      return;
    }

    setStartDate(newStartDate);
    setCalendarEndDate(newEndDate);
  };

  useEffect(() => {
    setLoading(true);

    let repositoryName = '';

    if (!props.showServiceSelection) {
      repositoryName = getRepositoryName(entity);
      setRepository(repositoryName);

      if (!repositoryName) {
        setLoading(false);
        return;
      }
    }

    const fetch = props.showServiceSelection
      ? async () => {
          if (servicesList && servicesList.length > 0) {
            const serviceEntries = [
              {
                value: '',
                label: 'Please Select',
              },
            ];

            for (const service of servicesList) {
              serviceEntries.push({
                value: service,
                label: service,
              });
            }

            setMessage('Please select a Service');
            setLoading(false);
            setServices(serviceEntries);
          } else {
            fetchServicesData(
              serviceListUrl,
              getAuthHeaderValue,
              (services_data: any) => {
                const newList: any[] = [{ label: 'Please Select', value: '' }];

                for (const entry of services_data.services) {
                  const newEntry = {
                    label: entry,
                    value: entry,
                  };

                  newList.push(newEntry);
                }

                setServices(newList);
                setLoading(false);
              },
              _ => {
                setLoading(false);
              },
            );
          }
        }
      : async () => {
          callFetchData(serviceIndex, repositoryName);
        };

    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (repository === '' && !props.showServiceSelection) {
    return (
      <div>DORA Metrics are not available for Non-GitHub repos currently</div>
    );
  }

  const tTitle = (
    <ChartTitle
      title="DORA: At a Glance"
      info="Your DORA Trend, week over week, for the period selected"
      theme={theme}
    />
  );
  const bTitle = (
    <ChartTitle
      title="DORA: At a Glance"
      info="How well you are doing in each of the DORA Metrics"
      theme={theme}
    />
  );
  const dfTitle = (
    <ChartTitle
      scoreDisplay={metrics.deploymentFrequency.display}
      color={metrics.deploymentFrequency.color}
      title="Deployment Frequency"
      info="How often an organization successfully releases to production"
      theme={theme}
    />
  );
  const cfrTitle = (
    <ChartTitle
      scoreDisplay={metrics.changeFailureRate.display}
      color={metrics.changeFailureRate.color}
      title="Change Failure Rate"
      info="The percentage of deployments causing a failure in production"
      theme={theme}
    />
  );
  const cltTitle = (
    <ChartTitle
      scoreDisplay={metrics.changeLeadTime.display}
      color={metrics.changeLeadTime.color}
      title="Change Lead Time"
      info="The amount of time it takes a commit to get into production"
      theme={theme}
    />
  );
  const rtTitle = (
    <ChartTitle
      scoreDisplay={metrics.recoverTime.display}
      color={metrics.recoverTime.color}
      title="Recovery Time"
      info="How long it takes an organization to recover from a failure in production"
      theme={theme}
    />
  );

  const containerClass = props.showServiceSelection
    ? `${classes.doraContainer} ${classes.pageView}`
    : classes.doraContainer;

  return (
    <div className={containerClass}>
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
      <Grid
        container
        style={{ marginBottom: '12px', width: 'calc(100% + 22px)' }}
        spacing={3}
        alignItems="stretch"
      >
        <Grid
          item
          md={6}
          style={{ paddingBottom: '25px', overflow: 'visible' }}
        >
          <InfoCard title="Options" className="doraOptions doraCard">
            <Box overflow="visible" position="relative">
              <Box
                overflow="visible"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <label
                  htmlFor="select-date-range"
                  style={{ paddingRight: '10px' }}
                >
                  Select Date Range:
                </label>
                <div className={classes.doraCalendar}>
                  <DatePicker
                    id="select-date-range"
                    selected={calendarStartDate}
                    onChange={updateDateRange}
                    startDate={calendarStartDate}
                    endDate={calendarEndDate}
                    selectsRange
                    popperPlacement="bottom"
                  />
                </div>
                {props.showServiceSelection && (
                  <div
                    style={{
                      width: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ paddingRight: '10px' }}>
                      Select Service:
                    </span>
                    <Dropdown
                      options={services}
                      onChange={updateService}
                      value={services[serviceIndex]}
                    />
                  </div>
                )}
              </Box>
            </Box>
          </InfoCard>
        </Grid>
        <Grid item md={6} className="doraGrid">
          <InfoCard
            title={showTrendGraph ? tTitle : bTitle}
            className="doraCard"
            noPadding
          >
            <Box position="relative">
              <Box display="flex" justifyContent="flex-end">
                <div
                  style={{
                    width: '800px',
                    height: '220px',
                    paddingBottom: showIndividualTrends ? '10px' : '',
                  }}
                >
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
              </Box>
            </Box>
          </InfoCard>
        </Grid>
      </Grid>
      <Grid
        container
        spacing={3}
        alignItems="stretch"
        style={{ width: 'calc(100% + 22px)' }}
      >
        <Grid item md={6} className="doraGrid">
          <InfoCard title={dfTitle} className="doraCard">
            <Box position="relative">
              <Box display="flex" justifyContent="flex-end">
                <div style={{ width: '800px', height: '200px' }}>
                  <DeploymentFrequencyGraph
                    data={data}
                    loading={loading}
                    includeWeekendsInCalculations={includeWeekends}
                    graphStart={startDate}
                    graphEnd={endDate}
                    message={message}
                    theme={theme}
                  />
                </div>
              </Box>
            </Box>
          </InfoCard>
        </Grid>
        <Grid item md={6} className="doraGrid">
          <InfoCard title={cltTitle} className="doraCard">
            <Box position="relative">
              <Box display="flex" justifyContent="flex-end">
                <div style={{ width: '800px', height: '200px' }}>
                  <ChangeLeadTimeGraph
                    data={data}
                    loading={loading}
                    includeWeekendsInCalculations={includeWeekends}
                    graphStart={startDate}
                    graphEnd={endDate}
                    message={message}
                    theme={theme}
                  />
                </div>
              </Box>
            </Box>
          </InfoCard>
        </Grid>
        <Grid item md={6}>
          <InfoCard title={cfrTitle} className="doraCard">
            <Box position="relative">
              <Box display="flex" justifyContent="flex-end">
                <div style={{ width: '800px', height: '200px' }}>
                  <ChangeFailureRateGraph
                    data={data}
                    loading={loading}
                    includeWeekendsInCalculations={includeWeekends}
                    graphStart={startDate}
                    graphEnd={endDate}
                    message={message}
                    theme={theme}
                  />
                </div>
              </Box>
            </Box>
          </InfoCard>
        </Grid>
        <Grid item md={6}>
          <InfoCard title={rtTitle} className="doraCard">
            <Box position="relative">
              <Box display="flex" justifyContent="flex-end">
                <div style={{ width: '800px', height: '200px' }}>
                  <RecoverTimeGraph
                    data={data}
                    loading={loading}
                    includeWeekendsInCalculations={includeWeekends}
                    graphStart={startDate}
                    graphEnd={endDate}
                    message={message}
                    theme={theme}
                  />
                </div>
              </Box>
            </Box>
          </InfoCard>
        </Grid>
      </Grid>
    </div>
  );
};
