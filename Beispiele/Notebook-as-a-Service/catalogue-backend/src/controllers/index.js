import deviceController      from "./device.controller.js";
import deviceClassController from "./device-class.controller.js";

// Reexport alle Controller, um die main.js nicht anpassen zu müssen,
// wenn künftig ein neuer Controller hinzugefügt wird.
export default [
    deviceController,
    deviceClassController,
];