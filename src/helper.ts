import { useApi, identityApiRef } from '@backstage/core-plugin-api';

export const getRepositoryName = (e: any): string => {
  if ('github.com/project-slug' in e.entity.metadata.annotations) {
    return e.entity.metadata.annotations['github.com/project-slug'].split(
      '/'
    )[1];
  } else {
    return '';
  }
};

export const genAuthHeaderValueLookup = () => {
  const identityApi = useApi(identityApiRef);

  return async () => {
    const obj = await identityApi.getCredentials();

    if (obj.token) {
      return `Bearer ${obj.token}`;
    } else {
      return undefined;
    }
  };
};

export const fetchTeams = async (
  url: string,
  getAuthHeaderValue: () => Promise<string | undefined>,
  onSuccess: (data: any) => void,
  onFailure?: (data: any) => void
) => {
  if (!url) {
    return;
  }

  let headers = {};

  if (getAuthHeaderValue) {
    headers = {
      'Content-Type': 'application/json',
      Authorization: await getAuthHeaderValue(),
    };
  } else {
    headers = {
      'Content-Type': 'application/json',
    };
  }

  const options = {
    method: 'GET',
    headers: headers,
  };

  try {
    const response = await fetch(url, options);
    const json = await response.text();

    let parsedData = JSON.parse(json);

    onSuccess(parsedData);
  } catch (error) {
    if (onFailure) {
      onFailure(error);
    }
  }
};
