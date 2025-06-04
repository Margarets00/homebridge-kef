/// <reference types="jest" />

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { KefPlatformAccessory } from '../src/platformAccessory';
import { KefHomebridgePlatform } from '../src/platform';
import { KefSpeaker } from '../src/kefSpeaker';

// Mock KefSpeaker
const mockKefSpeakerInstance = {
  powerOn: jest.fn(async () => undefined),
  shutdown: jest.fn(async () => undefined),
  mute: jest.fn(async () => undefined),
  unmute: jest.fn(async () => undefined),
  setVolume: jest.fn(async () => undefined),
  getVolume: jest.fn(async () => 75),
  getStatus: jest.fn(async () => 'powerOn' as const),
  getSource: jest.fn(async () => 'wifi'),
  setSource: jest.fn(async () => undefined),
  togglePlayPause: jest.fn(async () => undefined),
  isPlaying: jest.fn(async () => false),
} as unknown as jest.Mocked<KefSpeaker>;

jest.mock('../src/kefSpeaker', () => {
  return {
    KefSpeaker: jest.fn().mockImplementation(() => mockKefSpeakerInstance),
  };
});

describe('KefPlatformAccessory', () => {
  let platformAccessory: KefPlatformAccessory;
  let mockPlatform: any;
  let mockAccessory: any;
  let mockConfig: any;
  let mockService: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock service and characteristic
    mockService = {
      setCharacteristic: jest.fn().mockReturnThis(),
      getCharacteristic: jest.fn().mockReturnValue({
        onSet: jest.fn().mockReturnThis(),
        onGet: jest.fn().mockReturnThis(),
      }),
      updateCharacteristic: jest.fn(),
    };

    // Mock platform
    mockPlatform = {
      log: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      Service: {
        Speaker: jest.fn(),
        Lightbulb: jest.fn(),
        AccessoryInformation: jest.fn(),
      },
      Characteristic: {
        On: jest.fn(),
        Brightness: jest.fn(),
        Manufacturer: jest.fn(),
        Model: jest.fn(),
        SerialNumber: jest.fn(),
        Name: jest.fn(),
        Mute: jest.fn(),
      },
    };

    // Mock accessory
    mockAccessory = {
      getService: jest.fn().mockReturnValue(mockService),
      addService: jest.fn().mockReturnValue(mockService),
      context: {
        name: 'Test Speaker',
        model: 'LS50WII',
      },
    };

    // Mock config
    mockConfig = {
      ip: '192.168.1.100',
      pollingInterval: 10,
    };

    // Create instance
    platformAccessory = new KefPlatformAccessory(
      mockPlatform as KefHomebridgePlatform,
      mockAccessory,
      mockConfig,
    );
  });

  describe('initialization', () => {
    it('should set up services correctly', () => {
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockPlatform.Service.AccessoryInformation);
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockPlatform.Service.Speaker);
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockPlatform.Service.Lightbulb);
    });

    it('should set up characteristics correctly', () => {
      expect(mockService.setCharacteristic).toHaveBeenCalledWith(
        mockPlatform.Characteristic.Manufacturer,
        'KEF',
      );
      expect(mockService.setCharacteristic).toHaveBeenCalledWith(
        mockPlatform.Characteristic.Model,
        'LS50WII',
      );
    });
  });

  describe('power control', () => {
    it('should handle power on', async () => {
      await platformAccessory.setOn(true);
      expect(mockKefSpeakerInstance.powerOn).toHaveBeenCalled();
    });

    it('should handle power off', async () => {
      await platformAccessory.setOn(false);
      expect(mockKefSpeakerInstance.shutdown).toHaveBeenCalled();
    });
  });

  describe('volume control', () => {
    it('should handle volume change', async () => {
      await platformAccessory.setVolume(50);
      expect(mockKefSpeakerInstance.setVolume).toHaveBeenCalledWith(50);
    });

    it('should handle volume get', async () => {
      const volume = await platformAccessory.getVolume();
      expect(volume).toBe(75);
      expect(mockKefSpeakerInstance.getVolume).toHaveBeenCalled();
    });
  });

  describe('mute control', () => {
    it('should handle mute', async () => {
      await platformAccessory.setMute(true);
      expect(mockKefSpeakerInstance.mute).toHaveBeenCalled();
    });

    it('should handle unmute', async () => {
      await platformAccessory.setMute(false);
      expect(mockKefSpeakerInstance.unmute).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should log errors when power control fails', async () => {
      mockKefSpeakerInstance.powerOn.mockRejectedValueOnce(new Error('Network error'));
      await platformAccessory.setOn(true);
      expect(mockPlatform.log.error).toHaveBeenCalledWith(
        'Error setting power state:',
        expect.any(Error),
      );
    });

    it('should log errors when volume control fails', async () => {
      mockKefSpeakerInstance.setVolume.mockRejectedValueOnce(new Error('Network error'));
      await platformAccessory.setVolume(50);
      expect(mockPlatform.log.error).toHaveBeenCalledWith(
        'Error setting volume:',
        expect.any(Error),
      );
    });
  });
}); 