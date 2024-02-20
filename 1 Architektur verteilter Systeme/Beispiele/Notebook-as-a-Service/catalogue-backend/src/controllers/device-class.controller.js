import {db}            from "../database.js";
import {throwNotFound} from "@dschulmeis/naas-common/src/utils.js";

/**
 * Diese Funktion registriert die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 * 
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    app.get("/device-class", search);
    app.get("/device-class/:id", find);
    app.get("/device-class/:id/devices", getDevices);
};

/**
 * Abruf einer Liste von Geräten.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function search(req, res) {
    let result = db.data.DeviceClass;

    if (req.query.q) {
        let q = req.query.q.toLowerCase();
        result = result.filter(entry => entry.name.toLowerCase().includes(q));
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
    let result = db.data.DeviceClass.find(entry => entry.id === parseInt(req.params.id));
    if (!result) throwNotFound();

    res.send(result);
}

/**
 * Abruf aller Geräte einer Geräteklasse.
 * 
  * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function getDevices(req, res) {
    let result = db.data.Device.filter(entry => entry.deviceClassId === parseInt(req.params.id));
    if (!result) throwNotFound();

    res.send(result);
}