import { useApi, identityApiRef } from '@backstage/core-plugin-api';

export const COLOR_GREEN = '#24ae1d';
export const COLOR_DARK = '#000';
export const COLOR_LIGHT = '#FFF';

export const getRepositoryName = (e: any): string => {
  // Handle both direct entity objects and objects containing an entity property
  const entity = e.entity || e;
  
  // Safely access annotations with null checks
  if (entity && entity.metadata && entity.metadata.annotations && 
      'github.com/project-slug' in entity.metadata.annotations) {
    return entity.metadata.annotations['github.com/project-slug'].split(
      '/',
    )[1];
  }

  return '';
};

export const useAuthHeaderValueLookup = () => {
  const identityApi = useApi(identityApiRef);

  return async () => {
    const obj = await identityApi.getCredentials();

    if (obj.token) {
      return `Bearer ${obj.token}`;
    }

    return undefined;
  };
};

export const fetchServices = async (
  url: string,
  getAuthHeaderValue: () => Promise<string | undefined>,
  onSuccess: (data: any) => void,
  onFailure?: (data: any) => void,
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

    const parsedData = JSON.parse(json);

    onSuccess(parsedData);
  } catch (error) {
    if (onFailure) {
      onFailure(error);
    }
  }
};
