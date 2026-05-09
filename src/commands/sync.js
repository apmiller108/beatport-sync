import { Command } from 'commander'
import chalk from 'chalk'
import db from '../lib/database.js'
import cache from '../lib/cache.js'
import BeatportAPI from '../lib/beatport.js'
import { parseTrackName } from '../utils/trackParser.js'
import { config as loadConfig } from '../lib/config.js'
import { refreshToken } from '../lib/auth.js'
import { confirmUpdate } from '../utils/prompts.js'

export const syncCommand = new Command('sync')
  .description('Sync genres from Beatport to Mixxx database')
  .option('-c, --crates <crates>', 'Comma-separated list of crate names to filter by')
  .option('-g, --genres <genres>', 'Comma-separated list of genres to filter by')
  .option('-m, --missing-genre', 'Only process tracks that are missing genre information')
  .option('-s, --skip-cache', 'Skip the "no match" cache and search for all tracks')
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
      
      const excludeIds = options.skipCache ? [] : cache.getNoMatchIds()
      const tracks = db.getTracks(crateNames, genreNames, options.missingGenre, excludeIds)

      if (tracks.length === 0) {
        console.log(chalk.yellow('No tracks found to process.'))
        return
      }

      if (excludeIds.length > 0 && !options.skipCache) {
        console.log(chalk.dim(`ℹ️ Skipping ${excludeIds.length} tracks previously marked as "no match".`))
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
            console.log(chalk.yellow('❌ No match found. Adding to cache.'))
            cache.addNoMatch(track.id)
            continue
          }

          if (beatportTrack.results.length > 1) {
            console.log(chalk.yellow('⚠️ Multiple results found, using the first one.'))
          }

          const beatportData = beatportTrack.results[0]
          const newGenre = beatportData.genre.name
          const newYear = beatportData.publish_date ? beatportData.publish_date.substring(0, 4) : null
          const newLabel = beatportData.release?.label?.name || null

          const updates = {}
          if (newGenre && track.genre !== newGenre) updates.genre = newGenre
          if (newYear && track.year !== newYear) updates.year = newYear
          if (newLabel && track.grouping !== newLabel) updates.grouping = newLabel

          if (Object.keys(updates).length === 0) {
            console.log(chalk.gray('⏭️ Metadata is already up to date, skipping.'))
            continue
          }

          if (options.autoAccept) {
            db.updateTrack(track.id, updates)
            console.log(chalk.green('✅ Metadata updated automatically.'))
            continue
          }

          const { action, updates: selectedUpdates } = await confirmUpdate(track, updates)
          switch (action) {
            case 'yes':
              db.updateTrack(track.id, selectedUpdates)
              console.log(chalk.green('✅ Metadata updated.'))
              break
            case 'partial':
              db.updateTrack(track.id, selectedUpdates)
              console.log(chalk.green(`✅ Updated fields: ${Object.keys(selectedUpdates).join(', ')}.`))
              break
            case 'all':
              db.updateTrack(track.id, selectedUpdates)
              console.log(chalk.green('✅ Metadata updated. All future changes will be accepted automatically.'))
              options.autoAccept = true
              break
            case 'quit':
              console.log(chalk.yellow('👋 Quitting sync process.'))
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
      cache.close()
      console.log('\n✨ Sync process complete.')
    }
  })
