import {logger}     from "@dschulmeis/naas-common/src/utils.js";
import YAML         from "yaml";
import fs           from "node:fs/promises";

// Gateway-Konfiguration als Singleton
export let config = {};

/**
 * Alternative zum Zugriff auf die Konfiguration über das `config`-Singleton.
 * Hier wird stattdessen eine Kopie der Konfiguration zurückgegeben, was vor
 * allem bei der Request-Bearbeitung benötigt wird, um darin `${request.xxx}`
 * Verweise durch Echtdaten des verarbeiteten HTTP Requests ersetzen zu können.
 * 
 * @returns Tiefe Kopie der Gateway-Konfiguration
 */
export function copyConfig() {
    return JSON.parse(JSON.stringify(config));
}

/**
 * Diese Funktion muss einmalig beim Serverstart aufgerufen werden, um die
 * Konfigurationsdatei mit den Routing-Regeln des Gateways einzulesen. Die
 * Datei muss hierfür im YAML-Format kodiert und entsprechend dem Beispiel
 * `config/example.yml` aufgebaut sein.
 * 
 * @param {string} configFile Pfad der Konfigurationsdatei
 */
export async function readConfigFile(configFileName) {
    try {
        // Datei einlesen und YAML-Inhalt parsen
        logger.info(`Lese Konfigurationsdatei: ${configFileName}`);
    
        let configFile = await fs.readFile(configFileName, "utf-8");
        config = YAML.parse(configFile);
    
        // ${config.}-Verweise in der Konfiguration auflösen
        let redo = false;

        do {
            [config, redo] = resolveConfigReferences(config, "config", config);
        } while (redo);

        return config;
    } catch (error) {
        logger.error(error);
        console.error(error);
    }
}

/**
 * Rekursive Funktion zum Auflösen von `${xxx.yyy.…}` Referenzen in der Konfiguration.
 * Das Objekt, auf das sich `xxx` hier bezieht, wird im ersten Parameter übergeben,
 * der tatsächlich in der Konfiguration verwendete String im zweiten Parameter. Im
 * dritten Parameter sollte eine Kopie(!) der Konfiguration übergeben werden, da diese
 * durch die Ausführung der Funktion modifiziert werden kann.
 * 
 * Dennoch muss der erste Rückgabewert nach jedem Durchlauf als Ersatz für das übergebene
 * Konfigurationsobjekt verwendet werden. Die Funktion muss dabei in einer Schleife so oft
 * hintereinander aufgerufen werden, bis der zweite Rückgabewert `false` liefert.
 * 
 * Bei Fehlern, eine Referenz aufzulösen, wird eine Exception geworfen.
 * 
 * @param {Object} source Quellobjekt, auf das sich die Referenzen verweisen
 * @param {string} name Name des Quellobjekts in der Konfiguration, z.B. "config" oder "request"
 * @param {Any} config Zu bearbeitende Konfiguration (Achtung: Kopie verwenden!)
 * @returns {Array} Neues `config`_-Objekt und `redo` Flag
 */
export function resolveConfigReferences(source, name, config) {
    let redo = false, redo1 = false;

    if (typeof config === "string" || config instanceof String) {
        config = config.trim();

        if (config.startsWith(`\$\{${name}.`) && config.endsWith("}")) {
            let path   = config.slice(2, config.length - 1);
            let target = source;

            for (let pathItem of path.split(".").slice(1)) {
                target = target[pathItem];

                if (!target || target === source) {
                    throw new Error(`Fehler in der Konfigurationsdatei: Verweis '${config}' kann nicht aufgelöst werden.`);
                }
            }

            config = JSON.parse(JSON.stringify(target));
        }
    } else if (Array.isArray(config)) {
        for (let i in config) {
            [config[i], redo1] = resolveConfigReferences(source, name, config[i]);
            redo = redo || redo1;
        }
    } else if (typeof config === "object") {
        for (let key of Object.keys(config)) {
            [config[key], redo1] = resolveConfigReferences(source, name, config[key]);
            redo = redo || redo1;
        }
    }

    return [config, redo];
}