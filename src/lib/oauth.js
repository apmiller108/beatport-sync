export default class BeatportOAuth {
  constructor(config) {
    this.config = config.beatport;
  }

  async authorize(username, password) {
    try {
      // 1. Discover client ID
      const clientId = await this.fetchBeatportClientId();
      console.log('🔍 Discovered client ID:', clientId);

      // 2. Create session and login

      const loginURL = new URL('v4/auth/login/?next=/v4/auth/o/authorize/', this.config.base_url)
      loginURL.searchParams.set('response_type', 'code');
      loginURL.searchParams.set('client_id', clientId);
      loginURL.searchParams.set('redirect_uri', this.config.redirectUri);
      const loginResponse = await fetch(loginURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      if (!loginResponse.ok) {
        throw new Error(
          `Login request failed: ${loginResponse.status} ${loginResponse.statusText}`
        );
      }

      // // 3. Get authorization code
      const authUrl = new URL('v4/auth/o/authorize/', this.config.base_url);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', this.config.redirect_uri);

      const authResponse = await fetch(authUrl, {
        redirect: 'manual',
        headers: {
          'Cookie': this.extractCookies(loginResponse)
        }
      });

      const res = await authResponse.text()
      console.log(res)

      // Check for auth errors
      if (authResponse.status !== 302) {
        const errorText = await authResponse.text();
        if (errorText.includes('invalid_request')) {
          const errorMatch = errorText.match(/<p>(.*?)<\/p>/);
          const errorMsg = errorMatch ? errorMatch[1] : 'Unknown authorization error';
          throw new Error(`Authorization failed: ${errorMsg}`);
        }
      }

      // 4. Extract auth code from redirect
      const location = authResponse.headers.get('location');
      if (!location) {
        throw new Error('No redirect location found in authorization response');
      }

      console.log('🔄 Redirected to:', location);

      const locationUrl = new URL(location, this.config.base_url);
      const authCode = locationUrl.searchParams.get('code');
      if (!authCode) {
        throw new Error('No authorization code found in redirect URL');
      }

      console.log('🔑 Got authorization code');

      // 5. Exchange code for tokens
      const tokenResponse = await fetch(new URL('v4/auth/o/token', this.config.base_url), {
        method: 'POST',
        headers: {
          'Cookie': this.extractCookies(loginResponse),
          'Content-Type': 'application/json',
          'Referer': 'https://api.beatport.com/v4/docs/'
        },
        body: JSON.stringify({
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirect_uri,
          client_id: clientId
        })
      });

      const text = await tokenResponse.text()
      console.log(text)

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }

      console.log('🎉 Successfully obtained access tokens');

      return {
        client_id: clientId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope
      };

    } catch (error) {
      console.error('❌ OAuth authorization failed:', error.message);
      throw error;
    }
  }

  async fetchBeatportClientId() {
    try {
      // 1. Fetch the docs page
      const docsResponse = await fetch(new URL('v4/docs/', this.config.base_url));
      if (!docsResponse.ok) {
        throw new Error(`Failed to fetch docs page: ${docsResponse.status}`);
      }

      const html = await docsResponse.text();

      // 2. Extract script URLs
      const jsScripts = html.match(/src="([^"]*\.js[^"]*)"/g);
      if (!jsScripts || jsScripts.length === 0) {
        throw new Error('No JavaScript files found in docs page');
      }

      console.log(`🔍 Searching ${jsScripts.length} JavaScript files for client ID...`);

      let clientId;
      for (const script of jsScripts) {
        const scriptUrl = script.match(/src="([^"]*)"/)[1];
        const fullUrl = scriptUrl.startsWith('http')
              ? scriptUrl : new URL(scriptUrl, this.config.base_url)

        try {
          // 3. Fetch and search each script
          const jsResponse = await fetch(fullUrl);
          if (!jsResponse.ok) continue;

          const jsContent = await jsResponse.text();

          // 4. Look for client ID
          clientId = jsContent.match(/API_CLIENT_ID:\s*['"](.*)['"]/)[1]

          if (clientId) {
            break;
          }
        } catch (scriptError) {
          // Continue to next script if this one fails
          console.debug(`Failed to fetch script ${fullUrl}:`, scriptError.message);
          continue;
        }
      }
      if (clientId) {
        return clientId;
      } else {
        throw new Error('Could not find API_CLIENT_ID in any JavaScript files');
      }
    } catch (error) {
      throw new Error(`Failed to discover Beatport client ID: ${error.message}`);
    }
  }

  extractCookies(response) {
    const setCookieHeaders = response.headers.getSetCookie();
    if (!setCookieHeaders) return '';

    return setCookieHeaders
      .map(cookie => cookie.split(';')[0]) // Take only the name=value part
      .join('; ');
  }
}
