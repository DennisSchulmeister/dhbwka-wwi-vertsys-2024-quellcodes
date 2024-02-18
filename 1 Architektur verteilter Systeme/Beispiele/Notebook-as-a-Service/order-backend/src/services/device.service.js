import {db} from "../database.js";

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
 * In der Datenbank prüfen, ob ein Gerät im gegebenen Zeitraum ausleihbar ist.
 * 
 * @param {number} deviceId Geräte ID
 * @param {Date} startTime Ausleihbeginn
 * @param {Date} endTime Ausleihende
 * @returns {boolean} Gerät ist verfügbar
 */
export function deviceAvailable({deviceId, startTime, endTime} = {}) {
    deviceId  = parseInt(deviceId);
    startTime = new Date(startTime);
    endTime   = new Date(endTime);

    let overlaps = db.data.Order.filter(entry => {
        if (entry.status !== "LENDED")           return false;
        if (entry.deviceId !== deviceId)         return false;
        if (new Date(entry.startTime) > endTime) return false;
        if (new Date(entry.endTime) < startTime) return false; 
        return true;
    });

    return overlaps.length === 0;
}