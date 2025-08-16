import { Command } from 'commander'
import chalk from 'chalk'
import db from '../lib/database.js'
import { config } from '../lib/config.js'

export const statsCommand = new Command('stats')
  .description('Show database statistics')
  .option('-d, --database <path>', 'Path to Mixxx database')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🔍 Fetching database stats...'))
      db.initialize()

      console.log(chalk.blue.bold('📊 Database Stats'))
      console.log(chalk.gray('------------------'))
      console.log(chalk.dim(`Location: ${db.dbPath()}`))

      const trackCount = db.getTrackCount()
      console.log(`${chalk.bold('Total Tracks:')} ${chalk.green(trackCount)}`)

      const crates = db.getCrates()
      console.log(`${chalk.bold(`Crates (${crates.length}):`)}`)

      if (crates.length > 0) {
        crates.forEach(crate => console.log(chalk.dim(`  - ${crate.name}`)))
      } else {
        console.log(chalk.dim('  No crates found.'))
      }

      const genres = db.getGenres()
      console.log(`${chalk.bold(`Genres (${genres.length}):`)}`)
      if (genres.length > 0) {
        genres.forEach(genre => console.log(chalk.dim(`  - ${genre.genre}`)))
      } else {
        console.log(chalk.dim('  No genres found.'))
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error getting stats: ${error.message}`))
      process.exit(1)
    } finally {
      db.close()
    }
  })
