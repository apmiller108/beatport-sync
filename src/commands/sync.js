import { Command } from 'commander'
import BeatportAPI from '../lib/beatport.js'
import { parseTrackName } from '../utils/trackParser.js'
import { config } from '../lib/config.js'

export const syncCommand = new Command('sync')
  .description('Sync genres from Beatport to Mixxx database')
  .option('-c, --crates <crates>', 'Comma-separated list of crate names to filter by')
  .option('-a, --auto-accept', 'Automatically accept all changes without prompting')
  .option('-d, --database <path>', 'Path to Mixxx database')
  .action(async options => {
    console.log('🎵 Starting Beatport sync...')
    console.log('Options:', options)
    // TODO: Implement sync functionality

    // Example usage of BeatportAPI to search for a track
    try {
      const conf = config()
      const api = new BeatportAPI(conf)

      const track = parseTrackName('Nights of Pleasure (Mark Broom Remix)')
      const result = await api.searchTrack('Mark Williams, Mark Broom', track.name, track.mix)

      console.log(`Results: ${JSON.stringify(result, null, 2)}`)

    } catch (error) {
      console.error('❌ Error during sync:', error.message)
      throw error
      process.exit(1)
    }
  })
