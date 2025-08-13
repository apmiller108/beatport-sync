import { Command } from 'commander';

export const syncCommand = new Command('sync')
  .description('Sync genres from Beatport to Mixxx database')
  .option('-c, --crates <crates>', 'Comma-separated list of crate names to filter by')
  .option('-a, --auto-accept', 'Automatically accept all changes without prompting')
  .option('-d, --database <path>', 'Path to Mixxx database')
  .action(async (options) => {
    console.log('🎵 Starting Beatport sync...');
    console.log('Options:', options);
    // TODO: Implement sync functionality
  });
