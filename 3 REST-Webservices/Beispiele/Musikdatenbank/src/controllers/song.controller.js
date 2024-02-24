import service         from "../services/song.service.js";
import {throwNotFound} from "../utils.js";
import {wrapAsync}     from "../utils.js";

const prefix = "/song";

/**
 * Diese Funktion registriert die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 * 
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    // Ganze Collection
    app.get(prefix, wrapAsync(search));
    app.post(prefix, wrapAsync(create));

    // Einzelne Ressource
    app.get(`${prefix}/:id`, wrapAsync(read));
    app.put(`${prefix}/:id`, wrapAsync(update));
    app.patch(`${prefix}/:id`, wrapAsync(update));
    app.delete(`${prefix}/:id`, wrapAsync(remove));
};

/**
 * Abruf einer Liste von Songs, optional mit Stichwortsuche.
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
 * Anlegen eines neuen Songs.
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
 * Abruf eines einzelnen Songs anhand seiner ID.
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

/**
 * Aktualisieren einzelner Felder eines Songs oder Überschreiben des gesamten Songs.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function update(req, res) {
    let result = await service.update(req.params.id, req.body);

    if (result) {
        res.status(200);
        res.send(result);
    } else {
        throwNotFound();
    }
}

/**
 * Löschen eines Songs anhand seiner ID.
 * 
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function remove(req, res) {
    let count = await service.remove(req.params.id);

    if (count > 0) {
        res.status(204);
        res.send();
    } else {
        throwNotFound();
    }
}
