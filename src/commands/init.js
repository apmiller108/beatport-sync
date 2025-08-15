import { Command } from 'commander'
import { configFilePath, config, printConfig } from '../lib/config.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

const templatePath = path.join(process.cwd(), 'templates', 'config.yml')

const printInstructions = () => {
  console.log('\n')
  console.log('--------------------------------------------------------')
  console.log('Please follow these steps to get your credentials:')
  console.log('1. Log in to api.beatport.com/v4/docs with your username and password')
  console.log("2. Open your browser's developer tools and go to the Network tab")
  console.log('3. Refresh the page')
  console.log('4. Find the request to https://api.beatport.com/v4/auth/o/token/')
  console.log('5. In the response, you will find your access_token and refresh_token')
  console.log('6. In the request payload, you will find your client_id')
  console.log(`7. Open the config file at ${configFilePath()} and add these values.`)
  console.log('--------------------------------------------------------')
}

export const initCommand = new Command('init').description('Initialize configuration file').action(async () => {
  console.log('🚀 Initializing beatport-sync configuration...')

  if (fs.existsSync(configFilePath())) {
    console.log(`✅ Config file already exists at ${configFilePath()}`)
  } else {
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8')
      fs.writeFileSync(configFilePath(), templateContent)
      console.log(`✅ Config file created at ${configFilePath()}`)
    } catch (error) {
      console.error('❌ Error creating config file:', error)
      return
    }
  }

  if (config().options.verbose) {
    printConfig()
  }

  printInstructions()
})
