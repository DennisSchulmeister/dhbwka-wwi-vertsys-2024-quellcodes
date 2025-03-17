/*
 * Service-Implementierung des Logbuchs. Hier befindet sich die fachliche Logik,
 * die so programmiert wurde, dass hier keinerlei Bezug zu HTTP oder dem
 * Express-Framework vorhanden ist. Auf diese Weise lässt sich die Logik an
 * beliebigen Stellen wiederverwenden oder der REST-Webservice kann durch ein
 * anderes Protokoll ausgetauscht werden.
 */

import {db}           from "../database.js";
import {calcStarDate} from "../utils.js";

/**
 * Business Logik zum Suchen von Logbuch-Einträgen.
 * @param {String} query Suchbegriff
 * @returns {Array} Gefundene Eintröge
 */
export async function searchLogEntries(query) {
    let result = [];

    for (let logEntry of db.data.LogEntries) {
        if (!query || logEntry.text?.includes(query)) {
            result.push(logEntry);
        }
    }

    return result;
}

/**
 * Neuen Eintrag im Logbuch speichern.
 * @param {Object} entry Zu speicherender Eintrag
 * @returns {Object} Gespeicherter Eintrag
 * @throws {Error} Fehlende oder ungültige Daten
 */
export async function saveNewLogEntry(entry) {
    // Übergebenen Datensatz auf Plausibilität prüfen
    if (!entry?.text) {
        throw new Error("Bitte einen gültigen Text eingeben!");
    }

    // Neuen Eintrag im Logbuch speichern
    const newEntry = {
        starDate: calcStarDate(new Date()),
        text:     entry.text,
    };

    db.data.LogEntries.push(newEntry);
    await db.write();

    // Gespeicherten Eintrag zurückgeben
    return newEntry;
}
