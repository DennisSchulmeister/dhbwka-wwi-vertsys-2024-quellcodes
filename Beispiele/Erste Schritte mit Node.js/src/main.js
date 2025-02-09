/**
 * Dieses Programm ruft eine Liste von der NASA ab, welche Menschen sich derzeit
 * im Weltraum befinden und zeigt sie als formatierte Ausgabe auf der Konsole an.
 * 
 * Das Programm verwendet prettyoutput als Beispiel für eine externe Abhängigkeit.
 * Vgl. https://www.npmjs.com/package/prettyoutput
 * 
 * Für weitere frei verfügbare Daten vgl. https://github.com/jdorfman/awesome-json-datasets
 */
import {fetchJson}  from "./utils/fetch.js";
import prettyoutput from "prettyoutput";

try {
    console.log("People in Space");
    console.log("===============");
    console.log();

    // Daten abrufen (erste Version ohne Module)
    // let response = await fetch("http://api.open-notify.org/astros.json");
    // let peopleInSpace = await response.json();

    // Daten abrufen (zweite Version mit Modulen)
    let peopleInSpace = await fetchJson("http://api.open-notify.org/astros.json");

    // Daten formatieren mit der prettyoutput-Bibliothek
    let formatedOutput = prettyoutput(peopleInSpace);
    console.log(formatedOutput);
} catch (error) {
    console.error("Fehler beim Abruf der Daten!");
    console.error(error);
}