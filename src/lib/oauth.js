// src/lib/beatport-oauth.js
class BeatportOAuth {
  constructor(config) {
    this.config = config.beatport
  }

  async authorize() {
    // 1. Discover client ID
    const clientId = await fetchBeatportClientId();

    // 2. Create session and login
    const loginResponse = await fetch(`${this.config.base_url}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.username || !loginData.email) {
      throw new Error(`Beatport login failed: ${JSON.stringify(loginData)}`);
    }

    // 3. Get authorization code
    const authUrl = new URL(`${this.config.base_url}/auth/o/authorize/`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);

    const authResponse = await fetch(authUrl, {
      redirect: 'manual',
      headers: {
        'Cookie': this.extractCookies(loginResponse) // TODO: implement extractCookies
      }
    });

    // 4. Extract auth code from redirect
    const location = authResponse.headers.get('location');
    const authCode = new URL(location).searchParams.get('code');

    // 5. Exchange code for tokens
    // TODO implement this at a POST request with JSON body
    // const tokenUrl = new URL(`${this.baseUrl}/auth/o/token/`);
    // tokenUrl.searchParams.set('code', authCode);
    // tokenUrl.searchParams.set('grant_type', 'authorization_code');
    // tokenUrl.searchParams.set('redirect_uri', this.redirectUri);
    // tokenUrl.searchParams.set('client_id', clientId);

    // const tokenResponse = await fetch(tokenUrl, { method: 'POST' });
    // const tokenData = await tokenResponse.json();

    return {
      client_id: clientId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in
    };
  }

  async fetchBeatportClientId() {
    try {
      // 1. Fetch the docs page
      const docsResponse = await fetch(`${this.config.base_url}/v4/docs/`);
      const html = await docsResponse.text();

      // 2. Extract script URLs
      const scriptMatches = html.match(/src="([^"]*\.js[^"]*)"/g);

      for (const match of scriptMatches) {
        const scriptUrl = match.match(/src="([^"]*)"/)[1];
        const fullUrl = `${this.config.base_url}${scriptUrl}`;

        // 3. Fetch and search each script
        const jsResponse = await fetch(fullUrl);
        const jsContent = await jsResponse.text();

        // 4. Look for client ID pattern
        const clientIdMatch = jsContent.match(/API_CLIENT_ID:\s*['"](.*?)['"]/)

        if (clientIdMatch) {
          return clientIdMatch[1];
        }
      }

      throw new Error('Could not fetch API_CLIENT_ID from Beatport docs');
    } catch (error) {
      throw new Error(`Failed to discover Beatport client ID: ${error.message}`);
    }
  }
}
