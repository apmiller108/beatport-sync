import os from 'os'
import path from 'path'
import Database from 'better-sqlite3'
import { config } from './config.js'

class DB {
  /**
   * @param {object} config - The application configuration.
   */
  constructor(config) {
    console.log('config', config)
    this.db = null
    this.config = config
  }

  /**
   * Establishes a connection to the Mixxx database.
   */
  initialize() {
    const dbPath = this.config.database.path === 'default' ? this.getDefaultDbPath() : this.config.database.path

    try {
      this.db = new Database(dbPath, { readonly: false })
      console.log(`Connected to Mixxx database at: ${dbPath}`)
    } catch (error) {
      if (error.code === 'SQLITE_BUSY') {
        console.error('❌ Database is locked. Please close Mixxx and try again.')
        process.exit(1)
      }
      throw error
    }
  }

  /**
   * Returns the default path to the Mixxx database based on the OS.
   * @returns {string}
   */
  getDefaultDbPath() {
    switch (os.platform()) {
      case 'win32':
        return path.join(os.homedir(), 'AppData', 'Local', 'Mixxx', 'mixxxdb.sqlite')
      case 'darwin':
        return path.join(
          os.homedir(),
          'Library',
          'Containers',
          'org.mixxx.mixxx',
          'Data',
          'Library',
          'Application Support',
          'Mixxx',
          'mixxxdb.sqlite'
        )
      case 'linux':
        return path.join(os.homedir(), '.mixxx', 'mixxxdb.sqlite')
      default:
        throw new Error('Unsupported operating system.')
    }
  }
}

const db = new DB(config())
export default db
