import {db}            from "../database.js";
import {throwNotFound} from "@dschulmeis/naas-common/src/utils.js";

/**
 * Diese Funktion fügt die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 *
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    app.get("/device", search);
    app.get("/device/:id", find);
};

/**
 * Abruf einer Liste von Geräten.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function search(req, res) {
    let result = db.data.Device;

    if (req.query.q) {
        let q = req.query.q.toLowerCase();
        result = result.filter(entry => entry.manufacturer.toLowerCase().includes(q) || entry.model.toLowerCase().includes(q));
    }

    res.send(result);
}

/**
 * Abruf eines einzelnen Geräts.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function find(req, res) {
    let result = db.data.Device.find(entry => entry.id === parseInt(req.params.id));
    if (!result) throwNotFound();

    let deviceClass = db.data.DeviceClass.find(entry => entry.id = result.deviceClassId);
    result.deviceClass = deviceClass.name || "";

    res.send(result);
}
