import database from "../database.js";

/**
 * Songs suchen anhand beliebiger Suchbegriffe. Es werden alle Songs ermittelt,
 * die den gesuchten Suchbegriff in einem ihrer Textfelder enthalten.
 * 
 * @param {string} query Suchbegriff
 * @returns {Promise<Object[]>} Gefundene Songs
 */
export async function search(query) {
    let result = database.db.data.Song;

    if (query) {
        query = `${query}`.toLowerCase();
        result = result.filter(entry => {
            return entry.artist.toLowerCase().includes(query)
                || entry.name.toLowerCase().includes(query)
                || entry.releaseYear === parseInt(query)
                || entry.songwriters.toLowerCase().includes(query);
        });
    }

    return result;
}

/**
 * Anlegen eines neuen Songs.
 * 
 * @param {Object} song Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten
 */
export async function create(song) {
    if (!song) return;

    let entry = {
        id:          database.getNextId(database.db.data.Song),
        artist:      `${song.artist            || ""}`.trim(),
        name:        `${song.name              || ""}`.trim(),
        releaseYear: parseInt(song.releaseYear || 0),
        songwriters: `${song.songwriters       || ""}`.trim(),
    };

    database.db.data.Song.push(entry);
    await database.db.write();

    return entry;
}

/**
 * Auslesen eines Songs anhand seiner ID.
 * 
 * @param {integer} id Song ID
 * @returns {Promise<Object>} Song oder undefined
 */
export async function read(id) {
    let index = database.findIndex(database.db.data.Song, parseInt(id));
    if (index >= 0) return database.db.data.Song[index];
}

/**
 * Aktualisieren eines Songs durch Überschreiben einzelner Felder oder des
 * gesamten Song-Objekts.
 * 
 * @param {integer} id Song ID
 * @param {Object} song Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten oder undefined
 */
export async function update(id, song) {
    let existing = await read(parseInt(id));
    if (!existing) return;

    if (song.artist)      existing.artist      = `${song.artist}`.trim();
    if (song.name)        existing.name        = `${song.name}`.trim();
    if (song.releaseYear) existing.releaseYear = parseInt(song.releaseYear);
    if (song.songwriters) existing.songwriters = `${song.songwriters}`.trim();

    await database.db.write();
    return existing;
}

/**
 * Löschen eines Songs anhand seiner ID.
 * 
 * @param {integer} id Song ID
 * @returns {Promise<integer>} Anzahl der gelöschten Datensätze
 */
export async function remove(id) {
    let countBefore = database.db.data.Song.length;
    database.db.data.Song = database.db.data.Song.filter(entry => entry.id !== parseInt(id));
    let countAfter = database.db.data.Song.length;

    await database.db.write();
    return countBefore - countAfter;
}

export default {search, create, read, update, remove};