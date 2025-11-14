/**
 * Stream formatter core tests
 */

import { StreamFormatter } from '../src/core/stream/formatter';

describe('StreamFormatter', () => {
  test('formats timestamp correctly', () => {
    const result = StreamFormatter.formatTimestamp('2023-12-01T10:30:00.000Z');
    expect(result).toBe('2023-12-01T10:30:00.000Z');
  });

  test('converts numbers from strings', () => {
    expect(StreamFormatter.convertToNumber('123')).toBe(123);
    expect(StreamFormatter.convertToNumber('3.14')).toBe(3.14);
    expect(StreamFormatter.convertToNumber('hello')).toBe('hello');
  });

  test('extracts values from objects', () => {
    expect(StreamFormatter.extractValue({ value: 42 })).toBe(42);
    expect(StreamFormatter.extractValue({ data: 'test' })).toBe('test');
    expect(StreamFormatter.extractValue(null)).toBe(0);
  });

  test('formats topic data', () => {
    const result = StreamFormatter.formatTopicData('test/topic', { value: 42 });
    
    expect(result).toEqual({
      topic: 'test/topic',
      timestamp: expect.any(String),
      data: {
        type: 'IoTValue',
        data: 42
      }
    });
  });

  test('formats batch payload', () => {
    const messages = [
      { topic: 'test/topic', timestamp: '2023-12-01T10:30:00.000Z', data: { value: 42 } }
    ];

    const result = StreamFormatter.formatBatch('device-123', 'routine-456', messages);

    expect(result).toEqual({
      timestamp: expect.any(String),
      platformDeviceId: 'device-123',
      routineId: 'routine-456',
      data: expect.any(Array)
    });
    
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.topic).toBe('test/topic');
  });
});