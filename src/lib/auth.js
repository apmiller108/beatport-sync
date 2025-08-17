import fetch from 'node-fetch'
import { saveConfig } from './config.js';

export const refreshToken = async(config) => {
  const response = await fetch(`${config.beatport.base_url}/v4/auth/o/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.beatport.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: config.beatport.client_id,
      refresh_token: config.beatport.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
  }

  const tokenData = await response.json();

  config.beatport.access_token = tokenData.access_token;
  config.beatport.refresh_token = tokenData.refresh_token;

  await saveConfig(config);

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
