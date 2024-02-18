import {db}         from "../database.js";
import {throwError} from "@dschulmeis/naas-common/src/utils.js";

/**
 * Prüfen, ob alle mindestens benötigten Felder im Ausleihantrag enthalten sind.
 * Zusätzlich alle Nicht-String-Felder in ihren jeweiligen Datentyp umwandeln.
 * Hiefür wird das übergebene Objekt direkt verändert.
 * 
 * Bei erkannten Fehlern wird eine Ausnahme geworfen.
 * 
 * @param {Object} lendingRequest Ausleihantrag
 */
export function checkAndConvertFields(lendingRequest) {
    // Typkonvertierungen
    if (lendingRequest.id)        lendingRequest.id        = parseInt(lendingRequest.id);
    if (lendingRequest.deviceId)  lendingRequest.deviceId  = parseInt(lendingRequest.deviceId);
    if (lendingRequest.startDate) lendingRequest.startDate = new Date(lendingRequest.startTime);
    if (lendingRequest.endDate)   lendingRequest.endDate   = new Date(lendingRequest.endTime);

    // Pflichtparameter
    if (!lendingRequest.deviceId) {
        throwError("PARAMETER-MISSING", "Geräte ID fehlt!", 400);
    }

    if (!lendingRequest.startTime) {
        throwError("PARAMETER-MISSING", "Ausleihbeginn fehlt!", 400);
    }

    if (!lendingRequest.endTime) {
        throwError("PARAMETER-MISSING", "Ausleihende fehlt!", 400);
    }

    if (!lendingRequest.contactData) {
        throwError("PARAMETER-MISSING", "Kontaktdaten fehlen!", 400);
    }

    if (!lendingRequest.location) {
        throwError("PARAMETER-MISSING", "Bereitstellungsort fehlt!", 400);
    }
}

/**
 * Katalog-Backend anrufen um zu prüfen, ob es das gewünschte Gerät überhaupt gibt.
 * 
 * @param {number} deviceId Geräte ID
 * @returns {Device} Gefundenes Device
 */
export async function findDevice({deviceId} = {}) {
    let url = `${process.env.CATALOGUE_URL}/device/${deviceId}`.replaceAll("//", "/");
    let response = await fetch(url);
    return await response.json();
}

/**
 * Prüfen, ob der übergebene Ausleihzeitraum zulässig ist. Hierfür müssen beide Daten
 * in der Zukunft liegen und das Ausleihende muss größer als der Ausleihbeginn sein.
 * 
 * @param {Date} startTime Ausleihbeginn
 * @param {Date} endTime Ausleihende
 * @returns {boolean} Zeitraum ist zulässig
 */
export function checkTimeIsValid({startTime, endTime} = {}) {
    let today = new Date();
    return (startTime >= today) && (endTime >= today) && (endTime >= startTime);
}

/**
 * In der Datenbank prüfen, ob ein Gerät im gegebenen Zeitraum ausleihbar ist.
 * 
 * @param {number} deviceId Geräte ID
 * @param {Date} startTime Ausleihbeginn
 * @param {Date} endTime Ausleihende
 * @returns {boolean} Gerät ist verfügbar
 */
export function checkDeviceIsAvailable({deviceId, startTime, endTime} = {}) {
    let overlaps = db.data.LendingRequest.filter(entry => {
        if (entry.deviceId !== deviceId) return false;
        if (entry.status !== "LENDED")   return false;
        if (entry.startTime > endTime)   return false;
        if (entry.endTime < startTime)   return false; 
        return true;
    });

    return overlaps.length === 0;
}

/**
 * All-in-One Validierung eines Ausleihantrags optional mit Speichern, falls der
 * Antrag fehlerfrei ist. Im Fehlerfall wird eine Ausnahme geworfen. Das übergebene
 * Objekt wird verändert, um die Nicht-String-Felder in ihren korrekten Typ umzuwandeln.
 * 
 * @param {Object} lendingRequest Ausleihantrag
 * @param {boolean} save Antrag speichern, wenn fehlerfrei
 */
export async function validateAndSaveLendingRequest(lendingRequest, save) {
    checkAndConvertFields(lendingRequest);

    let foundDevice = await findDevice(lendingRequest);

    if (!foundDevice) {
        throwError("INVALID-DATA", "Das Gerät wurde nicht gefunden.", 400);
    } else {
        lendingRequest.manufacturer = foundDevice.manufacturer;
        lendingRequest.model        = foundDevice.model;
    }

    if (!checkTimeIsValid(lendingRequest)) {
        throwError("INVALID-DATA", "Der Ausleihzeitraum ist nicht zulässig.", 400);
    }

    if (!checkDeviceIsAvailable(lendingRequest)) {
        throwError("UNAVAILABLE", "Das Gerät ist im gewünschten Zeitraum nicht verfügbar.", 400);
    }

    if (save) {
        let id = db.data.LendingRequest.reduce((maxId, entry) => Math.max(maxId, entry.id)) || 0;

        lendingRequest.id     = id + 1;
        lendingRequest.status = "LENDED";

        db.data.LendingRequest.push(lendingRequest);
        await db.write();
    }
}