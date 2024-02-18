import deviceController         from "./device.controller.js";
import lendingRequestController from "./lending-request.controller.js";

// Reexport alle Controller, um die main.js nicht anpassen zu müssen,
// wenn künftig ein neuer Controller hinzugefügt wird.
export default [
    deviceController,
    lendingRequestController,
];