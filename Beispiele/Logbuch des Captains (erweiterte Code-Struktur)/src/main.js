import dotenv         from "dotenv";
import express        from "express";
import logging        from "logging";
import path           from "node:path";
import url            from "node:url";
import process        from "node:process";

import controllers    from "./controllers/index.js";

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

/**
 * Sicherstellen, dass der Webservice Anfragen im JSON-Format verarbeiten kann
 * und seine Antworten ebenfalls im JSON-Format sendet.
 */
app.use(express.json());

/**
 * Request Handler in den Controller-Dateien registrieren
 */
for (let controller of controllers) {
    controller(app);
}

/**
 * Einheitliche Fehlerbehandlung sicherstellen. Diese Middleware fängt alle
 * Exception ab, die in den Request Handlern und vorherigen Middlewares
 * auftreten, protokolliert sie auf der Konsole und schickt sie als JSON-Objekt
 * an den Client.
 *
 * WICHTIG: Diese Middleware muss ganz zum Schluss registriert werden, damit
 * sie bei einem Fehler auch tatsächlich aufgerufen wird.
 */
app.use((err, req, res, next) => {
    // Fehler auf der Konsole protokollieren
    logger.error(err);
    console.log(err);

    // Fehler an den Client senden
    res.status(500);    // Internal Server Error

    res.send({
        "error": {
            "type": "TECHNICAL_ERROR",
            "message": err.message || "Es ist ein unbekannter Fehler aufgetreten.",
        },
    });

    next();
});

/**
 * Webserver starten
 */
const server = app.listen(config.port, config.host, () => {
    logger.info(`Server lauscht auf ${config.host}:${config.port}`);
});

/**
 * Graceful Shutdown: Aktive Requests zu Ende bearbeiten, aber keine neuen Requests
 * mehr akzeptieren, wenn der Server beendet werden soll.
 */
process.on("SIGTERM", () => {
    console.log("SIGTERM empfangen. Beende Server.");
    server.close();
});

process.on("SIGINT", () => {
    console.log("\nSIGINT empfangen. Beende Server.");
    server.close();
});
