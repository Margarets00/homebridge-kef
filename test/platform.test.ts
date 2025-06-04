import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { KefHomebridgePlatform } from '../src/platform';
import { KefPlatformAccessory } from '../src/platformAccessory';
import { PLATFORM_NAME, PLUGIN_NAME } from '../src/settings';

// Mock homebridge-lib
jest.mock('homebridge-lib/EveHomeKitTypes', () => {
  return {
    EveHomeKitTypes: jest.fn().mockImplementation(() => ({
      Services: {},
      Characteristics: {},
    })),
  };
});

// Mock KefPlatformAccessory
jest.mock('../src/platformAccessory');

describe('KefHomebridgePlatform', () => {
  let platform: KefHomebridgePlatform;
  let mockApi: any;
  let mockLog: any;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLog = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    mockApi = {
      on: jest.fn(),
      hap: {
        uuid: {
          generate: jest.fn().mockReturnValue('test-uuid'),
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
      },
      registerPlatformAccessories: jest.fn(),
      unregisterPlatformAccessories: jest.fn(),
      updatePlatformAccessories: jest.fn(),
      platformAccessory: jest.fn().mockImplementation(() => ({
        UUID: 'test-uuid',
        context: {},
      })),
    };

    mockConfig = {
      platform: PLATFORM_NAME,
      name: 'KEF Platform',
      speakers: [
        {
          name: 'Living Room KEF',
          ip: '192.168.1.100',
          model: 'LS50WII',
          pollingInterval: 10,
        },
      ],
    };

    platform = new KefHomebridgePlatform(mockLog, mockConfig, mockApi);
  });

  describe('initialization', () => {
    it('should register for didFinishLaunching event', () => {
      expect(mockApi.on).toHaveBeenCalledWith('didFinishLaunching', expect.any(Function));
    });

    it('should initialize with empty accessories map', () => {
      expect(platform.accessories.size).toBe(0);
    });

    it('should initialize with empty discoveredCacheUUIDs array', () => {
      expect(platform.discoveredCacheUUIDs).toEqual([]);
    });

    it('should log debug message after initialization', () => {
      expect(mockLog.debug).toHaveBeenCalledWith('Finished initializing platform:', mockConfig.name);
    });
  });

  describe('configureAccessory', () => {
    it('should add accessory to accessories map', () => {
      const mockAccessory = { UUID: 'test-uuid', displayName: 'Test Speaker' };
      platform.configureAccessory(mockAccessory as any);
      expect(platform.accessories.get('test-uuid')).toBe(mockAccessory);
      expect(mockLog.info).toHaveBeenCalledWith('Loading accessory from cache:', 'Test Speaker');
    });
  });

  describe('discoverDevices', () => {
    it('should handle missing speakers configuration', () => {
      platform = new KefHomebridgePlatform(mockLog, { platform: PLATFORM_NAME }, mockApi);
      platform.discoverDevices();
      expect(mockLog.error).toHaveBeenCalledWith('No speakers configured!');
    });

    it('should create new accessory when not in cache', () => {
      platform.discoverDevices();
      expect(mockApi.registerPlatformAccessories).toHaveBeenCalledWith(
        PLUGIN_NAME,
        PLATFORM_NAME,
        expect.any(Array),
      );
      expect(KefPlatformAccessory).toHaveBeenCalled();
    });

    it('should update existing accessory when in cache', () => {
      const mockAccessory = {
        UUID: 'test-uuid',
        displayName: 'Test Speaker',
        context: {},
      };
      platform.accessories.set('test-uuid', mockAccessory as any);
      platform.discoverDevices();
      expect(mockApi.updatePlatformAccessories).toHaveBeenCalledWith([mockAccessory]);
      expect(KefPlatformAccessory).toHaveBeenCalled();
    });

    it('should remove unconfigured accessories', () => {
      const mockAccessory = {
        UUID: 'old-uuid',
        displayName: 'Old Speaker',
      };
      platform.accessories.set('old-uuid', mockAccessory as any);
      platform.discoverDevices();
      expect(mockApi.unregisterPlatformAccessories).toHaveBeenCalledWith(
        PLUGIN_NAME,
        PLATFORM_NAME,
        [mockAccessory],
      );
    });

    it('should update accessory context with speaker details', () => {
      platform.discoverDevices();
      const mockAccessory = mockApi.platformAccessory.mock.results[0].value;
      expect(mockAccessory.context.name).toBe(mockConfig.speakers[0].name);
      expect(mockAccessory.context.model).toBe(mockConfig.speakers[0].model);
    });

    it('should create KefPlatformAccessory with correct config', () => {
      platform.discoverDevices();
      expect(KefPlatformAccessory).toHaveBeenCalledWith(
        platform,
        expect.any(Object),
        {
          ip: mockConfig.speakers[0].ip,
          pollingInterval: mockConfig.speakers[0].pollingInterval,
        },
      );
    });
  });
}); 