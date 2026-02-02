import {db} from "../database.js";

/**
 * Vorbereitete SQL-Statements hier an einer Stelle gesammelt. Dadurch können die Statements
 * schneller angepasst werden, wenn sich die zugrunde liegende Tabelle ändert. Es spart aber
 * auch ein wenig Zeit, weil die Funktion zum Vorbereiten eines SQL-Statements nicht bei jeder
 * Datenbankanfrage erneut aufgerufen wird.
 */
const sql = {
    selectAll: db.prepare(`
        SELECT id,
               name,
               ( SELECT json_group_array(songId) FROM PlaylistEntry WHERE playlistId = Playlist.id ) songs
            FROM Playlist
            ORDER BY name
    `),

    selectAny: db.prepare(`
        SELECT id,
               name,
               ( SELECT json_group_array(songId) FROM PlaylistEntry WHERE playlistId = Playlist.id ) songs
            FROM Playlist
            WHERE name LIKE '%' || @query || '%'
            ORDER BY name
    `),

    selectSingle: db.prepare(`
        SELECT id,
               name,
               ( SELECT json_group_array(songId) FROM PlaylistEntry WHERE playlistId = Playlist.id ) songs
            FROM Playlist
            WHERE id = @id
    `),

    selectCount: db.prepare(`
        SELECT COUNT(*) as count FROM Playlist
    `),

    insert: db.prepare(`
        INSERT INTO Playlist(name)
            VALUES (@name)
    `),

    insertEntry: db.prepare(`
        INSERT INTO PlaylistEntry(playlistId, songId)
            VALUES (@playlistId, @songId)
    `),

    update: db.prepare(`
        UPDATE Playlist
            SET name = @name
            WHERE id = @id
    `),

    delete: db.prepare(`
        DELETE FROM Playlist WHERE id = @id
    `),

    deleteEntries: db.prepare(`
        DELETE FROM PlaylistEntry WHERE playlistId = @id
    `),
};

/**
 * Vorbereitete Datenbanktransaktionen. Jeder Eintrag ist eine aufrufbare Funktion, die
 * innerhalb einer abgeschlossenen Transaktion abläuft.
 */
const tx = {
    createPlaylist: db.transaction((name, songs) => {
        let result = sql.insert.run({name});
        
        for (let songId of songs || []) {
            sql.insertEntry.run({playlistId: result.lastInsertRowid, songId: songId});
        }

        return result;
    }),

    updatePlaylist: db.transaction((id, name, songs) => {
        let playlist = sql.update.get({id, name});
        sql.deleteEntries.run({id});

        for (let songId of songs || []) {
            sql.insertEntry.run({playlistId: id, songId: songId});
        }

        return playlist;
    }),
};

/**
 * Playlists suchen anhand beliebiger Suchbegriffe. Es werden alle Playlists
 * ermittelt, die den gesuchten Suchbegriff in einem ihrer Textfelder enthalten.
 * 
 * @param {string} query Suchbegriff
 * @returns {Promise<Object[]>} Gefundene Playlists
 */
export function search(query) {
    if (query) {
        return sql.selectAny.all({query});
    } else {
        return sql.selectAll.all();
    }
}

/**
 * Anlegen einer neuen Playlist.
 * 
 * @param {Object} playlist Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten
 */
export function create(playlist) {
    if (!playlist) return;
    playlist.name  = `${playlist.name || ""}`.trim();
    playlist.songs = playlist.songs || [];

    let result = tx.createPlaylist(playlist.name, playlist.songs);
    return read(result.lastInsertRowid);
}

/**
 * Auslesen einer Playlist anhand ihrer ID.
 * 
 * @param {integer} id Playlist ID
 * @returns {Promise<Object>} Playlist oder undefined
 */
export function read(id) {
    return sql.selectSingle.get({id});
}

/**
 * Aktualisieren einer Playlist durch Überschreiben einzelner Felder
 * oder des gesamten Playlist-Objekts.
 * 
 * @param {integer} id Playlist ID
 * @param {Object} playlist Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten oder undefined
 */
export function update(id, playlist) {
    let existing = read(id)
    if (!existing) return;

    if (playlist.name)  existing.name = `${playlist.name}`.trim();
    if (playlist.songs) existing.songs = playlist.songs;

    sql.update.run(existing);
    return existing;
}

/**
 * Löschen einer Playlist anhand ihrer ID.
 * 
 * @param {integer} id Playlist ID
 * @returns {Promise<integer>} Anzahl der gelöschten Datensätze
 */
export function remove(id) {
    let countBefore = sql.selectCount.get().count;
    sql.delete.run({id});
    let countAfter = sql.selectCount.get().count;

    return countBefore - countAfter;
}

export default {search, create, read, update, remove};