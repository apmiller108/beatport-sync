import { Command } from 'commander'
import chalk from 'chalk'
import db from '../lib/database.js'
import BeatportAPI from '../lib/beatport.js'
import { parseTrackName } from '../utils/trackParser.js'
import { config as loadConfig } from '../lib/config.js'
import { refreshToken } from '../lib/auth.js'
import { confirmUpdate } from '../utils/prompts.js'

export const syncCommand = new Command('sync')
  .description('Sync genres from Beatport to Mixxx database')
  .option('-c, --crates <crates>', 'Comma-separated list of crate names to filter by')
  .option('-g, --genres <genres>', 'Comma-separated list of genres to filter by')
  .option('-a, --auto-accept', 'Automatically accept all changes without prompting')
  .option('-d, --database <path>', 'Path to Mixxx database')
  .action(async (options) => {
    try {
      db.initialize({ dbPath: options.database })
      let config = loadConfig()
      const api = new BeatportAPI(config)

      const crateNames = options.crates ? options.crates.split(',').map(name => name.trim()) : []
      const genreNames = options.genres ? options.genres.split(',').map(name => name.trim()) : []

      console.log(chalk.blue('🎵 Starting Beatport sync...'))
      const tracks = db.getTracks(crateNames, genreNames)

      if (tracks.length === 0) {
        console.log(chalk.yellow('No tracks found to process.'))
        return
      }

      console.log(`🔍 Found ${chalk.green(tracks.length)} tracks to process.`) 

      for (const [index, track] of tracks.entries()) {

        console.log(
          `\n${chalk.dim(`(${index + 1}/${tracks.length})`)} Processing: ${chalk.cyan(track.artist)} - ${chalk.cyan(track.title)}`
        )

        try {
          const parsedTrack = parseTrackName(track.title)
          const beatportTrack = await api.searchTrack(track.artist, parsedTrack.name, parsedTrack.mix)

          if (!beatportTrack || beatportTrack.results.length === 0) {
            console.log(chalk.yellow('❌ No match found.'))
            continue
          }

          if (beatportTrack.results.length > 1) {
            console.log(chalk.yellow('⚠️ Multiple results found, using the first one.'))
          }

          const newGenre = beatportTrack.results[0].genre.name
          console.log(`🔍 Current genre: ${chalk.dim(track.genre || 'None')}`)
          console.log(`✅ Found genre: ${chalk.green(newGenre)}`)

          if (track.genre === newGenre) {
            console.log(chalk.gray('⏭️ Genre is the same, skipping update.'))
            continue
          }

          if (options.autoAccept) {
            db.updateTrackGenre(track, newGenre)
            console.log(chalk.green('✅ Genre updated automatically.'))
            continue
          }

          const choice = await confirmUpdate(track, newGenre)
          switch (choice) {
            case 'yes':
              db.updateTrackGenre(track, newGenre)
              console.log(chalk.green('✅ Genre updated.'))
              break
            case 'all':
              db.updateTrackGenre(track, newGenre)
              console.log(chalk.green('✅ Genre updated. All future changes will be accepted automatically.'))
              options.autoAccept = true
              break
            case 'quit':
              console.log(chalk.yellow('👋 Quitting sync process.'))
              db.close()
              return
            case 'no':
            default:
              console.log(chalk.gray('⏭️ Change skipped.'))
              break
          }
        } catch (error) {
          if (error.message.includes('Token refresh failed')) {
            console.error(chalk.red('❌ Token refresh failed. Please set up your credentials again. see `beatport-sync init --help`'))
            break
          }
          console.error(chalk.red(`❌ Error processing track: ${error.message}`))
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ An unexpected error occurred: ${error.message}`)) 
    } finally {
      db.close()
      console.log('\n✨ Sync process complete.')
    }
  })
