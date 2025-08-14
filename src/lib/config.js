import path from 'path'
import os from 'os'
import fs from 'fs'
import yaml from 'js-yaml'

const homeDir = os.homedir()
export const configFileName = '.beatport-sync.config.yml'

export const configFilePath = () => {
  return path.join(homeDir, configFileName)
}

/**
 * Reads the configuration file and returns its contents as a JavaScript object.
 * @returns {object} The configuration object.
 */
export const config = () => {
  const fileContents = fs.readFileSync(configFilePath(), 'utf-8')
  return yaml.load(fileContents)
}

export default {
  configFileName,
  configFilePath,
  config,
}
