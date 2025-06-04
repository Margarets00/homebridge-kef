import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

// Mock Homebridge API
jest.mock('homebridge', () => ({
  API: jest.fn(),
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
  PlatformAccessory: jest.fn(),
})); 