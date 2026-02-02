import {db} from "../database.js";

/**
 * Vorbereitete SQL-Statements hier an einer Stelle gesammelt. Dadurch können die Statements
 * schneller angepasst werden, wenn sich die zugrunde liegende Tabelle ändert. Es spart aber
 * auch ein wenig Zeit, weil die Funktion zum Vorbereiten eines SQL-Statements nicht bei jeder
 * Datenbankanfrage erneut aufgerufen wird.
 */
const sql = {
    selectAll: db.prepare(`
        SELECT * FROM Song ORDER BY artist, name
    `),

    selectAny: db.prepare(`
        SELECT * FROM Song
            WHERE artist      LIKE '%' || @query || '%'
               OR name        LIKE '%' || @query || '%'
               OR releaseYear =    @query
               OR songwriters LIKE '%' || @query || '%'
            ORDER BY artist, name
    `),

    selectSingle: db.prepare(`
        SELECT * FROM Song WHERE id = @id
    `),

    selectCount: db.prepare(`
        SELECT COUNT(*) as count FROM Song
    `),

    insert: db.prepare(`
        INSERT INTO Song(artist, name, releaseYear, songwriters)
            VALUES (@artist, @name, @releaseYear, @songwriters)
    `),

    update: db.prepare(`
        UPDATE Song
            SET artist      = @artist,
                name        = @name,
                releaseYear = @releaseYear,
                songwriters = @songwriters
            WHERE id = @id
    `),

    delete: db.prepare(`
        DELETE FROM Song WHERE id = @id
    `),
};

/**
 * Songs suchen anhand beliebiger Suchbegriffe. Es werden alle Songs ermittelt,
 * die den gesuchten Suchbegriff in einem ihrer Textfelder enthalten.
 * 
 * @param {string} query Suchbegriff
 * @returns {Promise<Object[]>} Gefundene Songs
 */
export function search(query) {
    if (query) {
        return sql.selectAny.all({query});
    } else {
        return sql.selectAll.all();
    }
}

/**
 * Anlegen eines neuen Songs.
 * 
 * @param {Object} song Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten
 */
export function create(song) {
    if (!song) return;

    let result = sql.insert.run({
        artist:      `${song.artist            || ""}`.trim(),
        name:        `${song.name              || ""}`.trim(),
        releaseYear: parseInt(song.releaseYear || 0),
        songwriters: `${song.songwriters       || ""}`.trim(),
    });
;
    return read(result.lastInsertRowid);
}

/**
 * Auslesen eines Songs anhand seiner ID.
 * 
 * @param {integer} id Song ID
 * @returns {Promise<Object>} Song oder undefined
 */
export function read(id) {
    return sql.selectSingle.get({id});
}

/**
 * Aktualisieren eines Songs durch Überschreiben einzelner Felder oder des
 * gesamten Song-Objekts.
 * 
 * @param {integer} id Song ID
 * @param {Object} song Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten oder undefined
 */
export function update(id, song) {
    let existing = read(id);
    if (!existing) return;

    if (song.artist)      existing.artist      = `${song.artist}`.trim();
    if (song.name)        existing.name        = `${song.name}`.trim();
    if (song.releaseYear) existing.releaseYear = parseInt(song.releaseYear);
    if (song.songwriters) existing.songwriters = `${song.songwriters}`.trim();

    sql.update.run(existing);
    return existing;
}

/**
 * Löschen eines Songs anhand seiner ID.
 * 
 * @param {integer} id Song ID
 * @returns {Promise<integer>} Anzahl der gelöschten Datensätze
 */
export function remove(id) {
    let countBefore = sql.selectCount.get().count;
    sql.delete.run({id});
    let countAfter = sql.selectCount.get().count;

    return countBefore - countAfter;
}

export default {search, create, read, update, remove};