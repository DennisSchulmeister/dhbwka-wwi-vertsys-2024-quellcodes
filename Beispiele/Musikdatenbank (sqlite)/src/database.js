import sqlite from "better-sqlite3";

export const db = sqlite("db.sqlite");
db.pragma("journal_mode = WAL");        // Bessere Performance
db.pragma("foreign_keys = ON");         // Fremdschlüsselprüfungen aktivieren

// Tabellen anlegen
db.prepare(`
    CREATE TABLE IF NOT EXISTS Song(
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        artist      TEXT NOT NULL,
        name        TEXT NOT NULL,
        releaseYear INTEGER,
        songwriters TEXT NOT NULL,

        UNIQUE(artist, name)
    )    
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS Playlist(
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT UNIQUE NOT NULL
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS PlaylistEntry(
        playlistId  INTEGER REFERENCES Playlist(id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

        songId      INTEGER REFERENCES Song(id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,

        PRIMARY KEY(playlistId, songId)
    )
`).run();

// Demodaten anlegen
db.prepare(`
    INSERT INTO Song(id, artist, name, releaseYear, songwriters)
        VALUES (1,  'Elton John',   'Goodbye Yellow Brick Road', 1973, 'Bernie Taupin, Elton John'),
               (2,  'Elton John',   'Candle In The Wind',        1973, 'Bernie Taupin, Elton John'),
               (3,  'Elton John',   'Blue Wonderful',            2016, 'Bernie Taupin, Elton John'),
               (4,  'Dire Straits', 'Brothers In Arms',          1985, 'Mark Knopfler'),
               (5,  'Dire Straits', 'Sultans of Swing',          1978, 'Mark Knopfler'),
               (6,  'Dire Straits', 'Calling Elvis',             1991, 'Mark Knopfler'),
               (7,  'The Eagles',   'Tequila Sunrise',           1973, 'Don Henley, Glenn Frey'),
               (8,  'The Eagles',   'Busy Being Fabulous',       2007, 'Don Henley, Glenn Frey'),
               (9,  'O.M.D.',       'Walking On The Milky Way',  1996, 'McCluskey, Nigel Ipinson, Keith Small'),
               (10, 'Queen',        'I Want To Break Free',      1984, 'John Deacon'),
               (11, 'Queen',        'Radio Ga-Ga',               1984, 'Roger Taylor')

        -- Schon vorhandene Datensätze aktualisieren
        ON CONFLICT(id) DO UPDATE SET artist      = excluded.artist,
                                      name        = excluded.name,
                                      releaseYear = excluded.releaseYear,
                                      songwriters = excluded.songwriters
`).run();

db.prepare(`
    INSERT INTO Playlist(id, name)
        VALUES (1, 'The Golden 70s'),
               (2, 'The very best of Dire Straits')
        ON CONFLICT(id) DO UPDATE SET name = excluded.name 
`).run();

db.prepare(`
    INSERT INTO PlaylistEntry(playlistId, songId)
        VALUES (1, 1), (1, 2), (1, 5), (1, 7),
               (2, 4), (2, 5), (2, 6)
        ON CONFLICT(playlistId, songId) DO NOTHING
`).run();