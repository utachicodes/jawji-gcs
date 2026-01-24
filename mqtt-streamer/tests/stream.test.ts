/**
 * Stream manager core tests
 */

import { StreamManager } from '../src/core/stream/manager';
import { mockDevice } from './setup';
import axios from 'axios';

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('StreamManager', () => {
  let streamManager: StreamManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const streamConfig = {
      endpoint: 'https://test.api.com/ingest',
      headers: { 'Content-Type': 'application/json' },
      streaming: { enabled: true, rate: 100 } // Fast rate for testing
    };

    streamManager = new StreamManager(mockDevice, streamConfig);
  });

  afterEach(() => {
    streamManager.stop();
  });

  test('queues messages correctly', () => {
    const result = streamManager.pushMessage('test/topic', '{"value": 42}');
    
    expect(result).toBe(true);
    expect(streamManager.getQueueSize()).toBe(1);
  });

  test('processes batch and sends to API', async () => {
    mockAxios.post.mockResolvedValue({ status: 200 });

    streamManager.pushMessage('test/topic', '{"value": 42}');
    
    // Wait for batch processing
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://test.api.com/ingest',
      expect.objectContaining({
        platformDeviceId: 'test-device',
        data: expect.arrayContaining([
          expect.objectContaining({
            topic: 'test/topic'
          })
        ])
      }),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      })
    );
  });

  test('pauses and resumes streaming', () => {
    streamManager.pause();
    expect(streamManager.getStatus()).toBe('paused');
    
    const result = streamManager.pushMessage('test/topic', '{"value": 42}');
    expect(result).toBe(false); // Should reject when paused
    
    streamManager.resume();
    expect(streamManager.getStatus()).toBe('running');
  });

  test('clears queue', () => {
    streamManager.pushMessage('test/topic1', '{"value": 1}');
    streamManager.pushMessage('test/topic2', '{"value": 2}');
    
    expect(streamManager.getQueueSize()).toBe(2);
    
    const cleared = streamManager.clearQueue();
    expect(cleared).toBe(2);
    expect(streamManager.getQueueSize()).toBe(0);
  });

  test('returns correct statistics', () => {
    streamManager.pushMessage('test/topic', '{"value": 42}');
    
    const stats = streamManager.getStats();
    
    expect(stats).toEqual({
      messages_received: 1,
      batches_sent: 0,
      messages_sent: 0,
      errors: 0,
      last_batch_time: null,
      last_error: null,
      queue_size: 1,
      status: 'running'
    });
  });
});