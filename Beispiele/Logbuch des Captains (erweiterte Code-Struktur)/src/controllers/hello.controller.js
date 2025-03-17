/*
 * HTTP Controller für einen einfachen Hallo Welt Web Service.
 */

/**
 * HTTP Request Handler registrieren
 * @param {Express.App} app Express App Objekt
 */
export default function registerRoutes(app) {
    app.get("/api/hello", sayHello);
}

/**
 * Begrüßung an den Client senden. Über den URL-Parameter "name" kann der Client
 * optional einen zu grüßenden Namen übergeben.
 */
export function sayHello(req, res) {
    const name = req.query.name || "Express";

    res.status(200);
    res.send({
        "greeting": `Hallo ${name}!`,
        "name": name,
    });
}
