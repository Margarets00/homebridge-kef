import { KefSpeaker } from '../src/kefSpeaker';
import fetchMock from 'jest-fetch-mock';

describe('KefSpeaker', () => {
  let speaker: KefSpeaker;
  const mockIp = '192.168.1.100';

  beforeEach(() => {
    fetchMock.resetMocks();
    speaker = new KefSpeaker(mockIp);
  });

  describe('power control', () => {
    it('should power on the speaker', async () => {
      fetchMock.mockResponseOnce('{}');
      await speaker.powerOn();
      expect(fetchMock).toHaveBeenCalledWith(
        `http://${mockIp}:50001/api/v1/host/set_power_on`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should shut down the speaker', async () => {
      fetchMock.mockResponseOnce('{}');
      await speaker.shutdown();
      expect(fetchMock).toHaveBeenCalledWith(
        `http://${mockIp}:50001/api/v1/host/set_standby`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
  });

  describe('volume control', () => {
    it('should set volume', async () => {
      fetchMock.mockResponseOnce('{}');
      await speaker.setVolume(50);
      expect(fetchMock).toHaveBeenCalledWith(
        `http://${mockIp}:50001/api/v1/player/set_volume`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ volume: 50 }),
        }),
      );
    });

    it('should throw error for invalid volume', async () => {
      await expect(speaker.setVolume(101)).rejects.toThrow('Volume must be between 0 and 100');
      await expect(speaker.setVolume(-1)).rejects.toThrow('Volume must be between 0 and 100');
    });

    it('should get volume', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ volume: 75 }));
      const volume = await speaker.getVolume();
      expect(volume).toBe(75);
    });
  });

  describe('mute control', () => {
    it('should mute the speaker', async () => {
      fetchMock.mockResponseOnce('{}');
      await speaker.mute();
      expect(fetchMock).toHaveBeenCalledWith(
        `http://${mockIp}:50001/api/v1/player/set_mute`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should unmute the speaker', async () => {
      fetchMock.mockResponseOnce('{}');
      await speaker.unmute();
      expect(fetchMock).toHaveBeenCalledWith(
        `http://${mockIp}:50001/api/v1/player/set_unmute`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
  });

  describe('status', () => {
    it('should get power status', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ status: 'powerOn' }));
      const status = await speaker.getStatus();
      expect(status).toBe('powerOn');
    });

    it('should return standby on error', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));
      const status = await speaker.getStatus();
      expect(status).toBe('standby');
    });
  });

  describe('source control', () => {
    it('should set valid source', async () => {
      fetchMock.mockResponseOnce('{}');
      await speaker.setSource('wifi');
      expect(fetchMock).toHaveBeenCalledWith(
        `http://${mockIp}:50001/api/v1/host/set_source`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ source: 'wifi' }),
        }),
      );
    });

    it('should throw error for invalid source', async () => {
      await expect(speaker.setSource('invalid')).rejects.toThrow('Invalid source');
    });

    it('should get current source', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ source: 'bluetooth' }));
      const source = await speaker.getSource();
      expect(source).toBe('bluetooth');
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      fetchMock.mockResponseOnce('', { status: 500 });
      await expect(speaker.powerOn()).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));
      await expect(speaker.powerOn()).rejects.toThrow('Failed to send command');
    });
  });
}); 