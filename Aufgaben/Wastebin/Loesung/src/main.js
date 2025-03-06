import dotenv        from "dotenv";
import express       from "express";
import qs            from "qs";
import path          from "node:path";
import url           from "node:url";
import process       from "node:process";

import {logger}      from "./utils.js";
import controllers   from "./controllers/index.js";

// Programmname ausgeben
console.log("Wastebin (Lösung)");
console.log("=================");
console.log();

// Konfigurationsvariablen einlesen
dotenv.config();

const config = {
    host: process.env.LISTEN_HOST || "",
    port: process.env.LISTEN_PORT || 9000,
};

// Webserver starten
const app = express();

app.set("query parser", str => qs.parse(str));

const sourceDir = path.dirname(url.fileURLToPath(import.meta.url));
const staticDir = path.join(sourceDir, "..", "static");

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

app.use(express.static(staticDir));
app.use(express.json());

for (let controller of controllers || []) {
    controller(app);
}

const server = app.listen(config.port, config.host, () => {
    logger.info(`Server lauscht auf ${config.host}:${config.port}`);
});

// Graceful Shutdown: Aktive Requests zu Ende bearbeiten, aber keine neuen Requests
// mehr akzeptieren, wenn der Server beendet werden soll.
process.on("SIGTERM", () => {
    console.log("SIGTERM empfangen. Beende Server.");
    server.close();
});

process.on("SIGINT", () => {
    console.log("\nSIGINT empfangen. Beende Server.");
    server.close();
});