import readline from 'readline'
import chalk from 'chalk'

const FIELD_DEFS = [
  { key: 'genre', label: 'Genre', shortcut: 'g', trackKey: 'genre' },
  { key: 'year', label: 'Year', shortcut: 'y', trackKey: 'year' },
  { key: 'grouping', label: 'Label', shortcut: 'l', trackKey: 'grouping' }
]

export const confirmUpdate = (track, metadataOrGenre) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  let metadata = metadataOrGenre
  if (typeof metadataOrGenre === 'string') {
    metadata = { genre: metadataOrGenre }
  }

  const pending = FIELD_DEFS.filter(f =>
    metadata[f.key] !== undefined && metadata[f.key] !== track[f.trackKey]
  )

  let changesText = ''
  pending.forEach(field => {
    changesText += `    [${chalk.bold(field.shortcut)}] ${field.label}: ${chalk.yellow(track[field.trackKey] || 'None')} → ${chalk.green(metadata[field.key])}\n`
  })

  const shortcuts = pending.map(f => f.shortcut).join('/')
  const question = `
    Track: ${chalk.cyan(track.artist)} - ${chalk.cyan(track.title)}
${changesText}
    ${chalk.bold(`Accept changes? [y=all / n=skip / a=auto-accept all / q=quit / fields: ${shortcuts} (comma-sep)]`)}: `

  const buildUpdates = (keys) => {
    const updates = {}
    for (const key of keys) {
      updates[key] = metadata[key]
    }
    return updates
  }

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      const choice = answer.trim().toLowerCase()

      switch (choice) {
        case 'y':
        case 'yes':
          return resolve({ action: 'yes', updates: buildUpdates(pending.map(f => f.key)) })
        case 'a':
        case 'all':
          return resolve({ action: 'all', updates: buildUpdates(pending.map(f => f.key)) })
        case 'q':
        case 'quit':
          return resolve({ action: 'quit' })
        case 'n':
        case 'no':
        case '':
          return resolve({ action: 'no' })
      }

      const tokens = choice.split(',').map(t => t.trim()).filter(Boolean)
      const selected = []
      const invalid = []
      for (const tok of tokens) {
        const field = pending.find(f => f.shortcut === tok)
        if (field) {
          if (!selected.includes(field.key)) selected.push(field.key)
        } else {
          invalid.push(tok)
        }
      }

      if (invalid.length > 0 || selected.length === 0) {
        console.log(chalk.yellow(`⚠️ Unrecognized input: "${answer.trim()}". Skipping.`))
        return resolve({ action: 'no' })
      }

      resolve({ action: 'partial', updates: buildUpdates(selected) })
    })
  })
}
