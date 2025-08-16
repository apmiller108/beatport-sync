# Project overview

beatport-sync

1.  For each record in the library table in the mixxxdb.sqlite database,
    do an API

call to the beatport API to get the track information. Use the artist
name and track name as params.

1.  Users can pass a -c/–crates flag which is a list of comma separated
    crate names to filter by. If a specified crate does not exist,
    inform the user and run the stats command, then exit.
2.  If the track information exists, update the genre column in the
    sqlite database

for that track from the JSON response (`results[0].genre.name`)

1.  Write a log entry to STDOUT for each operation indicating what was
    updated (mixxx track ID, track name, track artist, old genre, new
    genre)
2.  There should be a CLI stats command that prints stats about the
    database such as, number of tracks, list of existing crate names,
    list of existing genre names.

# CLI Interface

``` bash
# Main sync command
beatport-sync sync [--crates crate1,crate2] [--auto-accept] [--database /path/to/db]

# Stats command
beatport-sync stats [--database /path/to/db]

# Config generation
beatport-sync init

# additional commands
beatport-sync --help
beatport-sync --version
```

There is no default command. An explicit command is required.

# Technology

Node.js runtime
module type: ESM

## dependencies

  - better-sqlite3
  - fetch
  - commander.js (CLI library)
  - chalk (for enhanced terminal output)

# Beatport API

  - Beatport's rate limits are unknown. There are not specified in the
    docs.
  - Let's start with 1 req/s
  - If a 429 occurs, do not retry, exit.

## Authentication

If authentication fails, the application should exit with an error
message explaining that the config file may need to be updated along
with instructions regarding how to get an Access Token from beatport.

### Get an Access Token

The following steps will need to be manually performed in order to
obtain the access token. The data will need to be provided to the CLI
tool somehow.

To get an Access Token:

1.  Log in to api.beatport.com/v4/docs with you username and password
2.  Open dev tools, network tab
3.  Refresh the page
4.  Copy fetch request response to
    <https://api.beatport.com/v4/auth/o/token/>
5.  Copy the client ID from the request payload

<!-- end list -->

``` json
{
  "access_token": "1234abcd",
  "expires_in": 36000,
  "token_type": "Bearer",
  "scope": "app:docs user:dj",
  "refresh_token": "abcd1234"
}
```

How should this data be provided to the CLI tool? Store this data in a
config file: .beatport-sync.config.yml in the user's home directory.

``` ymal
# beatport-sync.yml
beatport:
  # Required: Get these from the manual auth process
  client_id: "your_client_id_here"
  access_token: "your_access_token_here"
  refresh_token: "your_refresh_token_here"

  # API settings
  base_url: "https://api.beatport.com/v4"
  max_retries: 3

database:
  path: "./mixxx/mixxxdb.sqlite"
  backup_before_update: true

logging:
  level: "info"  # debug, info, warn, error
  show_progress: true

options:
  auto_accept: false
  overwrite_existing_genres: true
```

The application should have a command to generate a config file. Once
generated prompt the user to obtain the access token and client ID with
the proper instructions.

### Using the Access Token

Set bearer token in Authorization header:

``` bash
http https://api.beatport.com/v4/auth/o/introspect/ \
  "Authorization:Bearer $ACCESS_TOKEN"
```

### Refreshing the Access Token

Tokens will expire. Refresh with:

``` bash
CLIENT_ID="YOUR_CLIENT_ID"
ACCESS_TOKEN="YOUR_ACCESS_TOKEN"
REFRESH_TOKEN="YOUR_REFRESH_TOKEN"

http -f https://api.beatport.com/v4/auth/o/token/ \
  "Authorization:Bearer $ACCESS_TOKEN"
  client_id=$CLIENT_ID \
  refresh_token=$REFRESH_TOKEN \
  grant_type=refresh_token
```

The application should handle automatically refreshing tokens. Write new
tokens to the config file.

## Get track

See <https://api.beatport.com/v4/docs/v4/catalog/tracks/> for API docs.

Tracks will be retrieved using the `name` and `artist_name` parmas.
Optionally include the `mix_name` param if relevant.

### Request

  - Only do exact match search.
  - Do not normalize values
  - If multiple matches are found, print a warning, but take the first
    one.
  - If the track name from the database contains a string in
    parenthesis, that string should be removed from the `name` param.
    The enclosed string should be added as the `mix_name` param Example:
    library track: "Nights of Pleasure (Mark Broom Remix)" Should be
    extracted to params: name="Nights of Pleasure"
    mix_name="Mark Broom Remix"

Example searching for artist_name "kaspitzky" and track name
"elevate"

``` bash
curl 'https://api.beatport.com/v4/catalog/tracks/?artist_name=kaspitzky&name=elevate' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer $ACCESS_TOKEN' \
  -H 'content-type: application/json' \
```

### Response

``` json
{
  "results": [
    {
      "artists": [
        {
          "id": 665473,
          "image": {
            "id": 24226069,
            "uri": "https://geo-media.beatport.com/image_size/590x404/b7578fc9-7def-4431-aba5-9201a4e7c2d1.jpg",
            "dynamic_uri": "https://geo-media.beatport.com/image_size/{w}x{h}/b7578fc9-7def-4431-aba5-9201a4e7c2d1.jpg"
          },
          "name": "Kashpitzky",
          "slug": "kashpitzky",
          "url": "https://api.beatport.com/v4/catalog/artists/665473/"
        }
      ],
      "publish_status": "published",
      "available_worldwide": true,
      "bpm": 142,
      "catalog_number": "BAO095",
      "current_status": {
        "id": 10,
        "name": "General Content",
        "url": "https://api.beatport.com/v4/auxiliary/current-status/10/"
      },
      "encoded_date": "2025-03-11T19:22:22-06:00",
      "exclusive": false,
      "free_downloads": [],
      "free_download_start_date": null,
      "free_download_end_date": null,
      "genre": {
        "id": 92,
        "name": "Techno (Raw / Deep / Hypnotic)",
        "slug": "techno-raw-deep-hypnotic",
        "url": "https://api.beatport.com/v4/catalog/genres/92/"
      },
      "id": 20225852,
      "image": {
        "id": 42056882,
        "uri": "https://geo-media.beatport.com/image_size/1500x250/3bc8f5a9-f2e0-46e6-9cfc-fb0a0268d5a0.png",
        "dynamic_uri": "https://geo-media.beatport.com/image_size/{w}x{h}/3bc8f5a9-f2e0-46e6-9cfc-fb0a0268d5a0.png"
      },
      "is_available_for_streaming": true,
      "is_explicit": false,
      "isrc": "IL4092509501",
      "key": {
        "camelot_number": 9,
        "camelot_letter": "B",
        "chord_type": {
          "id": 2,
          "name": "Major",
          "url": "https://api.beatport.com/v4/catalog/chord-types/2/"
        },
        "id": 21,
        "is_sharp": false,
        "is_flat": false,
        "letter": "G",
        "name": "G Major",
        "url": "https://api.beatport.com/v4/catalog/keys/21/"
      },
      "label_track_identifier": "1003746043030",
      "length": "5:26",
      "length_ms": 326615,
      "mix_name": "Original Mix",
      "name": "Elevate",
      "new_release_date": "2025-03-20",
      "pre_order": false,
      "pre_order_date": null,
      "price": {
        "code": "USD",
        "symbol": "$",
        "value": 1.49,
        "display": "$1.49"
      },
      "publish_date": "2025-03-20",
      "release": {
        "id": 4977539,
        "name": "Elevate",
        "image": {
          "id": 42224165,
          "uri": "https://geo-media.beatport.com/image_size/1400x1400/257fe0ea-f6f9-4cf0-8ae7-2efe87acfa48.jpg",
          "dynamic_uri": "https://geo-media.beatport.com/image_size/{w}x{h}/257fe0ea-f6f9-4cf0-8ae7-2efe87acfa48.jpg"
        },
        "label": {
          "id": 4146,
          "name": "Be As One",
          "image": {
            "id": 19089653,
            "uri": "https://geo-media.beatport.com/image_size/500x500/f4999304-8faf-4f25-9508-bec30edca19b.jpg",
            "dynamic_uri": "https://geo-media.beatport.com/image_size/{w}x{h}/f4999304-8faf-4f25-9508-bec30edca19b.jpg"
          },
          "slug": "be-as-one"
        },
        "slug": "elevate"
      },
      "remixers": [],
      "sale_type": {
        "id": 1,
        "name": "purchase",
        "url": "https://api.beatport.com/v4/auxiliary/sale-types/1/"
      },
      "sample_url": "https://geo-samples.beatport.com/track/3bc8f5a9-f2e0-46e6-9cfc-fb0a0268d5a0.LOFI.mp3",
      "sample_start_ms": 130646,
      "sample_end_ms": 250646,
      "slug": "elevate",
      "sub_genre": null,
      "url": "https://api.beatport.com/v4/catalog/tracks/20225852/",
      "is_hype": false
    }
  ],
  "next": null,
  "previous": null,
  "count": 1,
  "page": "1/1",
  "per_page": 10
}
```

### Empty response

If no tracks are found for a given artist / track name, the response
will have an empty results array

``` json
{
  "results": [],
  "next": null,
  "previous": null,
  "count": 0,
  "page": "1/1",
  "per_page": 10
}
```

## Update records in SQLite3 database

  - Before attempting to update the database, the database should be
    backed up.

  - Before attempting to update the database, the application must
    validate the library, crates and crate_tracks tables
    exist. No further validation is needed.

  - Create a copy of mixxxdb.sqlite to mixxxdb.sqlite-YYYYMMDD.bak

  - After successfully getting the track data from beatport, prompt the
    user asking to accept the changes. Show the user the current genre
    (if it exists) and the genre from beatport. The user can choose to
    1) accept the change, 2) refuse the change (skip) 3) accept this
    change and all future changes. The existing genre if it exists will
    be overwritten. Genre names do not need to be normalized.

    ``` bash
    # Example interaction:
    Track: "Artist Name - Track Title"
    Current genre: "Electronic"
    Beatport genre: "Techno (Raw / Deep / Hypnotic)"

    Accept this change? [y/n/a/q] (y=yes, n=no, a=accept all, q=quit)
    ```

  - If accepting the change update the genre column for that track in
    the sqlite database.

  - If `auto_accept: true`, skip prompts and just show the results of
    the update.

  - If the database is locked throw error:

    ``` javascript
    // Mixxx might be running - how to handle?
    try {
      const db = new Database(dbPath, { readonly: false });
    } catch (error) {
      if (error.code === 'SQLITE_BUSY') {
        console.error('❌ Database is locked. Please close Mixxx and try again.');
        process.exit(1);
      }
    }
    ```

### Database

The location of the mixxxdb.sqlite database will depend on the OS:

| Platform    | Default Path                                                                                 |
|-------------|----------------------------------------------------------------------------------------------|
| **Windows** | `C:\Users\<Username>\AppData\Local\Mixxx\mixxxdb.sqlite`                                     |
| **macOS**   | `~/Library/Containers/org.mixxx.mixxx/Data/Library/Application Support/Mixxx/mixxxdb.sqlite` |
| **Linux**   | `~/.mixxx/mixxxdb.sqlite`                                                                    |


### Tables

1.  library

    ``` sql
    CREATE TABLE library (
            id INTEGER primary key AUTOINCREMENT,
            artist varchar(64),
            title varchar(64),
            album varchar(64),
            year varchar(16),
            genre varchar(64),
            tracknumber varchar(3),
            location integer REFERENCES track_locations(location),
            comment varchar(256),
            url varchar(256),
            duration float,
            bitrate integer,
            samplerate integer,
            cuepoint integer,
            bpm float,
            wavesummaryhex blob,
            channels integer,
            datetime_added DEFAULT CURRENT_TIMESTAMP,
            mixxx_deleted integer,
            played integer,
            header_parsed integer DEFAULT 0,
            filetype varchar(8) DEFAULT "?",
            replaygain float DEFAULT 0,
            timesplayed integer DEFAULT 0,
            rating integer DEFAULT 0,
            key varchar(8) DEFAULT "",
            beats BLOB,
            beats_version TEXT,
            composer varchar(64) DEFAULT "",
            bpm_lock INTEGER DEFAULT 0,
            beats_sub_version TEXT DEFAULT '',
            keys BLOB,
            keys_version TEXT,
            keys_sub_version TEXT,
            key_id INTEGER DEFAULT 0,
            grouping TEXT DEFAULT "",
            album_artist TEXT DEFAULT "",
            coverart_source INTEGER DEFAULT 0,
            coverart_type INTEGER DEFAULT 0,
            coverart_location TEXT DEFAULT "",
            coverart_hash INTEGER DEFAULT 0,
            replaygain_peak REAL DEFAULT -1.0,
            tracktotal TEXT DEFAULT '//',
            color INTEGER,
            coverart_color INTEGER,
            coverart_digest BLOB,
            last_played_at DATETIME DEFAULT NULL,
            source_synchronized_ms INTEGER DEFAULT NULL);
    ```

2.  crates

    ``` sql
    CREATE TABLE crates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name varchar(48) UNIQUE NOT NULL,
            count INTEGER DEFAULT 0,
            show INTEGER DEFAULT 1, locked INTEGER DEFAULT 0, autodj_source INTEGER DEFAULT 0)
    ```

3.  crate_tracks

    ``` sql
    CREATE TABLE crate_tracks (
            crate_id INTEGER NOT NULL REFERENCES crates(id),
            track_id INTEGER NOT NULL REFERENCES "library_old"(id),
            UNIQUE (crate_id, track_id))
    ```

## Rollbacks

For now the rollback will be manual. Replace mixxxdb.sqlite with one of
the backup files.

# UX

``` bash
# Example output
🔍 Found 150 tracks to process
📦 Creating backup: mixxxdb.sqlite-20250115.bak
🎵 Processing: Artist Name - Track Title (1/150)
✅ Updated: Electronic → Techno (Raw / Deep / Hypnotic)
⚠️  Multiple results for: Other Artist - Other Track (using first match)
❌ No match found for: Unknown Artist - Unknown Track
📊 Progress: 50/150 (33%) - 25 updated, 15 skipped, 10 not found
```

# Error handling

  - If the API is down. Exit with a message.
  - If a request fails, retry once unless the failure was a 429 (rate
    limited) response. If the retry fails, exit with a message.
  - If a track can't be updated for some reason, inform the user and
    move on to the next track or exit if that was the last one.

# Unit testing

TBD

# Project structure

``` bash
beatport-sync/
├── package.json
├── README.md
├── PROJECT.md                # Project plan document
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
└── tests/
    ├── unit/
    └── fixtures/
```

# Implementation phases (TODOs)

## [x] Phase 1: Core Functionality

  - [x] CLI setup with commander.js with init, stats and sync commands
    stubbed
  - [x] Init command: Config file generation and loading
  - [x] Database connection
  - [x] Database validation
  - [x] Basic API client with authentication

## Phase 2: Main Features

  - [x] Stats command (good for testing database queries)
  - [ ] Sync command
      - [x] Beatport API integration with retry logic. Fetch track data.
      - [ ] Implement filtering logic. Filter by crates and existing genres
      - [ ] User prompts and interaction
      - [ ] Write genre details to the database record
      - [ ] Write logs

## Phase 3: Polish

  - [ ] Implement Oauth Flow. This has already been started. See lib/oauth.js.
  - [ ] Progress tracking and better UX
  - [ ] Error handling refinement
  - [ ] Rate limiting optimization
  - [ ] Unit tests

## Potential Edge Cases to Consider

  - Empty crates - what if a specified crate has no tracks?
  - Deleted tracks - should we skip `mixxx_deleted = 1` tracks? Yes.
  - Very long genre names - Beatport genres might exceed varchar(64)
  - Special characters in artist/track names affecting API calls
  - Network timeouts - how long to wait for API responses?
