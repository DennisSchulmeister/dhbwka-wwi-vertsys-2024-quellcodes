import {getGreeting} from "../services/hello.service.js";
/**
 * Registrieren der HTTP Handler für diesen Controller.
 * @param {Express.App} app Express App-Objekt
 */
export default function registerRouters(app) {
    app.get("/api/hello", sayHello);
}

/**
 * HTTP Handler für GET /api/hello. Erwartet im Query-Parameter q den Namen der zu
 * grüßenden Person.
 * 
 * @param {Express.Request} req HTTP Request
 * @param {Express.Response} res HTTP Response
 */
function sayHello(req, res) {
    let result = {
        text: getGreeting(req.query.name || "Microservice 2"),
    };

    res.status(200);
    res.send(result);
}