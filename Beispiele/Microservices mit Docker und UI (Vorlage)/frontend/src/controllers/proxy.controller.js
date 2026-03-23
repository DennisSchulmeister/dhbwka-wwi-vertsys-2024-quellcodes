import {createProxyMiddleware} from "http-proxy-middleware";

/**
 * Registrieren der HTTP Handler für diesen Controller. Hier müssen die Proxy Handler registriert
 * werden, die eine HTTP-Anfrage an den jeweils gewünschten Backend-Service weiterreichen.
 * 
 * @param {Express.App} app Express App-Objekt
 * @param {Object} config Konfiguration aus der main.js
 */
export default function registerRoutes(app, config) {
    // Weiterleitung an Microservice 1
    app.use("/api/microservice1", createProxyMiddleware({
        target:       `${config.url.microservice1}/api`,    // Host und Port des Backend-Services
        changeOrigin: true,                                 // Origin HTTP Header überschreiben
    }));

    // Weiterleitung an Microservice 2
    app.use("/api/microservice2", createProxyMiddleware({
        target:       `${config.url.microservice2}/api`,    // Host und Port des Backend-Services
        changeOrigin: true,                                 // Origin HTTP Header überschreiben
    }));
}