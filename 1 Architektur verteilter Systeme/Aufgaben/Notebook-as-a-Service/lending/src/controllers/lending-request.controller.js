import {db}            from "../database.js";
import {throwNotFound} from "@dschulmeis/naas-common/src/utils.js";

/**
 * Diese Funktion registriert die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 * 
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    app.get("/lending-request", search);
    app.get("/lending-request/:id", find);
};

/**
 * Abruf einer Liste von Ausleihanträgen.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function search(req, res) {
    let result = db.data.LendingRequest;

    if (req.query.q) {
        let q = req.query.q.toLowerCase();

        result = result.filter(entry => {
            return entry.manufacturer.toLowerCase().includes(q)
                || entry.model.toLowerCase().includes(q)
                || entry.contactData.toLowerCase().includes(q)
                || entry.location.toLowerCase().includes(q);
        });
    }

    res.send(result);
}

/**
 * Abruf eines einzelnen Ausleihantrags.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function find(req, res) {
    let result = db.data.LendingRequest.find(entry => entry.id === parseInt(req.params.id));
    if (!result) throwNotFound();

    res.send(result);
}