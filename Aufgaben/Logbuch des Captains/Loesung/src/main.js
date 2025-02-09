import {db}           from "./database.js";
import {calcStarDate} from "./utils.js";

import dotenv         from "dotenv";
import express        from "express";
import logging        from "logging";
import path           from "node:path";
import url            from "node:url";

// Programmname ausgeben
console.log("Logbuch des Captains");
console.log("====================");
console.log();

/**
 * Konfigurationsvariablen einlesen. Streng genommen gehört dies nicht zu Express.
 * Um das Deployment in einer Cloud-Umgebung zu vereinfachen, ist es heute aber
 * für Server-Anwendungen üblich, Konfigurationswerte aus den Umgebungsvariablen
 * des Betriebssystems zu bezeiehen. Vgl. https://www.12factor.net/
 */
dotenv.config();

const config = {
    host: process.env.LISTEN_HOST || "",
    port: process.env.LISTEN_PORT || 9000,
};

/**
 * Hilfsobjekt für formatierte Log-Ausgaben
 */
const logger = logging.default("main");

/**
 * Zentrales App-Objekt der Express-Anwendung. Dies ist der eigentlichen Webserver.
 * Weiter unten registrieren wir verschiedene Handler Funktionen, die es uns ermöglichen,
 * die eingehenden HTTP-Anfragen zu beantworten.
 */
const app = express();

/**
 * `app.use()`: Registrieren einer Middleware-Funktion. Middleware-Funktionen werden
 * für alle HTTP-Anfragen aufgerufen, unabhängig von der HTTP-Methode oder URL, um
 * die Anfrage vorzuverarbeiten oder die Antwort zu filtern, bevor sie an den Client
 * geschickt wird.
 */
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);

    // Wichtig: Mit next() wird die "nächste" Middleware-Funktion bzw. die tatsächlich
    // zuständige Handler-Funktion aufgerufen. Nach dieser Zeile finden wir im `res`-Objekt
    // die von der Handler-Funktion generierten Antwortdaten, so dass wir diese hier nochmal
    // anpassen könnten.
    next();
});

/**
 * Statische Dateien aus dem static-Verzeichnis abrufbar machen, da dieses eine kleine
 * Single Page App als Benutzeroberfläche beinhaltet.
 */
const sourceDir = path.dirname(url.fileURLToPath(import.meta.url));
const staticDir = path.join(sourceDir, "..", "static");

app.use(express.static(staticDir));
app.use(express.json());

/**
 * HTTP-Endpunkt zum Abrufen aller vorhandenen Logbuch-Einträge
 */
app.get("/api/logbook", async (req, res) => {
    res.status(200);
    res.send(db.data.LogEntries);
});

/**
 * HTTP-Endpunkt zum Anlegen eines neuen Logbuch-Eintrags
 */
app.post("/api/logbook", async (req, res) => {
    if (!req.body?.text) {
        // Statuscodes siehe https://http.dog/
        res.status(400);
        res.send({error: "Bitte Text eingeben!"});
    } else {
        // Neuen Eintrag in die Datenbank schreiben
        const newEntry = {
            starDate: calcStarDate(new Date()),
            text: req.body.text,
        };

        db.data.LogEntries.push(newEntry);
        await db.write();

        res.status(201);
        res.send(newEntry);
    }
});

/**
 * Webserver starten
 */
app.listen(config.port, config.host, () => {
    logger.info(`Server lauscht auf ${config.host}:${config.port}`);
});