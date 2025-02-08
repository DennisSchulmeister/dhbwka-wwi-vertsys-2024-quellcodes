import database from "../database.js";

/**
 * Codeschnipsel suchen anhand beliebiger Suchbegriffe. Es werden alle Codeschnipsel
 * ermittelt, die den gesuchten Suchbegriff in einem ihrer Textfelder enthalten.
 * 
 * @param {string} query Suchbegriff
 * @returns {Promise<Object[]>} Gefundene Codeschnipsel
 */
export async function search(query) {
    let result = database.db.data.Snippet;

    if (query) {
        query = `${query}`.toLowerCase();
        result = result.filter(entry => {
            return entry.language.toLowerCase().includes(query)
                || entry.name.toLowerCase().includes(query)
                || entry.content.toLowerCase().includes(query);
        });
    }

    return result;
}

/**
 * Anlegen eines neuen Codeschnipsels.
 * 
 * @param {Object} snippet Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten
 */
export async function create(snippet) {
    if (!snippet) return;

    let entry = {
        id:       database.getNextId(database.db.data.Snippet),
        language: `${snippet.language || ""}`.trim(),
        name:     `${snippet.name     || ""}`.trim(),
        content:  `${snippet.content  || ""}`.trim(),
    };

    validateSnippet(entry);
    database.db.data.Snippet.push(entry);
    await database.db.write();

    return entry;
}

/**
 * Auslesen eines Codeschnipsels anhand seiner ID.
 * 
 * @param {integer} id Song ID
 * @returns {Promise<Object>} Song oder undefined
 */
export async function read(id) {
    let index = database.findIndex(database.db.data.Snippet, parseInt(id));
    if (index >= 0) return database.db.data.Snippet[index];
}

/**
 * Aktualisieren eines Codeschnipsels durch Überschreiben einzelner Felder
 * oder des gesamten Codeschnipsel-Objekts.
 * 
 * @param {integer} id Codeschnipsel ID
 * @param {Object} snippet Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten oder undefined
 */
export async function update(id, snippet) {
    let existing = await read(parseInt(id));
    if (!existing) return;

    if (snippet.name)     existing.name     = `${snippet.name}`.trim();
    if (snippet.language) existing.language = `${snippet.language}`.trim();
    if (snippet.content)  existing.content  = `${snippet.content}`.trim();

    validateSnippet(existing);
    await database.db.write();

    return existing;
}

/**
 * Löschen eines Codeschnipsels anhand seiner ID.
 * 
 * @param {integer} id Codeschnipsel ID
 * @returns {Promise<integer>} Anzahl der gelöschten Datensätze
 */
export async function remove(id) {
    let countBefore = database.db.data.Snippet.length;
    database.db.data.Snippet = database.db.data.Snippet.filter(entry => entry.id !== parseInt(id));
    let countAfter = database.db.data.Snippet.length;

    await database.db.write();
    return countBefore - countAfter;
}

/**
 * Diese Funktion prüft die Inhalte eines Codeschnipsels. Wenn alles in Ordnung ist,
 * passiert nichts. Wenn ein Fehler gefunden wird, wirft sie eine Exception mit einer
 * entsprechenden Fehlermeldung (z.B. "Name fehlt").
 * 
 * @param {Object} snippet Zu prüfender Codeschnipsel
 */
function validateSnippet(snippet) {
    if (!snippet.name) throw new Error("Name fehlt");
    if (!snippet.content) throw new Error("Inhalt fehlt");

    if (!snippet.language) snippet.language = "";
    snippet.language = snippet.language.toLowerCase();
    
    let language = database.db.data.Language.find(entry => entry.language === snippet.language);
    if (!language) throw new Error(`Unbekannte Programmiersprache: ${snippet.language}`);
}

export default {search, create, read, update, remove};