import {logger}      from "@dhbw-vertsys/beispiel-common/src/utils.js";
import {logRequest}  from "@dhbw-vertsys/beispiel-common/src/middleware.js";
import {handleError} from "@dhbw-vertsys/beispiel-common/src/middleware.js";

import dotenv        from "dotenv";
import express       from "express";
import qs            from "qs";
import path          from "node:path";
import url           from "node:url";
import process       from "node:process";

import controllers   from "./controllers/index.js";

// Programmname ausgeben
console.log("Frontend");
console.log("=========");
console.log();

// Konfigurationsdatei .env mit zusätzlichen Umgebungsvariablen einlesen.
dotenv.config();

const config = {
    host: process.env.LISTEN_HOST || "",
    port: process.env.LISTEN_PORT || 8888,
};

// Express Webserver konfigurieren
const app = express();

app.set("query parser", str => qs.parse(str));
app.set("trust proxy", true);

const sourceDir = path.dirname(url.fileURLToPath(import.meta.url));
const staticDir = path.join(sourceDir, "..", "static");

app.use(logRequest(logger));
app.use(express.static(staticDir));
app.use(express.json());

for (let controller of controllers || []) {
    controller(app);
}

app.use(handleError(logger));

// Server starten und stoppen
const server = app.listen(config.port, config.host, () => {
    logger.info(`Server lauscht auf ${config.host}:${config.port}`);
});

process.on("exit", () => {
    console.log("Beende Server.");
    server.close();
    db.close();
});

process.on("SIGHUP",  () => process.exit(128 + 1));
process.on("SIGINT",  () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));
