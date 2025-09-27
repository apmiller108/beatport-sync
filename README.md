# beatport-sync

_Update mixxxdb with track data from Beatport._

## Overview

`beatport-sync` is a CLI utility that synchronizes track genre data in a [Mixxx](https://mixxx.org/) SQLite database (`mixxxdb.sqlite`) with up-to-date information from the [Beatport](https://www.beatport.com/) API. It is built with Node.js and designed to be run from the command line.

Given a library of tracks managed by Mixxx, this tool queries Beatport for each track's metadata, and updates the database genre field to match Beatport's canonical genre. Users can filter which tracks to update by crate and/or genre, see database statistics, and interactively confirm changes.

## Features

- **Sync genres**: Fetches latest genre info from Beatport for each track, updates Mixxx DB.
- **Crate/genre filtering**: Limit syncing to particular crates or genres.
- **Stats**: Print database stats such as total tracks, crate names, genre names.
- **Config management**: Initialize and manage configuration via CLI.
- **Interactive CLI**: Confirm or accept all genre changes.
- **Logging**: Logs every update with details (track name, artist, old/new genre).

## Project Structure

```
beatport-sync/
├── src/
│   ├── index.js              # CLI entry point
│   ├── commands/
│   │   ├── sync.js           # Main sync command
│   │   ├── stats.js          # Database stats
│   │   └── init.js           # Config initialization
│   ├── lib/
│   │   ├── config.js         # Config file handling
│   │   ├── database.js       # SQLite operations
│   │   ├── beatport.js       # API client
│   │   └── auth.js           # Token management
│   └── utils/
│       ├── logger.js         # Logging utilities
│       ├── trackParser.js    # Parse library track name to extract mix
│       └── prompts.js        # User interaction
├── templates/
│   └── config.yml            # Default config template
```

## Technology

- Node.js (ESM modules)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite DB access
- [commander](https://github.com/tj/commander.js/) — CLI framework
- [chalk](https://github.com/chalk/chalk) — Terminal output
- [js-yaml](https://github.com/nodeca/js-yaml) — YAML config

## Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/apmiller108/beatport-sync.git
cd beatport-sync
npm install
```

## Configuration

Before first use, run the init command to generate a config file in your home directory (`~/.beatport-sync.config.yml`). This config stores API credentials and DB path.

```bash
beatport-sync init
```

## Usage

The CLI requires an explicit command. Run with `--help` for more info.

### Commands:

#### 1. Sync

Synchronize Mixxx DB genres with Beatport:

```bash
beatport-sync sync [--crates crate1,crate2] [--auto-accept] [--database /path/to/mixxxdb.sqlite]
```

**Options:**
- `--crates` — Comma-separated list of crate names to filter tracks.
- `--auto-accept` — Accept genre changes for all tracks without prompting.
- `--database` — Path to Mixxx database (optional, uses default if omitted).

**Interactive prompts:**
For each proposed genre update, you can choose:
- `y` — Accept change
- `n` — Skip
- `a` — Accept all remaining
- `q` — Quit sync

#### 2. Stats

Show database statistics:

```bash
beatport-sync stats [--database /path/to/mixxxdb.sqlite]
```

Prints:
- Total track count
- Crate names
- Genre names

#### 3. Init

Generate and review the configuration file:

```bash
beatport-sync init
```

#### 4. Help & Version

```bash
beatport-sync --help
beatport-sync --version
```

## Database Schema

Beatport-sync operates on the `library`, `crates`, and `crate_tracks` tables in your Mixxx database. The `genre` field in `library` is updated based on Beatport's API.

## Rollback

To undo changes, restore your `mixxxdb.sqlite` from a backup.

## Edge Cases

- Tracks with no Beatport match are skipped.
- Empty crates, deleted tracks (`mixxx_deleted = 1`), special characters, network errors, and long genre names are handled gracefully.

## License

MIT

---
**Author:** [apmiller108](https://github.com/apmiller108)
