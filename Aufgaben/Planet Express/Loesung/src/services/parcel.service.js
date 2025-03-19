import database from "../database.js";

/**
 * Lieferungen suchen anhand beliebiger Suchbegriffe. Es werden alle Lieferungen
 * ermittelt, die den gesuchten Suchbegriff in einem ihrer Textfelder enthalten.
 *
 * @param {string} query Suchbegriff
 * @returns {Promise<Object[]>} Gefundene Lieferungen
 */
export async function search(query) {
    let result = database.db.data.Parcels;

    if (query) {
        query = `${query}`.toLowerCase();
        result = result.filter(entry => entry.sender.toLowerCase().includes(query)
                                     || entry.receiver.toLowerCase().includes(query)
                                     || entry.content.toLowerCase().includes(query));
    }

    return result;
}

/**
 * Anlegen einer neuen Lieferung.
 *
 * @param {Object} parcel Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten
 */
export async function create(parcel) {
    if (!parcel) return;

    let entry = {
        id:       database.getNextId(database.db.data.Parcels),
        sender:   `${parcel.sender || ""}`.trim(),
        receiver: `${parcel.receiver || ""}`.trim(),
        content:  `${parcel.content || ""}`.trim(),
    };

    database.db.data.Parcels.push(entry);
    await database.db.write();

    return entry;
}

/**
 * Auslesen einer Lieferung anhand ihrer ID.
 *
 * @param {number} id ID der Lieferung
 * @returns {Promise<Object>} Lieferung oder undefined
 */
export async function read(id) {
    let index = database.findIndex(database.db.data.Parcels, parseInt(id));
    if (index >= 0) return database.db.data.Parcels[index];
}

export default {search, create, read};
