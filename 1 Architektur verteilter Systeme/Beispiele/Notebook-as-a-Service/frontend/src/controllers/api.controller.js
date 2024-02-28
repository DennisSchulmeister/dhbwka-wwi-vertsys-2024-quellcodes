/**
 * Diese Funktion fügt die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 *
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    app.get("/api/gateway", getGatewayUrl);
};

/**
 * URL des API-Gateways abrufen.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function getGatewayUrl(req, res) {
    res.set("content-type", "text/plain");
    res.send(process.env.GATEWAY_URL);
}
