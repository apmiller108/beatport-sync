import { Command } from 'commander';
import { configFilePath, config as getConfig, printConfig, saveConfig } from '../lib/config.js';
import BeatportOAuth from '../lib/oauth.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const templatePath = path.join(process.cwd(), 'templates', 'config.yml');

const printInstructions = () => {
  console.log('\n');
  console.log('--------------------------------------------------------');
  console.log('Please follow these steps to get your credentials:');
  console.log('1. Log in to api.beatport.com/v4/docs with your username and password');
  console.log("2. Open your browser's developer tools and go to the Network tab");
  console.log('3. Refresh the page');
  console.log('4. Find the request to https://api.beatport.com/v4/auth/o/token/');
  console.log('5. In the response, you will find your access_token and refresh_token');
  console.log('6. In the request payload, you will find your client_id');
  console.log(`7. Open the config file at ${configFilePath()} and add these values.`);
  console.log('--------------------------------------------------------');
};

const promptUser = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const promptPassword = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    // Hide password input (basic approach)
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted) {
        rl.output.write('*');
      } else {
        rl.output.write(stringToWrite);
      }
    };
    rl.stdoutMuted = true;
  });
};

export const initCommand = new Command('init')
  .description('Initialize configuration file')
  .option('--oauth', 'Use OAuth flow with username/password')
  .option('--manual', 'Use manual token extraction (default)')
  .action(async (options) => {
    console.log('🚀 Initializing beatport-sync configuration...');

    // Create config file if it doesn't exist
    if (fs.existsSync(configFilePath())) {
      console.log(`✅ Config file already exists at ${configFilePath()}`);
    } else {
      try {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        fs.writeFileSync(configFilePath(), templateContent);
        console.log(`✅ Config file created at ${configFilePath()}`);
      } catch (error) {
        console.error('❌ Error creating config file:', error);
        return;
      }
    }

    if (options.oauth) {
      // await initOAuthFlow();
      console.log('⚠️  OAuth flow is currently disabled. Please use the manual method.');
    } else {
      printInstructions();
    }
  });

async function initOAuthFlow() {
  try {
    console.log('\n🔐 Starting OAuth authentication flow...');

    // Get credentials from user
    const username = await promptUser('Beatport username: ');
    const password = await promptPassword('Beatport password: ');
    console.log(''); // New line after hidden password input

    // Load current config and add credentials
    const currentConfig = getConfig();

    // Perform OAuth flow
    const oauth = new BeatportOAuth(currentConfig);
    console.log('🔄 Authenticating with Beatport...');

    const tokens = await oauth.authorize(username, password);

    // Update config with tokens
    currentConfig.beatport.client_id = tokens.client_id;
    currentConfig.beatport.access_token = tokens.access_token;
    currentConfig.beatport.refresh_token = tokens.refresh_token;

    // Save updated config
    await saveConfig(currentConfig);

    console.log('✅ OAuth authentication successful!');
    console.log('🔒 Credentials have been saved to your config file.');

  } catch (error) {
    console.error('❌ OAuth authentication failed:', error.message);
    console.log('\n💡 You can try the manual approach instead:');
    console.log('   beatport-sync init --manual');
  }
}
