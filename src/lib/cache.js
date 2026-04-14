import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'

const CACHE_DB_PATH = path.join(os.homedir(), '.beatport-sync.cache.sqlite')

class Cache {
  constructor() {
    this.db = null
  }

  initialize() {
    if (this.db) return
    this.db = new Database(CACHE_DB_PATH)
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS no_match_tracks (
        track_id INTEGER PRIMARY KEY
      )
    `).run()
  }

  addNoMatch(trackId) {
    this.initialize()
    this.db.prepare('INSERT OR IGNORE INTO no_match_tracks (track_id) VALUES (?)').run(trackId)
  }

  getNoMatchIds() {
    this.initialize()
    const rows = this.db.prepare('SELECT track_id FROM no_match_tracks').all()
    return rows.map(row => row.track_id)
  }

  isNoMatch(trackId) {
    this.initialize()
    const row = this.db.prepare('SELECT 1 FROM no_match_tracks WHERE track_id = ?').get(trackId)
    return !!row
  }

  clear() {
    this.initialize()
    this.db.prepare('DELETE FROM no_match_tracks').run()
  }

  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

const cache = new Cache()
export default cache
