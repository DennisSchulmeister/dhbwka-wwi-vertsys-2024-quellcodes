import {logger}     from "@dschulmeis/naas-common/src/utils.js";
import YAML         from "yaml";
import fs           from "node:fs/promises";

// Erlaubte Schlüsselwörter für die Syntaxprüfung:
// Der Typ "list" ist eine Liste von Strings oder ein einzelner String.
// Alle anderen Typen entsprechen ihrem JavaScript-Gegenstück.
const IF_SYNTAX = {
    type: "object",
    properties: {
        "url":     {type: "list"},
        "method":  {type: "list"},
        "headers": {
            type: "object",
            properties: {
                "*": {type: "list"},
            },
        },
    }
};

const THEN_ELSE_SYNTAX = {
    type: "object",
    properties: {
        "status-code": {type: "number"},
        "headers":     {type: "object"},
        "body":        {type: "any"},
        "forward-to":  {type: "list"},
        "finish":      {type: "boolean"},
    }
};

export const CONFIG_SYNTAX = {
    type: "object",
    properties: {
        "variables": {
            type: "object"
        },
        "rules": {
            type: "array",
            items: {
                type: "object",
                properties: {
                    "if":   IF_SYNTAX, 
                    "then": THEN_ELSE_SYNTAX,
                    "else": THEN_ELSE_SYNTAX,
                },
            },
        },
    },
};

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

        // Einfache Syntaxprüfung, um Schreibfehler gleich bei Programmstart abzufangen
        config = syntaxCheck(config, CONFIG_SYNTAX);

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
 * @param {Any} defaultValue Standardwert, wenn ein Wert nicht ermittelt werden kann
 * @returns {Array} Neues `config`_-Objekt und `redo` Flag
 */
export function resolveConfigReferences(source, name, config, defaultValue) {
    let redo = false, redo1 = false;

    if (typeof config === "string" || config instanceof String) {
        config = config.trim();
        let prefix = `\$\{${name}.`;

        if (config.startsWith(prefix) && config.endsWith("}")) {
            let path   = config.slice(prefix.length, config.length - 1);
            let target = source;

            for (let pathItem of path.split(".")) {
                target = target[pathItem];

                if (!target || target === source) {
                    if (defaultValue === undefined) {
                        throw new Error(`Fehler in der Konfigurationsdatei: Verweis '${config}' kann nicht aufgelöst werden.`);
                    } else {
                        target = defaultValue;
                        break;
                    }
                }
            }

            config = JSON.parse(JSON.stringify(target));
        }
    } else if (Array.isArray(config)) {
        for (let i in config) {
            [config[i], redo1] = resolveConfigReferences(source, name, config[i], defaultValue);
            redo = redo || redo1;
        }
    } else if (typeof config === "object") {
        for (let key of Object.keys(config)) {
            [config[key], redo1] = resolveConfigReferences(source, name, config[key], defaultValue);
            redo = redo || redo1;
        }
    }

    return [config, redo];
}

/**
 * Konfiguration auf grobe Rechtschreibfehler prüfen. Wirft eine Exception,
 * falls welche gefunden werden. Durchläuft die Konfiguration rekursiv und
 * ersetzt dabei ggf. Inhalte durch ihre geeigneten Datentypen.
 * 
 * @param {any} config Zu prüfende Konfiguration
 * @param {Object} syntaxDefinition Erlaubte Schlüsselwörter (Konstanten oben)
 * @returns {any} Neuer Wert für die geprüfte Konfiguration.
 */
export function syntaxCheck(config, syntaxDefinition) {
    switch (syntaxDefinition.type) {
        case "any": {
            return config;
        }

        case "object": {
            if (Array.isArray(config) || typeof config !== "object" || config instanceof String) {
                throw new Error("Fehler in der Konfigurationsdatei: Das folgende Konstrukt ist kein YAML-Objekt:\n" + YAML.stringify(config));
            }

            if (syntaxDefinition.properties) {
                for (let propertyName of Object.keys(config)) {
                    let propertySyntax = syntaxDefinition.properties[propertyName] || syntaxDefinition.properties["*"];

                    if (propertySyntax === undefined) {
                        throw new Error(`Fehler in der Konfigurationsdatei: Unbekanntes Schlüsselwort '${propertyName}' in:\n` + YAML.stringify(config));
                    }

                    config[propertyName] = syntaxCheck(config[propertyName], propertySyntax);
                }
            }

            return config;
        }

        case "array": {
            if (!Array.isArray(config)) {
                throw new Error("Fehler in der Konfigurationsdatei: Das folgende Konstrukt ist kein YAML-Array:\n" + YAML.stringify(config));
            }

            if (syntaxDefinition.items) {
                for (let index in config) {
                    config[index] = syntaxCheck(config[index], syntaxDefinition.items);
                }
            }

            return config;
        }

        case "list": {
            if (!Array.isArray(config)) config = [config];

            if (config.length === 0) {
                throw new Error("Fehler in break;der Konfigurationsdatei: Liste darf nicht leer sein.");
            }

            for (let index in config) {
                if (typeof config[index] === "object") {
                    throw new Error("Fehler in der Konfigurationsdatei: Das folgende Konstrukt lässt sich nicht als String interpretieren:\n" + YAML.stringify(config[index]));
                } else {
                    config[index] = `${config[index]}`.trim();
                }
            }

            return config;
        }

        case "number": {
            if (typeof config === "number") {
                return config;
            } else if (!Number.isNaN(parseFloat(config))) {
                return parseFloat(config);
            } else {
                throw new Error("Fehler in der Konfigurationsdatei: Das folgende Konstrukt lässt sich nicht als Nummer interpretieren:\n" + YAML.stringify(config));
            }
        }

        case "boolean": {
            if (typeof config === "boolean") {
                return config;
            } else if (["true", "yes", "y", "ja", "j", "x"].includes(`${config}`.trim().toLowerCase())) {
                return true;
            } else if (["false", "no", "nein", "n", "-"].includes(`${config}`.trim().toLowerCase())) {
                return false;
            } else {
                throw new Error("Fehler in der Konfigurationsdatei: Das folgende Konstrukt lässt sich nicht als Boolean interpretieren:\n" + YAML.stringify(config));
            }
        }

        default: {
            throw new Error(`Programmierfehler in der Syntaxprüfung: Typprüfung für Typ '${syntaxDefinition.type}' ist nicht definiert!`);
        }
    }
}