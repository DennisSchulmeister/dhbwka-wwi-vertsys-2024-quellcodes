import languageController from "./language.controller.js";
import snippetController  from "./snippet.controller.js";

// Reexport alle Controller, um die main.js nicht anpassen zu müssen,
// wenn künftig ein neuer Controller hinzugefügt wird.
export default [
    languageController,
    snippetController,
];