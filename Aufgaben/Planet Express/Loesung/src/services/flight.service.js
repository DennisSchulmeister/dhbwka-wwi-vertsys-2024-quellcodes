import database from "../database.js";

/**
 * Flüge suchen anhand mitgeführter Lieferung. Es werden alle Flüge ermittelt,
 * welche die gesuchten Lieferung enthalten.
 *
 * @param {number} parcelId ID der Lieferung
 * @returns {Promise<Object[]>} Gefundene Lieferungen
 */
export async function search(deliveryId) {
    let result = database.db.data.Flights;

    if (deliveryId) {
        result = result.filter(entry => entry.parcels.includes(deliveryId));
    }

    return result;
}

/**
 * Anlegen eines neuen Transportflugs.
 *
 * @param {Object} flight Zu speichernde Daten
 * @returns {Promise<Object>} Gespeicherte Daten
 */
export async function create(flight) {
    if (!flight) return;

    let entry = {
        id:        database.getNextId(database.db.data.Flights),
        startDate: new Date(flight.startDate || ""),
        endDate:   new Date(flight.endDate || ""),
        parcels:   Array.isArray(flight.parcels) ? flight.parcels : [],
    };

    database.db.data.Flights.push(entry);
    await database.db.write();

    return entry;
}

/**
 * Auslesen eines Transportflugs anhand seiner ID.
 *
 * @param {number} id ID des Flugs
 * @returns {Promise<Object>} Transportflug oder undefined
 */
export async function read(id) {
    let index = database.findIndex(database.db.data.Flights, parseInt(id));
    if (index >= 0) return database.db.data.Flights[index];
}

export default {search, create, read};
