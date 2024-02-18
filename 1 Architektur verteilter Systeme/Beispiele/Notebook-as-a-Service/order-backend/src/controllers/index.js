import deviceController from "./device.controller.js";
import orderController  from "./order.controller.js";

// Reexport alle Controller, um die main.js nicht anpassen zu müssen,
// wenn künftig ein neuer Controller hinzugefügt wird.
export default [
    deviceController,
    orderController,
];