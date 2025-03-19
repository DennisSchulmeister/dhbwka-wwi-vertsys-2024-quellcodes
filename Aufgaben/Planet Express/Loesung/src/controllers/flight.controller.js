import service         from "../services/flight.service.js";
import {throwNotFound} from "../utils.js";

const prefix = "/flight";

/**
 * Diese Funktion fügt die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 *
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    // Ganze Collection
    app.get(prefix, search);
    app.post(prefix, create);

    // Einzelne Ressource
    app.get(`${prefix}/:id`, read);
};

/**
 * Abruf einer Liste, optional mit Stichwortsuche.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function search(req, res) {
    let result = await service.search(req.query.q);

    res.status(200);
    res.send(result);
}

/**
 * Anlegen einen neuen Eintrags.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function create(req, res) {
    let result = await service.create(req.body);

    res.status(201);
    res.header("location", `${prefix}/${result.id}`);
    res.send(result);
}

/**
 * Abruf eines einzelnen Eintrags anhand seiner ID.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function read(req, res) {
    let result = await service.read(req.params.id);

    if (result) {
        res.status(200);
        res.send(result);
    } else {
        throwNotFound();
    }
}
