import React, { useState, useEffect } from 'react';
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
} from 'react-dora-charts';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import {
  fetchTeams,
  genAuthHeaderValueLookup,
  getRepositoryName,
} from '../helper';
import { makeStyles } from '@material-ui/core/styles';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChartTitle } from './ChartTitle';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

const useStyles = makeStyles(() => ({
  doraCalendar: {
    '& .react-datepicker__header': {
      backgroundColor: 'black',
    },
    '& .react-datepicker__month-container': {
      backgroundColor: 'black',
    },
    '& .react-datepicker__current-month': {
      color: 'white',
    },
    '& .react-datepicker__day': {
      backgroundColor: 'black',
      color: 'white',
      '&:hover': {
        backgroundColor: 'rgb(92, 92, 92)',
      },
    },
    '& .react-datepicker__day-name': {
      color: 'white',
    },
    '& .react-datepicker__day--in-range': {
      backgroundColor: 'green',
      '&:hover': {
        backgroundColor: 'rgb(0, 161, 0)',
      },
    },
    '& .react-datepicker__input-container input': {
      backgroundColor: 'black',
      color: 'white',
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
      backgroundColor: 'black',
      color: 'white',
    },
    '& .Dropdown-option is-selected': {
      backgroundColor: 'green',
      color: 'black',
    },
    '& .Dropdown-option': {
      backgroundColor: 'black',
      color: 'white',
    },
    '& .Dropdown-option:hover': {
      backgroundColor: 'green',
      color: 'white',
    },
    '& .Dropdown-menu': {
      backgroundColor: 'black',
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
  showTeamSelection?: boolean;
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
  const entity = !props.showTeamSelection ? useEntity() : null;
  const configApi = useApi(configApiRef);
  const backendUrl = configApi.getString('backend.baseUrl');
  const dataEndpoint = configApi.getString('dora.dataEndpoint');
  const teamListEndpoint = configApi.getString('dora.teamListEndpoint');
  const includeWeekends = configApi.getOptionalBoolean('dora.includeWeekends');
  const showDetails = configApi.getOptionalBoolean('dora.showDetails');
  const teamsList = configApi.getOptional('dora.teams') as string[];
  const showTrendGraph = configApi.getOptionalBoolean('dora.showTrendGraph');
  const showIndividualTrends = configApi.getOptionalBoolean(
    'dora.showIndividualTrends'
  );
  const daysToFetch = configApi.getNumber('dora.daysToFetch');
  const rankThresholds = configApi.getOptional(
    'dora.rankThresholds'
  ) as MetricThresholdSet;

  const getAuthHeaderValue = genAuthHeaderValueLookup();

  const apiUrl = `${backendUrl}/api/proxy/dora/api/${dataEndpoint}`;
  const teamListUrl = `${backendUrl}/api/proxy/dora/api/${teamListEndpoint}`;

  const [teamIndex, setTeamIndex] = useState<number>(0);
  const [teams, setTeams] = useState<any[]>([
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
    getDateDaysInPast(30)
  );
  const [calendarEndDate, setCalendarEndDate] = useState<Date>(
    getDateDaysInPast(0)
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<DoraState>({ ...defaultMetrics });
  const [message, setMessage] = useState<string>('');

  const classes = useStyles();

  const getMetrics = (data: any) => {
    if (!data || data.length === 0) {
      setMetrics({ ...defaultMetrics });
      return;
    }

    const metrics = buildDoraStateForPeriod(
      {
        data: [],
        metricThresholdSet: rankThresholds,
        holidays: [],
        includeWeekendsInCalculations: includeWeekends,
        graphEnd: endDate,
        graphStart: startDate,
      },
      data,
      startDate,
      endDate
    );

    setMetrics(metrics);
  };

  const updateData = (
    data: any,
    start?: Date,
    end?: Date,
    message?: string
  ) => {
    if (!data && data.length < 1) {
      setData([]);
      setMetrics({ ...defaultMetrics });
      setMessage('');
    } else {
      setData(data);
    }

    getMetrics(data);

    if (message !== undefined) {
      setMessage(message);
    }

    if (start) {
      setStartDate(start);
    }

    if (end) {
      setEndDate(end);
    }
  };

  const makeFetchOptions = (team?: string, repositories?: string[]) => {
    let fetchOptions: any = {
      api: apiUrl,
      getAuthHeaderValue: getAuthHeaderValue,
      start: getDateDaysInPast(daysToFetch),
      end: getDateDaysInPastUtc(0),
    };

    if (!props.showTeamSelection) {
      fetchOptions.repositories = repositories!;
    } else {
      fetchOptions.team = team;
    }

    return fetchOptions;
  };

  const callFetchData = async (teamIndex: number, repository: string) => {
    const fetchOptions = makeFetchOptions(teams[teamIndex]?.value, [
      repository,
    ]);

    setLoading(true);

    await fetchData(
      fetchOptions,
      (data: any) => {
        updateData(data, undefined, undefined, '');
        setLoading(false);
      },
      (_) => {
        setLoading(false);
      }
    );
  };

  const updateTeam = async (value: any) => {
    const newIndex = teams.findIndex(
      (range: { value: string; label: string }) => range.label === value.label
    );

    setTeamIndex(newIndex);

    if (!startDate || !endDate) {
      return;
    }

    if (newIndex === 0) {
      updateData(null, undefined, undefined, 'Please select a Team');
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
      (props.showTeamSelection && teamIndex === 0)
    ) {
      return;
    }

    setStartDate(newStartDate);
    setCalendarEndDate(newEndDate);
  };

  useEffect(() => {
    setLoading(true);

    let repositoryName = '';

    if (!props.showTeamSelection) {
      repositoryName = getRepositoryName(entity);
      setRepository(repositoryName);

      if (!repositoryName) {
        setLoading(false);
        return;
      }
    }

    let fetch = props.showTeamSelection
      ? async () => {
          if (teamsList && teamsList.length > 0) {
            let teamsEntires = [
              {
                value: '',
                label: 'Please Select',
              },
            ];

            for (const team of teamsList) {
              teamsEntires.push({
                value: team,
                label: team,
              });
            }

            setMessage('Please select a Team');
            setLoading(false);
            setTeams(teamsEntires);
          } else {
            fetchTeams(
              teamListUrl,
              getAuthHeaderValue,
              (teams_data: any) => {
                let newList: any[] = [{ label: 'Please Select', value: '' }];

                for (var entry of teams_data.teams) {
                  let newEntry = {
                    label: entry,
                    value: entry,
                  };

                  newList.push(newEntry);
                }

                setTeams(newList);
                setLoading(false);
              },
              (_) => {
                setLoading(false);
              }
            );
          }
        }
      : async () => {
          callFetchData(teamIndex, repositoryName);
        };

    fetch();
  }, []);

  if (repository === '' && !props.showTeamSelection) {
    return (
      <div>DORA Metrics are not available for Non-GitHub repos currently</div>
    );
  }

  const tTitle = (
    <ChartTitle
      title="DORA: At a Glance"
      info="You DORA Trend, week over week, for the period selected"
    />
  );
  const bTitle = (
    <ChartTitle
      title="DORA: At a Glance"
      info="How well you are doing in each of the DORA Metrics"
    />
  );
  const dfTitle = (
    <ChartTitle
      scoreDisplay={metrics.deploymentFrequency.display}
      color={metrics.deploymentFrequency.color}
      title="Deployment Frequency"
      info="How often an organization successfully releases to production"
    />
  );
  const cfrTitle = (
    <ChartTitle
      scoreDisplay={metrics.changeFailureRate.display}
      color={metrics.changeFailureRate.color}
      title="Change Failure Rate"
      info="The percentage of deployments causing a failure in production"
    />
  );
  const cltTitle = (
    <ChartTitle
      scoreDisplay={metrics.changeLeadTime.display}
      color={metrics.changeLeadTime.color}
      title="Change Lead Time"
      info="The amount of time it takes a commit to get into production"
    />
  );
  const rtTitle = (
    <ChartTitle
      scoreDisplay={metrics.recoverTime.display}
      color={metrics.recoverTime.color}
      title="Recovery Time"
      info="How long it takes an organization to recover from a failure in production"
    />
  );

  const containerClass = props.showTeamSelection
    ? `${classes.doraContainer} ${classes.pageView}`
    : classes.doraContainer;

  return (
    <div className={containerClass}>
      <Tooltip
        id="metric_tooltip"
        place="bottom"
        border="1px solid white"
        opacity="1"
        style={{
          borderRadius: '10px',
          maxWidth: '300px',
          padding: '10px',
          zIndex: '100',
          backgroundColor: '#000000',
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
                <label style={{ paddingRight: '10px' }}>
                  Select Date Range:
                </label>
                <div className={classes.doraCalendar}>
                  <DatePicker
                    selected={calendarStartDate}
                    onChange={updateDateRange}
                    startDate={calendarStartDate}
                    endDate={calendarEndDate}
                    selectsRange
                    popperPlacement="bottom"
                  />
                </div>
                {props.showTeamSelection && (
                  <div
                    style={{
                      width: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <label style={{ paddingRight: '10px' }}>Select Team:</label>
                    <Dropdown
                      options={teams}
                      onChange={updateTeam}
                      value={teams[teamIndex]}
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
            noPadding={true}
          >
            <Box position="relative">
              <Box display="flex" justifyContent="flex-end">
                <div
                  style={{
                    width: '800px',
                    height: '200px',
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
