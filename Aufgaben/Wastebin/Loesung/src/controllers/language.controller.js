import {db} from "../database.js";

/**
 * Diese Funktion fügt die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 *
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    // Ganze Collection
    app.get("/api/language", getAllLanguages);
};

/**
 * Liste der unterstützten Programmiersprachen für das Syntax Highlighting abrufen.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function getAllLanguages(req, res) {
    let result = db.data.Language;

    res.status(200);
    res.send(result);
}
