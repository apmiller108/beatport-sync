import os from 'os'
import path from 'path'
import Database from 'better-sqlite3'
import { config } from './config.js'

class DB {
  /**
   * @param {object} config - The application configuration.
   */
  constructor(config) {
    this.db = null
    this.config = config
  }

  /**
   * Establishes a connection to the Mixxx database.
   */
  initialize() {
    const dbPath = this.config.database.path === 'default' ? this.getDefaultDbPath() : path.resolve(this.config.database.path)

    try {
      this.db = new Database(dbPath, { readonly: false })
      this.validateDatabase()
      this.db.pragma('journal_mode = WAL') // Use Write-Ahead Logging for better concurrency
      console.log(`Connected to Mixxx database at: ${dbPath}`)
    } catch (error) {
      if (error.code === 'SQLITE_BUSY') {
        console.error('❌ Database is locked. Please close Mixxx and try again.')
        process.exit(1)
      }
      if (error.message.includes('database is not valid')) {
        console.error('❌ The Mixxx database is not valid. Please check the database path.')
        process.exit(1)
      }
      throw error
    }
  }

  validateDatabase() {
    const tracksTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='library'").get()
    const cratesTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='crates'").get()
    const crateTracksTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='crate_tracks'").get()

    if (!tracksTable || !cratesTable || !crateTracksTable) {
      throw new Error('The Mixxx database is not valid or does not contain the expected tables.' )
    } else {
      if (this.config.verbose) {
        console.log('✅ Mixxx database validation successful.')
      }
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

let db
try {
  db = new DB(config())
} catch (error) {
  if (error.message.includes('Configuration file not found')) {
    console.error('❌ Configuration file not found. Please run the init command to create it.')
  } else {
    console.error('❌ Error initializing database:', error.message)
  }
  process.exit(1)
}

export default db
