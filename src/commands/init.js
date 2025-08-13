import { Command } from 'commander';

export const initCommand = new Command('init')
  .description('Initialize configuration file')
  .action(async () => {
    console.log('🚀 Initializing beatport-sync configuration...');
    // TODO: Implement config initialization
  });
