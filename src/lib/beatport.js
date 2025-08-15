import fetch from 'node-fetch'
import refreshToken from './auth.js'

class BeatportAPI {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.beatport.base_url;
    this.accessToken = config.beatport.access_token;
    this.rateLimitDelay = 1000; // 1 req/s
    this.lastRequestTime = 0;
  }

  async makeRequest(endpoint, method = 'GET', params = {}) {
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
        'Content-Type': 'application/json'
      },
      method
    });

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

    return this.makeRequest('/v4/catalog/tracks/', 'GET', params);
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
