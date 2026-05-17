/**
 * @jest-environment node
 */

import { GET } from './route';

describe('Frontend Health Endpoint', () => {
  it('should return 200 OK with status UP', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ status: 'UP' });
  });
});
