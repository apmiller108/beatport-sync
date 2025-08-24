import readline from 'readline'
import chalk from 'chalk'

export const confirmUpdate = (track, newGenre) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = `
    Track: ${chalk.cyan(track.artist)} - ${chalk.cyan(track.title)}
    Current genre: ${chalk.yellow(track.genre || 'None')}
    Beatport genre: ${chalk.green(newGenre)}

    ${chalk.bold('Accept this change? [y/n/a/q] (y=yes, n=no, a=accept all, q=quit)')}: `

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      const choice = answer.trim().toLowerCase()
      switch (choice) {
        case 'y':
        case 'yes':
          resolve('yes')
          break
        case 'a':
        case 'all':
          resolve('all')
          break
        case 'q':
        case 'quit':
          resolve('quit')
          break
        case 'n':
        case 'no':
        default:
          resolve('no')
          break
      }
    })
  })
}
