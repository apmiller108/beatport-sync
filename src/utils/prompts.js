import readline from 'readline'
import chalk from 'chalk'

export const confirmUpdate = (track, metadataOrGenre) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  let metadata = metadataOrGenre
  if (typeof metadataOrGenre === 'string') {
    metadata = { genre: metadataOrGenre }
  }

  const fields = [
    { key: 'genre', label: 'Genre', current: track.genre },
    { key: 'year', label: 'Year', current: track.year },
    { key: 'grouping', label: 'Label', current: track.grouping }
  ]

  let changesText = ''
  fields.forEach(field => {
    if (metadata[field.key] !== undefined && metadata[field.key] !== field.current) {
      changesText += `    ${field.label}: ${chalk.yellow(field.current || 'None')} → ${chalk.green(metadata[field.key])}\n`
    }
  })

  const question = `
    Track: ${chalk.cyan(track.artist)} - ${chalk.cyan(track.title)}
${changesText}
    ${chalk.bold('Accept these changes? [y/n/a/q] (y=yes, n=no, a=accept all, q=quit)')}: `

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
