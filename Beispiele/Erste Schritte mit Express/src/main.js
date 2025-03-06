/**
 * Unsere allerersten Schritte mit dem Express Framework. Das Beispiel zeigt die
 * allgemeine Struktur einer Express-Anwendung mit dem `app`-Objekt, Middleware
 * und Request Handler Funktionen.
 */

import dotenv  from "dotenv";
import express from "express";
import logging from "logging";
import process from "node:process";

/**
 * Programmname ausgeben
 */
console.log("Erste Schritte mit Express");
console.log("==========================");
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
 * Zentrales App-Objekt der Express-Anwendung. Dies ist der eigentliche Webserver.
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
 * Request Handler Funkion für GET-Anfragen an die URL "/". Man nennt dies auch
 * den "Endpunkt GET /". Über den Query-Parameter `?name=…` kann ein Name übergeben
 * werden, der begrüßt werden soll.
 */
app.get("/", (req, res) => {
    res.status(200);

    if (req.query.name) {
        res.send(`Hallo ${req.query.name}`);
    } else {
        res.send(`Hallo! Sage mir deinen Namen durch einen Aufruf von ${req.url}?name=… oder /hello/…`);
    }
});

/**
 * Request Handler mit benanntem URL-Parameter. Der zu grüßende Name wird hier als
 * Teil des URL-Pfads übergeben, wodurch die URL sehr viel schöner aussieht.
 * (Echten Webentwicklern ist so etwas wichtig 🙂)
 */
app.get("/hello/:name", (req, res) => {
    res.status(200);
    res.send(`Hallo ${req.params.name}`);
});

/**
 * Webserver starten. Die Callback-Funktion wird aufgefufen, sobald der Webserver
 * bereit ist, Anfragen zu bearbeiten.
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