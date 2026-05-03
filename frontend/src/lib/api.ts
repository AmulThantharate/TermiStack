export interface ApiResponse {
  status: number;
  statusText: string;
  data: unknown;
  time: number;
  headers: Record<string, string>;
}

export const sendRequest = async (
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body: unknown = null
): Promise<ApiResponse> => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (method !== 'GET' && method !== 'HEAD' && body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startTime = performance.now();

  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    const contentType = response.headers.get('content-type');
    let data: unknown;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data,
      time: duration,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error: unknown) {
    const endTime = performance.now();
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 0,
      statusText: 'Error',
      data: { error: message },
      time: Math.round(endTime - startTime),
      headers: {},
    };
  }
};
