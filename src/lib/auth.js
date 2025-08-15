import fetch from 'node-fetch'
import { config, saveConfig } from './config.js';

export async function refreshToken(config) {
  const conf = config()
  const response = await fetch(`${conf.beatport.base_url}/v4/auth/o/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${conf.beatport.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: conf.beatport.client_id,
      refresh_token: conf.beatport.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
  }

  const tokenData = await response.json();

  conf.beatport.access_token = tokenData.access_token;
  conf.beatport.refresh_token = tokenData.refresh_token;

  await saveConfig(conf);

  return tokenData;
}

export async function validateToken(config) {
  try {
    const response = await fetch(`${config.beatport.base_url}/v4/auth/o/introspect/`, {
      headers: {
        'Authorization': `Bearer ${config.beatport.access_token}`
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

export default {
  refreshToken,
  validateToken
};
