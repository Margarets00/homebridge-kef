import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { KefHomebridgePlatform } from './platform';
import { KefSpeaker } from './kefSpeaker';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class KefPlatformAccessory {
  private speakerService: Service;
  private volumeService: Service;
  private kefSpeaker: KefSpeaker;
  private pollingInterval!: NodeJS.Timeout;

  constructor(
    private readonly platform: KefHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly config: {
      ip: string;
      pollingInterval: number;
    },
  ) {
    this.kefSpeaker = new KefSpeaker(config.ip);

    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'KEF')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // Speaker service (for power control)
    this.speakerService = this.accessory.getService(this.platform.Service.Speaker) || 
      this.accessory.addService(this.platform.Service.Speaker);

    this.speakerService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.name);

    this.speakerService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.speakerService.getCharacteristic(this.platform.Characteristic.Mute)
      .onSet(this.setMute.bind(this))
      .onGet(this.getMute.bind(this));

    // Volume service
    this.volumeService = this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb, 'Volume', 'volume');

    this.volumeService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setVolumeOn.bind(this))
      .onGet(this.getVolumeOn.bind(this));

    this.volumeService.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setVolume.bind(this))
      .onGet(this.getVolume.bind(this));

    // Start polling
    this.startPolling();
  }

  private startPolling() {
    this.pollingInterval = setInterval(async () => {
      try {
        const status = await this.kefSpeaker.getStatus();
        const volume = await this.kefSpeaker.getVolume();

        this.speakerService.updateCharacteristic(
          this.platform.Characteristic.On,
          status === 'powerOn',
        );

        this.volumeService.updateCharacteristic(
          this.platform.Characteristic.Brightness,
          volume,
        );
      } catch (error) {
        this.platform.log.error('Error polling speaker status:', error);
      }
    }, this.config.pollingInterval * 1000);
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    try {
      if (value) {
        await this.kefSpeaker.powerOn();
      } else {
        await this.kefSpeaker.shutdown();
      }
    } catch (error) {
      this.platform.log.error('Error setting power state:', error);
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.
   * In this case, you may decide not to implement `onGet` handlers, which may speed up
   * the responsiveness of your device in the Home app.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    try {
      const status = await this.kefSpeaker.getStatus();
      return status === 'powerOn';
    } catch (error) {
      this.platform.log.error('Error getting power state:', error);
      return false;
    }
  }

  async setMute(value: CharacteristicValue) {
    try {
      if (value) {
        await this.kefSpeaker.mute();
      } else {
        await this.kefSpeaker.unmute();
      }
    } catch (error) {
      this.platform.log.error('Error setting mute state:', error);
    }
  }

  async getMute(): Promise<CharacteristicValue> {
    try {
      const volume = await this.kefSpeaker.getVolume();
      return volume === 0;
    } catch (error) {
      this.platform.log.error('Error getting mute state:', error);
      return false;
    }
  }

  async setVolumeOn(value: CharacteristicValue) {
    if (!value) {
      try {
        await this.kefSpeaker.setVolume(0);
      } catch (error) {
        this.platform.log.error('Error setting volume to 0:', error);
      }
    }
  }

  async getVolumeOn(): Promise<CharacteristicValue> {
    try {
      const volume = await this.kefSpeaker.getVolume();
      return volume > 0;
    } catch (error) {
      this.platform.log.error('Error getting volume state:', error);
      return false;
    }
  }

  async setVolume(value: CharacteristicValue) {
    try {
      await this.kefSpeaker.setVolume(value as number);
    } catch (error) {
      this.platform.log.error('Error setting volume:', error);
    }
  }

  async getVolume(): Promise<CharacteristicValue> {
    try {
      return await this.kefSpeaker.getVolume();
    } catch (error) {
      this.platform.log.error('Error getting volume:', error);
      return 0;
    }
  }
}
