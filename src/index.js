#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Import commands
import { syncCommand } from './commands/sync.js'
import { statsCommand } from './commands/stats.js'
import { initCommand } from './commands/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

const program = new Command()

program
  .name('beatport-sync')
  .description('CLI tool to sync Beatport genre data with Mixxx database')
  .version(packageJson.version)

// Add commands
program.addCommand(syncCommand)
program.addCommand(statsCommand)
program.addCommand(initCommand)

// Parse command line arguments
program.parse()
