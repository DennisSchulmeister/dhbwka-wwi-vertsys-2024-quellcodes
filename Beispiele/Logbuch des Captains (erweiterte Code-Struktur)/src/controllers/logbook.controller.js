/*
 * HTTP Controller für Logbuch-Einträge. Technische Ebene, auf der HTTP-Anfragen
 * empfangen und mit HTTP-Antworten beantwortet werden. Die fachliche Logik
 * befindet sich stattdessen in einer Service-Datei, um Technik und Fachlichkeit
 * sauber zu trennen.
 */
import {searchLogEntries} from "../services/logbook.service.js";
import {saveNewLogEntry}  from "../services/logbook.service.js";

/**
 * HTTP Request Handler registrieren
 * @param {Express.App} app Express App Objekt
 */
export default function registerRoutes(app) {
    app.get("/api/logbook", search);
    app.post("/api/logbook", create);

    // HINWEIS: Echte REST-Webservices haben noch mehr Endpunkte
}

/**
 * Logbuch-Einträge suchen
 */
async function search(req, res) {
    let result = await searchLogEntries(req.query.q);

    res.status(200);    // Okay
    res.send(result);
}

/**
 * Neuen Logbuch-Eintrag schreiben
 */
async function create(req, res) {
    let result = await saveNewLogEntry(req.body);

    res.status(201);    // Created
    res.header("location", `/api/logbook/${result.startdate}`);
    res.send(result);
}
