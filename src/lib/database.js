import os from 'os'
import path from 'path'
import Database from 'better-sqlite3'
import { config } from './config.js'

class DB {
  /**
   * @param {object} config - The application configuration.
   */
  constructor() {
    this.db = null
    this.config = null
  }

  /**
   * Establishes a connection to the Mixxx database.
   */
  initialize({ dbPath } = {}) {
    this.config = config()
    const path = dbPath || this.dbPath()

    try {
      this.db = new Database(path, { readonly: false })
      this.validateDatabase()
      this.db.pragma('journal_mode = WAL') // Use Write-Ahead Logging for better concurrency
      console.log(`Connected to Mixxx database at: ${path}`)
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

  close() {
    if (this.db) {
      this.db.close()
      if (this.config.verbose) {
        console.log(`✅ Closed Mixxx database connection at: ${this.dbPath()}`)
      }
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

  dbPath() {
    return this.config.database.path === 'default' ? this.getDefaultDbPath() :
      path.resolve(this.config.database.path)
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

  getTrackCount() {
    return this.db.prepare(
      'SELECT COUNT(id) as count FROM library WHERE mixxx_deleted = 0'
    ).get().count
  }

  getCrates() {
    return this.db.prepare(
      `SELECT DISTINCT name FROM crates
       JOIN crate_tracks ON crates.id = crate_tracks.crate_id
       JOIN library ON crate_tracks.track_id = library.id
       WHERE library.mixxx_deleted = 0
       ORDER BY name`
    ).all()
  }

  getGenres() {
    return this.db.prepare(
      `SELECT DISTINCT genre FROM library
       WHERE genre IS NOT NULL AND genre != ''
             AND mixxx_deleted = 0
       ORDER BY genre`
    ).all()
  }

  getTracks(crates = [], genres = []) {
    let query = `
      SELECT
        l.id, l.artist, l.title, l.genre
      FROM
        library l
    `

    if (crates.length) {
      query += `
        JOIN crate_tracks ct ON l.id = ct.track_id
        JOIN crates c ON ct.crate_id = c.id
        WHERE c.name IN (${crates.map(() => '?').join(',')})
          AND l.mixxx_deleted = 0
      `
    } else {
      query += ' WHERE l.mixxx_deleted = 0'
    }

    if (genres.length) {
      query += ` AND genre IN (${genres.map(g => '?').join(',')})`
    }

    if (this.config.options.verbose) {
      console.log(`Executing query:\n${query}\n`)
    }

    return this.db.prepare(query).all([...crates, ...genres])
  }
}

const db = new DB()
export default db
