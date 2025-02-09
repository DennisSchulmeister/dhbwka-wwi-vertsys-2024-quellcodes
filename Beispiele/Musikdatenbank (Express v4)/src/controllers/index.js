import playlistController from "./playlist.controller.js";
import songController     from "./song.controller.js";

// Reexport alle Controller, um die main.js nicht anpassen zu müssen,
// wenn künftig ein neuer Controller hinzugefügt wird.
export default [
    playlistController,
    songController,
];