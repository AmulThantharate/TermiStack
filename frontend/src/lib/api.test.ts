import { sendRequest } from './api';

describe('sendRequest', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should send a successful GET request and return JSON response', async () => {
    const mockData = { id: 1, name: 'Alice' };
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockResolvedValue(mockData),
    };
    fetchMock.mockResolvedValue(mockResponse);

    const result = await sendRequest('GET', 'http://localhost/users');

    expect(fetchMock).toHaveBeenCalledWith('http://localhost/users', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    }));
    expect(result.status).toBe(200);
    expect(result.statusText).toBe('OK');
    expect(result.data).toEqual(mockData);
    expect(typeof result.time).toBe('number');
  });

  it('should handle non-JSON (plain text) responses correctly', async () => {
    const mockText = 'Success';
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: jest.fn().mockResolvedValue(mockText),
    };
    fetchMock.mockResolvedValue(mockResponse);

    const result = await sendRequest('GET', 'http://localhost/hello');

    expect(result.status).toBe(200);
    expect(result.data).toBe(mockText);
  });

  it('should send request body correctly for non-GET methods', async () => {
    const postBody = { name: 'Bob' };
    const mockResponse = {
      status: 201,
      statusText: 'Created',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockResolvedValue(postBody),
    };
    fetchMock.mockResolvedValue(mockResponse);

    const result = await sendRequest('POST', 'http://localhost/users', {}, postBody);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost/users', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(postBody),
    }));
    expect(result.status).toBe(201);
  });

  it('should catch network errors gracefully and return status 0', async () => {
    fetchMock.mockRejectedValue(new Error('Network connection failed'));

    const result = await sendRequest('GET', 'http://localhost/error');

    expect(result.status).toBe(0);
    expect(result.statusText).toBe('Error');
    expect(result.data).toEqual({ error: 'Network connection failed' });
    expect(typeof result.time).toBe('number');
  });
});
