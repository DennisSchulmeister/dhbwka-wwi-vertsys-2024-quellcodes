/**
 * Re-Export aller Controller für den Aufruf in der Datei `main.js`.
 *
 * Hierbei handelt es sich um eine Umsetzung des Offen/Geschlossen-Prinzips der
 * SOLID-Design-Prinzipien. Denn, immer wenn ein neuer Controller hin zu kommt
 * (Erweiterung), muss die Datei `main.js` nicht verändert werden (Veränderung).
 * Stattdessen müssen hier zwei Zeilen ergänzt werden, was deutlich einfach und
 * weniger fehleranfällig machbar ist.
 */
import helloController   from "./hello.controller.js";
import logbookController from "./logbook.controller.js";

export default [
    helloController,
    logbookController
];
