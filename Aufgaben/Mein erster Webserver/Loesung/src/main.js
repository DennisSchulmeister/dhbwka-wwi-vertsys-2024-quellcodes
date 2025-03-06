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
console.log("Mein erster Webserver");
console.log("=====================");
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
    next();
});

/**
 * Request Handler Funkion für GET-Anfragen an die URL "/".
 */
app.get("/", (req, res) => {
    res.status(200);
    res.send("Hallo Express");
});

/**
 * Request Handler Funkion für GET-Anfragen an die URL "/bye".
 */
app.get("/bye", (req, res) => {
    res.status(200);
    res.send("Auf Wiedersehen!");
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