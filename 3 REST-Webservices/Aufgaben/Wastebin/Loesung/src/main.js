import dotenv        from "dotenv";
import express       from "express";
import qs            from "qs";
import logging       from "logging";
import path          from "node:path";
import url           from "node:url";

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

// Logger zum Ausgeben strukturierte Log-Meldungen
const logger = logging.default("main");

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

app.listen(config.port, config.host, () => {
    logger.info(`Server lauscht auf ${config.host}:${config.port}`);
});