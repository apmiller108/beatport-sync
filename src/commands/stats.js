import { Command } from 'commander'
import chalk from 'chalk'
import db from '../lib/database.js'
import { config } from '../lib/config.js'

export const statsCommand = new Command('stats')
  .description('Show database statistics')
  .option('-c, --crates <crates>', 'Comma-separated list of crate names to filter by')
  .option('-g, --genres <genres>', 'Comma-separated list of genres to filter by')
  .option('-m, --missing-genre', 'Only show stats for tracks that are missing genre information')
  .option('-d, --database <path>', 'Path to Mixxx database')
  .action(async (options) => {
    try {
      db.initialize({ dbPath: options.database })

      const crateNames = options.crates ? options.crates.split(',').map(name => name.trim()) : []
      const genreNames = options.genres ? options.genres.split(',').map(name => name.trim()) : []

      console.log(chalk.blue.bold('📊 Database Stats'))
      console.log(chalk.gray('------------------'))
      console.log(chalk.dim(`Location: ${db.dbPath()}`))

      const trackCount = db.getTrackCount(crateNames, genreNames, options.missingGenre)
      console.log(`${chalk.bold('Tracks Found:')} ${chalk.green(trackCount)}`)

      if (trackCount > 0) {
        const missingGenreCount = db.getTrackCount(crateNames, genreNames, true)
        const missingYearCount = db.db.prepare(`
          SELECT COUNT(l.id) as count FROM library l
          ${crateNames.length ? 'JOIN crate_tracks ct ON l.id = ct.track_id JOIN crates c ON ct.crate_id = c.id' : ''}
          WHERE (l.year IS NULL OR l.year = '') AND l.mixxx_deleted = 0
          ${crateNames.length ? `AND LOWER(c.name) IN (${crateNames.map(() => '?').join(',')})` : ''}
          ${genreNames.length ? `AND LOWER(l.genre) IN (${genreNames.map(() => '?').join(',')})` : ''}
        `).get([...crateNames.map(c => c.toLowerCase()), ...genreNames.map(g => g.toLowerCase())]).count

        const missingLabelCount = db.db.prepare(`
          SELECT COUNT(l.id) as count FROM library l
          ${crateNames.length ? 'JOIN crate_tracks ct ON l.id = ct.track_id JOIN crates c ON ct.crate_id = c.id' : ''}
          WHERE (l.grouping IS NULL OR l.grouping = '') AND l.mixxx_deleted = 0
          ${crateNames.length ? `AND LOWER(c.name) IN (${crateNames.map(() => '?').join(',')})` : ''}
          ${genreNames.length ? `AND LOWER(l.genre) IN (${genreNames.map(() => '?').join(',')})` : ''}
        `).get([...crateNames.map(c => c.toLowerCase()), ...genreNames.map(g => g.toLowerCase())]).count

        console.log(chalk.bold('\nMissing Information:'))
        console.log(`  - Missing Genre: ${missingGenreCount > 0 ? chalk.red(missingGenreCount) : chalk.green('0')}`)
        console.log(`  - Missing Year:  ${missingYearCount > 0 ? chalk.yellow(missingYearCount) : chalk.green('0')}`)
        console.log(`  - Missing Label: ${missingLabelCount > 0 ? chalk.yellow(missingLabelCount) : chalk.green('0')}`)
      }

      if (crateNames.length || genreNames.length || options.missingGenre) {
        console.log(chalk.dim('Applied Filters:'))
        if (crateNames.length) console.log(chalk.dim(`  - Crates: ${crateNames.join(', ')}`))
        if (genreNames.length) console.log(chalk.dim(`  - Genres: ${genreNames.join(', ')}`))
        if (options.missingGenre) console.log(chalk.dim('  - Missing Genre: Yes'))
      }

      const crates = db.getCrates()
      console.log(`${chalk.bold(`Available Crates (${crates.length}):`)}`)

      if (crates.length > 0) {
        crates.forEach(crate => console.log(chalk.dim(`  - ${crate.name}`)))
      } else {
        console.log(chalk.dim('  No crates found.'))
      }

      const genres = db.getGenres()
      console.log(`${chalk.bold(`Available Genres (${genres.length}):`)}`)
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
