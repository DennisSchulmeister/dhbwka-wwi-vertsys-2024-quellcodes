import {copyConfig}              from "../config.js";
import {resolveConfigReferences} from "../config.js";

import {wrapAsync}               from "@dschulmeis/naas-common/src/utils.js";
import {logger}                  from "@dschulmeis/naas-common/src/utils.js";
import YAML                      from "yaml";
import http                      from "node:http";

// Zuletzt verwendeter Index beim Load Balancing
let loadBalancer = {};

/**
 * Diese Funktion fügt die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 *
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    app.all("/*", wrapAsync(handleRequest));
};

/**
 * Generische HTTP-Handler-Funktion zur Ausführung der konfigurierten Regeln
 * des API-Gateways.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 * @param {Function} next `next()`-Funktion von Express
 */
async function handleRequest(req, res, next) {
    // Konfiguration kopieren und ${request.}-Referenzen auflösen
    let config = copyConfig();
    let redo   = false;

    do {
        [config, redo] = resolveConfigReferences(req.headers, "request.headers", config, "");
    } while (redo);

    do {
        [config, redo] = resolveConfigReferences(req, "request", config);
    } while (redo);

    logger.debug("Konfiguration nach Auflösen der Request-Parameter: \n", YAML.stringify(config));
    logger.debug("Load Balancer Status vor Bearbeitung des Requests:\n", YAML.stringify(loadBalancer));

    // Zutreffende Regeln ausführen
    for (let rule of config.rules || []) {
        let actions = matchRule(rule, req);
        let finish  = await executeActions(actions, req, res);

        if (finish) break;
    }

    next();
}

/**
 * Diese Funktion wertet eine einzelne Konfigurationsregel aus und gibt die aufgrund
 * der Regel auszuführenden Aktionen zurück. Die Konfigurierte Regel muss hierfür
 * folgenden Aufbau besitzen:
 *
 * ```yml
 * if:
 *   prüfung1: ...
 *   prüfung2: ...
 * then:
 *   aktion1: ...
 *   aktion2: ...
 * else:
 *   aktion1: ...
 *   aktion2: ...
 * ```
 *
 * Alle drei Bestandteile sind optional. Wenn alle `if`-Prüfungen zutreffen, wird das `then`-Objekt
 * zurückgeliefert, sonst das `else`-Objekt. Fehlt das zurückzugebende Objekt, wird ein leeres
 * Objekt zurückgegeben.
 *
 * Folgende Prüfungen sind derzeit im `if`-Zweig erlaubt:
 *
 *   * `url` (String oder Liste von Strings): <br>
 *      Prüfung der URL. Wenn diese auf "*" endet, wird nur der Prefix gematcht. Sonst volle Gleichheit.
 *
 *   * `method` (String oder Liste von Strings): <br>
 *      Prüfung des HTTP Verbs. Groß-/Kleinschreibung wird ignoriert.
 *
 *   * `headers` (Objekt mit HTTP-Headern, Werte sind String oder Liste von Strings): <br>
 *      Prüfung eines oder mehrerer HTTP-Header. Alle Header müssen vorhanden sein und den angegebenen
 *      Wert besitzen. "*" kann für Wildcard- / Prefix-Matching genutzt werden.
 *
 * Die zurückgegebenen Aktionen werden hier nicht validiert, sondern müssen hierfür einfach
 * an die nächste Funktion `executeActions()` übergeben werden.
 *
 * @param {Object} rule Zu prüfende Regel
 * @param {Express.Request} req HTTP-Anfrage
 * @returns {Object} Auszuführende Aktionen oder leeres Objekt
 */
function matchRule(rule, req) {
    let matched   = false;
    let urlPrefix = "";
    let result    = {};

    function _matchStringPattern(value, pattern) {
        if (pattern.endsWith("*")) {
            pattern = pattern.slice(0, pattern.length - 1);
            if (`${value}`.startsWith(pattern)) return pattern;
        } else {
            if (`${value}` === `${pattern}`) return pattern;
        }
    }

    if ("if" in rule) {
        matched = false;

        for (let keyword of Object.keys(rule.if)) {
            switch (keyword) {
                case "url": {
                    for (let urlPattern of rule.if.url) {
                        urlPrefix = _matchStringPattern(req.originalUrl, urlPattern);

                        matched = !!urlPrefix;
                        if (matched) break;
                    }

                    break;
                }

                case "method": {
                    for (let methodPattern of rule.if.method) {
                        methodPattern = methodPattern.toUpperCase();
                        matched = !!_matchStringPattern(req.method.toUpperCase(), methodPattern);
                        if (matched) break;
                    }

                    break;
                }

                case "headers": {
                    for (let headerName of Object.keys(rule.if.headers)) {
                        for (let headerValuePattern of rule.if.headers[headerName]) {
                            matched = !!_matchStringPattern(req.headers[headerName], headerValuePattern);
                            if (matched) break;
                        }

                        if (!matched) break;
                    }

                    break;
                }
            }

            if (!matched) break;
        }
    } else {
        matched = true;
    }

    if (matched) result = rule.then || {};
    else result = rule.else || {};

    result._urlPrefix = urlPrefix;
    return result;
}

/**
 * Diese Funktion führt die zuvor mit `matchRule()` ermittelten Aktionen aus. Folgende Aktionen
 * sind dabei derzeit erlaubt:
 *
 *   * `status-code` (numerisch):
 *      HTTP-Statuscode setzen
 *
 *   * `headers` (Objekt):
 *      HTTP-Header setzen
 *
 *   * `body` (Irgendetwas):
 *      HTTP-Body setzen (wird ggf. nach JSON umgewandelt)
 *
 *   * `forward-to` (String oder Liste mit Strings):
 *      Weiterleitung an Backendsystem, bei Liste mit Load Balancing
 *
 *   * `finish` (Boolean):
 *      Regelverarbeitung nach dieser Regel abbrechen
 *
 * @param {Object} actions Auszuführende Aktion
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 * @returns {Boolean} Flag für Finish-Regel
 */
async function executeActions(actions, req, res) {
    let finish = false;

    for (let keyword of Object.keys(actions || {})) {
        switch (keyword) {
            case "status-code": {
                res.status(actions["status-code"]);
                break;
            }

            case "headers": {
                for (let headerName of Object.keys(actions.headers)) {
                    res.set(headerName, actions.headers[headerName]);
                }

                break;
            }

            case "body": {
                res.send(actions.body);
                break;
            }

            case "forward-to": {
                let urlPrefix = actions._urlPrefix || "";
                await forwardRequest(actions["forward-to"], urlPrefix, req, res);
                break;
            }

            case "finish": {
                finish = true;
                break;
            }
        }
    }

    return finish;
}

/**
 * Weiterleiten der übergebenen HTTP-Anfrage ein einen Backendserver. Im ersten Parameter
 * wird hierfür eine Liste mit Zieladressen übergeben, im zweiten Parameter der durch die
 * Regeln erkannte URL-Prefix, damit dieser vor der Weiterleitung abgeschnitten werden kann.
 *
 * @param {Array[string]} forwardTo Liste mit möglichen Zieladressen
 * @param {string} urlPrefix Gematchter URL-Prefix, vor Weiterleitung entfernen
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function forwardRequest(forwardTo, urlPrefix, req, res) {
    // Ziel-URL ermitteln (mit Load Balancing)
    let tryNextServer;
    let retryCount = 0;

    do {
        tryNextServer = false;
        retryCount += 1;

        let loadBalancerKey   = JSON.stringify(forwardTo);
        let loadBalancerIndex = loadBalancer[loadBalancerKey];
        if (loadBalancerIndex === undefined) loadBalancerIndex = -1;

        loadBalancerIndex = (loadBalancerIndex + 1) % forwardTo.length;
        loadBalancer[loadBalancerKey] = loadBalancerIndex;

        let urlSuffix = req.originalUrl.slice(urlPrefix.length);
        while (urlSuffix.startsWith("/")) urlSuffix = urlSuffix.slice(1);

        let targetUrl = `${forwardTo[loadBalancerIndex]}/${urlSuffix}`;

        let logPrefix = Math.floor(Math.random() * 9999);
        logger.info(`[${logPrefix}] Weiterleitung der Anfrage an: ${targetUrl}`);

        // Anfrage weiterleiten
        try {
            let statusCode = await new Promise(async (resolve, reject) => {
                let forwardReq = http.request(targetUrl, {method: req.method, joinDuplicateHeaders: true}, forwardRes => {
                    res.writeHead(forwardRes.statusCode, forwardRes.headersDistinct);
                    forwardRes.pipe(res);
                    resolve(forwardRes.statusCode);
                });

                forwardReq.on("error", error => {
                    if (error.code === "ECONNREFUSED" || error.code === "ECONNRESET") {
                        // Zielserver ist nicht erreichbar: Nächsten versuchen, falls vorhanden
                        logger.error("Der Zielserver ist nicht erreichbar. Probiere nächsten Server.");
                        tryNextServer = true;
                    } else {
                        logger.error(`[${logPrefix}] Bei der Weiterleitung der Anfrage an ${targetUrl} ist ein Fehler aufgetreten.`);
                    }

                    reject(error);
                });

                for (let headerName of Object.keys(req.headersDistinct)) {
                    if (headerName === "host") continue;
                    forwardReq.setHeader(headerName, req.headersDistinct[headerName]);
                }

                let forwardedHeaderValue = "";

                if (req.socket.localAddress) {
                    forwardedHeaderValue += `;by=${req.socket.localAddress}:${req.socket.localPort}`;
                    forwardedHeaderValue += `;for=${req.socket.remoteAddress}:${req.socket.remotePort}`;
                }

                if (req.headers.host) forwardedHeaderValue += `;host=${req.headers.host}`;
                if (req.protocol) forwardedHeaderValue += `;proto=${req.protocol}`;
                while (forwardedHeaderValue.startsWith(";")) forwardedHeaderValue = forwardedHeaderValue.slice(1);

                forwardReq.appendHeader("forwarded", forwardedHeaderValue);

                req.pipe(forwardReq, {end: true});
            });

            logger.info(`[${logPrefix}] Antwort des fremden Servers: Status ${statusCode}`);
        } catch (error) {
            if (tryNextServer) {
                if (retryCount >= forwardTo.length) {
                    logger.error("Kein weiterer Server verfügbar. HTTP-Anfrage kann nicht weitergeleitet werden.");
                    throw error;
                }
            } else {
                throw error;
            }
        }
    } while (tryNextServer);
}
