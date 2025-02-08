import logging from "logging";

/**
 * Logger zum Ausgeben von Info-Meldungen, Warnungen und Fehlern mit den
 * Methoden `info()`, `warning()` und `error()`.
 */
export const logger = logging.default("main");

/**
 * Diese Funktion kann eine asynchrone Express Request-Handler-Funktion einhüllen, so
 * dass eventuell auftretende Fehler in jedem Fall korrekt an das Express-Framework
 * übergeben werden. Hintergrund ist, dass gerade bei asynchronen Funktionen in Express 4.x
 * eine Exception nicht geworfen werden kann, weil sie vom Framework verschluckt wird.
 * Sie muss stattdessen an die `next()`-Funktion übergeben werden.
 * 
 * Ab Express 5.x braucht es diesen Wrapper wohl nicht mehr.
 * 
 * @param {Function} handler Express Handler-Funktion
 * @returns {Function} Neue Express Handler-Funktion
 */
export function wrapAsync(handler) {
    return function(req, res, next) {
        try {
            handler(req, res, next)?.catch(next)?.then(next);
        } catch (ex) {
            return next(ex);
        }
    };
}