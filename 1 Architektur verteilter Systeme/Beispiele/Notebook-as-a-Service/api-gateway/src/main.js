import {readConfigFile} from "./config.js";
import controllers      from "./controllers/index.js";

import {logger}         from "@dschulmeis/naas-common/src/utils.js";
import {startServer}    from "@dschulmeis/naas-common/src/server.js";
import YAML             from "yaml";

import fs               from "node:fs/promises";
import path             from "node:path";
import process          from "node:process";
import url              from "node:url";
import util             from "node:util";

const sourceDir = path.dirname(url.fileURLToPath(import.meta.url));
const staticDir = path.join(sourceDir, "..", "static");

/**
 * Auswerten der Kommandozeilenargumente und Einlesen der Konfigurationsdatei
 * bevor der Server startet.
 */
async function preStart() {
    try {
        let defaultConfigFile = path.join(sourceDir, "..", "config", "example.yml");
        defaultConfigFile = path.relative(process.cwd(), defaultConfigFile);
    
        let argsConfig = {
            options: {
                config:        {type: "string",  short: "c", default: defaultConfigFile},
                "show-config": {type: "boolean", short: "s", default: false},
                help:          {type: "boolean", short: "h", default: false},
            },
        };

        const args = util.parseArgs(argsConfig);
    
        if (args.values.help) {
            let scriptFile = path.relative(process.cwd(), process.argv[1]);

            console.log(`Aufruf: ${process.argv[0]} ${scriptFile} [--config,-c PFAD] [--show-config,-s] [--help,h]`);
            console.log();
            console.log(`  --config, -c PFAD    Pfad der Konfigurationsdatei (Standard: ${argsConfig.options.config.default})`);
            console.log(`  --show-config, -s    Konfiguration auf der Konsole ausgeben (Standard: ${argsConfig.options["show-config"].default})`);
            console.log(`  --help, -h           Diesen Hilfetext anzeigen (Standard: ${argsConfig.options.help.default})`);
            console.log();

            process.exit(0);
        } else {
            let configFile = args.values.config;
    
            try {
                let stat = await fs.stat(configFile);
    
                if (!stat.isFile()) {
                    logger.error(`Keine Datei: ${configFile}`);    
                    process.exit(1);
                }
            } catch (error) {
                logger.error(`Konfigurationsdatei nicht gefunden: ${configFile}`);
                process.exit(1);
            }
    
            let config = await readConfigFile(configFile);
    
            if (args.values["show-config"]) {
                console.log(YAML.stringify(config)); 
            }
        }
    } catch (error) {
        logger.error(error);
    }
}

await startServer({
    asciiArt: [
        "┳┓     ┓     ┓            ┏┓      ▪    ",
        "┃┃┏┓╋┏┓┣┓┏┓┏┓┃┏  ┏┓┏  ┏┓  ┗┓┏┓┏┓┓┏┓┏┏┓▪",
        "┛┗┗┛┗┗ ┗┛┗┛┗┛┛┗  ┗┻┛  ┗┻  ┗┛┗ ┛ ┗┛┗┗┗ ▪",
        "┏┓┏┓┳  ┏┓                              ",
        "┣┫┃┃┃━━┃┓┏┓╋┏┓┓┏┏┏┓┓┏                  ",
        "┛┗┣┛┻  ┗┛┗┻┗┗ ┗┻┛┗┻┗┫                  ",
        "                    ┛                  ",
    ],
    preStart:    preStart,
    staticDir:   staticDir,
    controllers: controllers,
});