import database from "../database.js";

/**
 * Playlists suchen anhand beliebiger Suchbegriffe. Es werden alle Playlists
 * ermittelt, die den gesuchten Suchbegriff in einem ihrer Textfelder enthalten.
 * 
 * @param {string} query Suchbegriff
 * @returns {Promise<Object[]>} Gefundene Playlists
 */
export async function search(query) {
    let result = database.db.data.Playlist;

    if (query) {
        query = `${query}`.toLowerCase();
        result = result.filter(entry => entry.name.toLowerCase().includes(query));
    }

    return result;
}

/**
 * Anlegen einer neuen Playlist.
 * 
 * @param {Object} playlist Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten
 */
export async function create(playlist) {
    if (!playlist) return;

    let entry = {
        id:   database.getNextId(database.db.data.Playlist),
        name: `${playlist.name || ""}`.trim(),
    };

    database.db.data.Playlist.push(entry);
    await database.db.write();

    return entry;
}

/**
 * Auslesen einer Playlist anhand ihrer ID.
 * 
 * @param {integer} id Playlist ID
 * @returns {Promise<Object>} Playlist oder undefined
 */
export async function read(id) {
    let index = database.findIndex(database.db.data.Playlist, parseInt(id));
    if (index >= 0) return database.db.data.Playlist[index];
}

/**
 * Aktualisieren einer Playlist durch Überschreiben einzelner Felder
 * oder des gesamten Playlist-Objekts.
 * 
 * @param {integer} id Playlist ID
 * @param {Object} playlist Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten oder undefined
 */
export async function update(id, playlist) {
    let existing = await read(parseInt(id));
    if (!existing) return;

    if (playlist.name)  existing.name  = `${playlist.name}`.trim();
    if (playlist.songs) existing.songs = [...playlist.songs];

    await database.db.write();
    return existing;
}

/**
 * Löschen einer Playlist anhand ihrer ID.
 * 
 * @param {integer} id Playlist ID
 * @returns {Promise<integer>} Anzahl der gelöschten Datensätze
 */
export async function remove(id) {
    let countBefore = database.db.data.Playlist.length;
    database.db.data.Playlist = database.db.data.Playlist.filter(entry => entry.id !== parseInt(id));
    let countAfter = database.db.data.Playlist.length;

    await database.db.write();
    return countBefore - countAfter;
}

export default {search, create, read, update, remove};