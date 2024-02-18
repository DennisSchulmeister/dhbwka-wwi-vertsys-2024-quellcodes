import * as deviceService from "../services/device.service.js";
import {wrapAsync}        from "@dschulmeis/naas-common/src/utils.js";
import {throwError}       from "@dschulmeis/naas-common/src/utils.js";

/**
 * Diese Funktion registriert die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 * 
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    app.get("/device/exists/:id",    wrapAsync(checkExists));
    app.get("/device/available/:id", deviceAvailable);
};

/**
 * Prüfen, ob das gewünschte Gerät überhaupt existiert.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function checkExists(req, res) {
    let foundDevice = await deviceService.findDevice({deviceId: req.params.id});

    res.send({
        exists: foundDevice.id ? true : false,
    });
}

/**
 * Prüfen, ob das gewünschte Gerät im gegebenen Zeitraum verfügbar ist.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function deviceAvailable(req, res) {
    if (!req.query.startTime) {
        throwError("PARAMETER-MISSING", "Ausleihbeginn fehlt!", 400);
    } else if (!req.query.endTime) {
        throwError("PARAMETER-MISSING", "Ausleihende fehlt!", 400);
    }

    res.send({
        available: deviceService.deviceAvailable({
            deviceId:  req.params.id,
            startTime: new Date(req.query.startTime),
            endTime:   new Date(req.query.endTime),
        }),
    });
}