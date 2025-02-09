import logging from "logging";

/**
 * Logger zum Ausgeben von Info-Meldungen, Warnungen und Fehlern mit den
 * Methoden `info()`, `warning()` und `error()`.
 */
export const logger = logging.default("main");

/**
 * Hilfsfunktion zum Werfen eines Fehlers, der in der `main.js` als Fehlerobjekt
 * im JSON-Format an den Client gesendet wird. Wirft im Grunde genommen einfach
 * nur ein `new Error()` als Exception, dem allerdings noch der Name des Fehlers
 * und der HTTP-Statuscode hinzugefügt werden.
 * 
 * @param {string} name Technischer Fehlername
 * @param {string} message Leserliche Fehlermeldung
 * @param {number} status HTTP Status Code (Standard: 400)
 */
export function throwError(name, message, status) {
    let error        = new Error(message || "");
    error.name       = name || "Error";
    error.httpStatus = status || 400;

    throw error;
}

/**
 * Hilfsfunktion zum Werfen eines HTTP 404 (Nicht gefunden) Fehlers.
 */
export function throwNotFound() {
    throwError("NOT-FOUND", "Nicht gefunden", 404);
}