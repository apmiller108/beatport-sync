import { Command } from 'commander';

export const statsCommand = new Command('stats')
  .description('Show database statistics')
  .option('-d, --database <path>', 'Path to Mixxx database')
  .action(async (options) => {
    console.log('📊 Database Statistics');
    console.log('Database path:', options.database || 'default');
    // TODO: Implement stats functionality
  });
