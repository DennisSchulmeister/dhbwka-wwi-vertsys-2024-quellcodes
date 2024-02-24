/**
 * Diese Funktion erzeugt eine Express-Middleware, die für jede empfangene Anfrage
 * eine Zeile auf der Konsole protokolliert.
 * 
 * @param {logging.Logger} logger Logger für Konsolenausgaben
 * @returns Express-Middleware-Funktion
 */
export function logRequest(logger) {
    return function(req, res, next) {
        logger.info(`${req.method} ${req.originalUrl}`);
        next();
    }
}

/**
 * Diese Funktion erzeugt eine Express-Middleware zur Behandlung von Fehlern bzw.
 * nicht abgefangenen Ausnahmen. Diese werden auf der Konsole protokolliert und im
 * JSON-Format an den Client gesendet.
 * 
 * @param {logging.Logger} logger Logger für Konsolenausgaben
 * @returns Express-Middleware-Funktion
 */
export function handleError(logger) {
    return function (err, req, res, next) {
        logger.error(err);
        
        if (!err.httpStatus) console.error(err);

        res.status(err.httpStatus || 500);
        
        res.send({
            error:   err.name    || "Error",
            message: err.message || "",
        });

        next();
    }
}