import actuator                from "express-actuator";
import dotenv                  from "dotenv";
import express                 from "express";
import gradient                from "gradient-string";
import qs                      from "qs";

import {logRequest}            from "./middleware.js";
import {serveStaticFiles}      from "./middleware.js";
import {handleError}           from "./middleware.js";
import {allowGracefulShutdown} from "./shutdown.js";
import {logger}                from "./utils.js";

/**
 * All-in-one-Funktion zum Starten des Webservers. Diese ließt die Datei `.env` ein,
 * falls vorhanden, und setzt die Umgebungsvariablen des Prozesses entsprechend,
 * bevor die Umgebungsvariablen `LISTEN_HOST` und `LISTEN_PORT` zum Starten des
 * Servers ausgelesen werden. Anschließend wird der Webserver konfiguriert, die
 * Routen aus den Controller-Modulen werden hinzugefügt und der Server gestartet.
 * 
 * @param {string[]} asciiArt ASCII Art Banner mit dem Programmname
 * @param {Function} preStart Optionale Callback-Funktion, die vor Serverstart aufgerufen wird
 * @param {string} staticDir Optionales Verzeichnis mit statischen Webinhalten
 * @param {Function[]} controllers Optionale Liste von Funktionen, die der Express App URL-Routen hinzufügen
 */
export async function startServer({asciiArt, staticDir, controllers, preStart} = {}) {
    // Programmname ausgeben
    if (asciiArt) {
        console.log(gradient.retro.multiline(asciiArt.join("\n")));
    }

    // Konfigurationsvariablen einlesen
    dotenv.config();

    const config = {
        host: process.env.LISTEN_HOST || "",
        port: process.env.LISTEN_PORT || 8888,
    };

    // Callback-Funktion für vorbereitende Aktionen aufrufen
    if (preStart) await preStart();

    // Webserver starten
    const app = express();

    app.set("query parser", str => qs.parse(str));
    app.set("trust proxy", true);

    app.use(logRequest(logger));
    app.use(serveStaticFiles(staticDir));
    app.use(express.json());
    app.use(actuator());

    for (let controller of controllers || []) {
        controller(app);
    }

    app.use(handleError(logger));

    const server = app.listen(config.port, config.host, () => {
        logger.info(`Server lauscht auf ${config.host}:${config.port}`);
    });

    allowGracefulShutdown({logger, server});
}