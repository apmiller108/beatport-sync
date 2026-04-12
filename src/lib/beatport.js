import fetch from 'node-fetch'
import { refreshToken } from './auth.js'
import { config as loadConfig } from './config.js'

class BeatportAPI {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.beatport.base_url;
    this.accessToken = config.beatport.access_token;
    this.userAgent = config.beatport.user_agent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';
    this.rateLimitDelay = 1000; // 1 req/s
    this.lastRequestTime = 0;
  }

  async makeRequest(endpoint, method = 'GET', params = {}) {
    console.log(this.config)
    // Rate limiting
    await this.enforceRateLimit();

    const url = new URL(endpoint, this.baseUrl);
    url.search = new URLSearchParams(params).toString();

    if (this.config.options.verbose) {
      console.log(`🔗 Making ${method} request to: ${url}`);
    }

    this.lastRequestTime = Date.now();

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent
      },
      method
    });

    console.log(`📊 Received response: ${response.status} ${response.statusText}`);

    if (response.status === 429) {
      throw new Error('Rate limited by Beatport API');
    }

    if (response.status === 401) {
      throw new Error('Authentication failed - token may be expired');
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async searchTrack(artistName, trackName, mixName = null) {
    const params = {
      artist_name: artistName,
      name: trackName
    };

    if (mixName) {
      params.mix_name = mixName;
    }

    try {
      return await this.makeRequest('/v4/catalog/tracks/', 'GET', params);
    } catch (error) {
      if (error.message.includes('Authentication failed')) {
        console.log('🔄 Refreshing access token...');
        await refreshToken(this.config);
        this.updateAccessToken();
        console.log('✅ Access token refreshed successfully.');
        return await this.makeRequest('/v4/catalog/tracks/', 'GET', params);
      }
    }
  }

  updateAccessToken() {
    this.config = loadConfig() // reload config to get updated tokens
    this.accessToken = this.config.beatport.access_token;
  }


  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve =>
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
  }
}

export default BeatportAPI
