import path from 'path'
import os from 'os'
import fs from 'fs'
import yaml from 'js-yaml'

export const configFileName = '.beatport-sync.config.yml'

export const configFilePath = () => {
  return path.join(os.homedir(), configFileName)
}

export const configFileExists = () => {
  return fs.existsSync(configFilePath())
}

/**
 * Reads the configuration file and returns its contents as a JavaScript object.
 * @returns {object} The configuration object.
 */
export const config = () => {
  if (!configFileExists()) {
    throw new Error(`Configuration file not found at ${configFilePath()}. Please run the init command to create it.`)
  }
  const fileContents = fs.readFileSync(configFilePath(), 'utf-8')
  return yaml.load(fileContents)
}

export const printConfig = () => {
  if (configFileExists()) {
    console.log('🔍 Current configuration:')
    console.log(config())
  }
}

export const saveConfig = async (newConfig) => {
  try {
    const yamlStr = yaml.dump(newConfig)
    fs.writeFileSync(configFilePath(), yamlStr, 'utf-8')
    if (config().options.verbose) {
      console.log(`✅ Configuration saved to ${configFilePath()}`)
    }
    return config()
  } catch (error) {
    console.error('❌ Error saving configuration:', error)
    throw error
  }
}

export default {
  configFileName,
  configFilePath,
  configFileExists,
  config,
  printConfig,
  saveConfig
}
