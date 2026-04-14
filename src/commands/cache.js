import { Command } from 'commander'
import chalk from 'chalk'
import cache from '../lib/cache.js'

export const cacheCommand = new Command('cache')
  .description('Manage the "no match" cache')

cacheCommand
  .command('clear')
  .description('Clear the cache of track IDs with no matches')
  .action(() => {
    try {
      cache.clear()
      console.log(chalk.green('✅ Cache cleared successfully.'))
    } catch (error) {
      console.error(chalk.red(`❌ Error clearing cache: ${error.message}`))
    } finally {
      cache.close()
    }
  })

cacheCommand
  .command('stats')
  .description('Show cache statistics')
  .action(() => {
    try {
      const ids = cache.getNoMatchIds()
      console.log(chalk.blue.bold('📦 Cache Stats'))
      console.log(chalk.gray('-------------'))
      console.log(`${chalk.bold('Tracks in "no match" cache:')} ${chalk.yellow(ids.length)}`)
    } catch (error) {
      console.error(chalk.red(`❌ Error getting cache stats: ${error.message}`))
    } finally {
      cache.close()
    }
  })
