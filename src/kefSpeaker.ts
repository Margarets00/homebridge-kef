import fetch from 'node-fetch';

export class KefSpeaker {
  private readonly baseUrl: string;

  constructor(private readonly host: string) {
    this.baseUrl = `http://${host}:50001`;
  }

  async powerOn(): Promise<void> {
    await this.sendCommand('/api/v1/host/set_power_on');
  }

  async shutdown(): Promise<void> {
    await this.sendCommand('/api/v1/host/set_standby');
  }

  async mute(): Promise<void> {
    await this.sendCommand('/api/v1/player/set_mute');
  }

  async unmute(): Promise<void> {
    await this.sendCommand('/api/v1/player/set_unmute');
  }

  async togglePlayPause(): Promise<void> {
    await this.sendCommand('/api/v1/player/toggle_play_pause');
  }

  async setVolume(volume: number): Promise<void> {
    if (volume < 0 || volume > 100) {
      throw new Error('Volume must be between 0 and 100');
    }
    await this.sendCommand('/api/v1/player/set_volume', { volume: volume });
  }

  async getVolume(): Promise<number> {
    const data = await this.getPlayerData();
    return data.volume || 0;
  }

  async getStatus(): Promise<'powerOn' | 'standby'> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/host/get_status`);
      const data = await response.json();
      return data.status;
    } catch (error) {
      return 'standby';
    }
  }

  async getSource(): Promise<string> {
    const data = await this.getPlayerData();
    return data.source || 'unknown';
  }

  async setSource(source: string): Promise<void> {
    const validSources = ['wifi', 'bluetooth', 'tv', 'optical', 'coaxial', 'analog'];
    if (!validSources.includes(source)) {
      throw new Error(`Invalid source. Must be one of: ${validSources.join(', ')}`);
    }
    await this.sendCommand('/api/v1/host/set_source', { source: source });
  }

  async isPlaying(): Promise<boolean> {
    const data = await this.getPlayerData();
    return data.state === 'playing';
  }

  private async getPlayerData(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/player/get_player_status`);
      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to get player data: ${error?.message || 'Unknown error'}`);
    }
  }

  private async sendCommand(endpoint: string, body: Record<string, any> = {}): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to send command to ${endpoint}: ${error?.message || 'Unknown error'}`);
    }
  }
} 