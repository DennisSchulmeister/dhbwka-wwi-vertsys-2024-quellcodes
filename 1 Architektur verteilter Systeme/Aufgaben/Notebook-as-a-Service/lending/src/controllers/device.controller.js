import * as deviceService from "../services/device.service.js";
import {wrapAsync}        from "@dschulmeis/naas-common/src/utils.js";

/**
 * Diese Funktion registriert die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 * 
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    app.get("/device/exists/:id",    wrapAsync(checkExisting));
    app.get("/device/available/:id", checkAvailability);
    app.post("/device/lend",         wrapAsync(lendDevice));
};

/**
 * Prüfen, ob das gewünschte Gerät überhaupt existiert.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function checkExisting(req, res) {
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
function checkAvailability(req, res) {
    res.send({
        available: deviceService.checkDeviceIsAvailable({
            deviceId:  req.params.id,
            startTime: new Date(req.query.startTime),
            endTime:   new Date(req.query.EndTime),
        }),
    });
}

/**
 * Gerät ausleihen, sofern es existiert und im gewünschten Zeitraum verfügbar ist.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function lendDevice(req, res) {
    let lendingRequest = JSON.parse(JSON.stringify(req.data));
    let savedRequest   = await deviceService.validateAndSaveLendingRequest(lendingRequest, true);

    res.send(savedRequest);
}