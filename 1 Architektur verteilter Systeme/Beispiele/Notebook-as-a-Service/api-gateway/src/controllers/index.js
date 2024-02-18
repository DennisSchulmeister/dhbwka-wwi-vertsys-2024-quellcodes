import configuredHandlersController from "./configured-handlers.controller.js";

// Reexport alle Controller, um die main.js nicht anpassen zu müssen,
// wenn künftig ein neuer Controller hinzugefügt wird.
export default [
    configuredHandlersController,
];