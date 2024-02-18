import {db}              from "../database.js";
import {findDevice}      from "./device.service.js";
import {deviceAvailable} from "./device.service.js";
import {throwError}      from "@dschulmeis/naas-common/src/utils.js";

/**
 * Prüfen, ob alle mindestens benötigten Felder im Auftrag enthalten sind.
 * Zusätzlich alle Nicht-String-Felder in ihren jeweiligen Datentyp umwandeln.
 * Hiefür wird das übergebene Objekt direkt verändert.
 * 
 * Bei erkannten Fehlern wird eine Ausnahme geworfen.
 * 
 * @param {Object} order Auftrag
 */
export function checkAndConvertFields(order) {
    // Typkonvertierungen
    if (order.id)        order.id        = parseInt(order.id);
    if (order.deviceId)  order.deviceId  = parseInt(order.deviceId);
    if (order.startDate) order.startDate = new Date(order.startTime);
    if (order.endDate)   order.endDate   = new Date(order.endTime);

    // Pflichtparameter
    if (!order.deviceId) {
        throwError("PARAMETER-MISSING", "Geräte ID fehlt!", 400);
    }

    if (!order.startTime) {
        throwError("PARAMETER-MISSING", "Ausleihbeginn fehlt!", 400);
    }

    if (!order.endTime) {
        throwError("PARAMETER-MISSING", "Ausleihende fehlt!", 400);
    }

    if (!order.contactData) {
        throwError("PARAMETER-MISSING", "Kontaktdaten fehlen!", 400);
    }

    if (!order.location) {
        throwError("PARAMETER-MISSING", "Bereitstellungsort fehlt!", 400);
    }
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
 * All-in-One Validierung eines Auftrags optional mit Speichern, falls er fehlerfrei ist.
 * Im Fehlerfall wird eine Ausnahme geworfen. Das übergebene Objekt wird verändert, um die
 * Nicht-String-Felder in ihren korrekten Typ umzuwandeln.
 * 
 * @param {Object} order Auftrag
 * @param {boolean} save Auftrag speichern, wenn fehlerfrei
 */
export async function validateAndSaveOrder(order, save) {
    checkAndConvertFields(order);

    let foundDevice = await findDevice(order);

    if (!foundDevice) {
        throwError("INVALID-DATA", "Das Gerät wurde nicht gefunden.", 400);
    } else {
        order.manufacturer  = foundDevice.manufacturer;
        order.model         = foundDevice.model;
        order.deviceClassId = foundDevice.deviceClassId;
        order.deviceClass   = foundDevice.deviceClass;
    }

    if (!checkTimeIsValid(order)) {
        throwError("INVALID-DATA", "Der Ausleihzeitraum ist nicht zulässig.", 400);
    }

    if (!deviceAvailable(order)) {
        throwError("UNAVAILABLE", "Das Gerät ist im gewünschten Zeitraum nicht verfügbar.", 400);
    }

    if (save) {
        let id = db.data.Order.reduce((maxId, entry) => Math.max(maxId, entry.id)) || 0;

        order.id     = id + 1;
        order.status = "LENDED";

        db.data.Order.push(order);
        await db.write();
    }
}