import {db}                   from "../database.js";
import {validateAndSaveOrder} from "../services/order.service.js";
import {throwNotFound}        from "@dschulmeis/naas-common/src/utils.js";

/**
 * Diese Funktion fügt die unten ausprogrammierten Route Handler der
 * Express Application hinzu.
 *
 * @param {Express.Application} app Express Application
 */
export default function registerRoutes(app) {
    app.get("/order", search);
    app.get("/order/:id", find);
    app.post("/order", createOrder);
};

/**
 * Abruf einer Liste von Aufträgen.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function search(req, res) {
    let result = db.data.Order;

    if (req.query.q) {
        let q = req.query.q.toLowerCase();

        result = result.filter(entry => {
            return entry.manufacturer.toLowerCase().includes(q)
                || entry.model.toLowerCase().includes(q)
                || entry.contactData.toLowerCase().includes(q)
                || entry.location.toLowerCase().includes(q);
        });
    }

    res.send(result);
}

/**
 * Abruf eines einzelnen Auftrags.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
function find(req, res) {
    let result = db.data.Order.find(entry => entry.id === parseInt(req.params.id));
    if (!result) throwNotFound();

    res.send(result);
}

/**
 * Gerät ausleihen, sofern es existiert und im gewünschten Zeitraum verfügbar ist.
 *
 * @param {Express.Request} req HTTP-Anfrage
 * @param {Express.Response} res HTTP-Antwort
 */
async function createOrder(req, res) {
    let order = JSON.parse(JSON.stringify(req.body));
    let savedOrder = await validateAndSaveOrder(order, true);
    res.send(savedOrder);
}
