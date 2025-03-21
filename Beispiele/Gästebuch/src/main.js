/**
 * Minimales Beispiel für eine Single Page App mit einem Webservice-Backend.
 * Diese Datei implementiert einen einfachen Webserver mit dem Express-Framework,
 * der sowohl das Frontend (die Single Page App) als auch den Webservice für
 * den Zugriff auf eine simulierte Datenbank bereitstellt.
 * 
 * Das Beispiel ist nicht sehr groß. Deshalb befindet sich der gesamte Quellcode
 * in einer skript-artigen Datei. Das Beispielprogramm "Musikdatenbank" zeigt,
 * wie eine größere Anwendung sauber strukturiert werden kann.
 */

import dotenv  from "dotenv";
import express from "express";
import logging from "logging";
import path    from "node:path";
import url     from "node:url";
import process from "node:process";

// Programmname ausgeben
console.log("Gästebuch");
console.log("=========");
console.log();

// Konfigurationsvariablen einlesen
dotenv.config();

const config = {
    host: process.env.LISTEN_HOST || "",
    port: process.env.LISTEN_PORT || 9000,
};

// Logger zum Ausgeben strukturierte Log-Meldungen
const logger = logging.default("main");

// Gästebucheinträge (statt einer Datenbank)
let guestbookEntries = [
    {date: new Date("2024-02-03T15:44:28Z"), name: "Brent Spinner"},
    {date: new Date("2024-02-16T09:48:32Z"), name: "Jonathan Frakes"},
    {date: new Date("2024-02-26T13:15:47Z"), name: "Patrick Steward"},
];

// Webserver starten
const app = express();

const sourceDir = path.dirname(url.fileURLToPath(import.meta.url));
const staticDir = path.join(sourceDir, "..", "static");

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.static(staticDir));
app.use(express.json());

app.get("/api/guestbook", (req, res) => {
    res.send(guestbookEntries);
});

app.post("/api/guestbook", (req, res) => {
    if (!req.body?.name) {
        // Statuscodes siehe https://http.dog/
        res.status(400);
        res.send({error: "Bitte Name angeben!"});
    } else {
        let newEntry = {date: new Date(), name: req.body.name};
        guestbookEntries.push(newEntry);
        res.send(newEntry);
    }
});

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