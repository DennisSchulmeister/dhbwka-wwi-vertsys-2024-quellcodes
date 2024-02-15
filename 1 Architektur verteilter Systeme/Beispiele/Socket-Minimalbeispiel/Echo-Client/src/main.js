/**
 * Echo-Client
 * ===========
 *
 * Zeigt die Begrüßung vom Echo-Server an und wartet dann auf Benutzereingaben,
 * die an den Server geschickt werden. Der Server schickt dieselben Daten zurück
 * an den Client, die dann ebenfalls angezeigt werden.
 *
 * Eine leere Zeile beendet das Programm.
 */
import net                from "net";
import * as dotenv        from "dotenv";

import * as readline      from 'node:readline/promises';
import {stdin as input}   from 'node:process';
import {stdout as output} from 'node:process';

import {EventEmitter}     from 'node:events';
import {once}             from 'node:events';


// Serverkonfiguration aus Umgebungsvariablen oder Datei ".env" lesen
dotenv.config();

const DEFAULT_PORT = 7001;

const TARGET_IP   =          process.env.TARGET_IP    || "";
const TARGET_PORT = parseInt(process.env.TARGET_PORT) || DEFAULT_PORT;


// Hilfsobjekt, um die empfangenen Daten aus dem Event Handler ganz unten
// an die Programmlogik in der Hauptschleife zu senden. Bei Empfang von
// neuen Daten wird mit diesem Objekt ein Event ausgelöst, auf das an den
// richtigen Stellen in der Hauptschleife gewartet wird.
//
// Hier zeigt sich die Komplexität der asynchronen Programmierung. :-)
// Zum Glück werden async/await im selben Thread wie der Rest ausgeführt, nur
// eben zu einem späteren Zeitpunkt. Sonst wäre die Synchronisation noch komplizierter.
let weiterwerfenEventEmitter = new EventEmitter();

// Hilfsobjekt zum vorzeitigen Abbrechen einer Benutzereingabe. Dieses wird
// benötigt, da das Programm beim Warten auf eine Benutzereingabe stehen
// bleibt, bis die Eingabe mit ENTER abgeschickt wurde. In der Zwischenzeit
// kann der Socket aber auf einen Fehler gelaufen sein, bei dem das Programm
// beendet werden soll.
let nutzereingabeAbbrechen = new AbortController();

// Flag, ob wir noch mit dem Server verbunden sind
let verbunden = false;

// Verbindung mit Server herstellen und Protokoll abwickeln
console.log(`Stelle Verbindung her zu ${TARGET_IP}:${TARGET_PORT}`);

let echoSocket = net.createConnection({host: TARGET_IP, port: TARGET_PORT}, async () => {

    echoSocket.setNoDelay();
    verbunden = true;

    console.log("Verbindung wurde hergestellt. Warte auf Begrüßung vom Server.");

    let ersteAntwortVomServer = await once(weiterwerfenEventEmitter, "dataWeitergeworfen");
    console.log("Server:", ersteAntwortVomServer[0]);

    // Auf Benutzereingabe warten
    const rl = readline.createInterface({input, output});

    while (verbunden) {

        let tastaturEingabe;

        try {
            tastaturEingabe = await rl.question("Ihre Eingabe (zum Beenden leer lassen): ",
                                        {signal: nutzereingabeAbbrechen.signal});
        } catch {
            // Benutzereingabe soll abgebrochen werden (ausgelöst in den Event Handlern unten)
        }

        if (!verbunden) break;

        // Daten an den Server schicken
        if (tastaturEingabe) {

            echoSocket.write(tastaturEingabe);

            // Antwort vom Server anzeigen
            let antwortVomServer = await once(weiterwerfenEventEmitter, "dataWeitergeworfen");
            console.log("Server:", antwortVomServer[0], "\n");

        } else {

            verbunden = false;
        }
    }

    // Verbindung trennen
    echoSocket.end();
    echoSocket.destroy();

    rl.close();
});


// Empfangene Daten an die Hauptschleife oben schicken ("weiterwerfen")
echoSocket.on("data", data => {

    data = data.toString();
    weiterwerfenEventEmitter.emit("dataWeitergeworfen", data);
});


// Fehler protokollieren
echoSocket.on("error", err => {

    // Benutzereingabe abbrechen
    nutzereingabeAbbrechen.abort();

    // Fehler anzeigen
    console.error("\n", err);

    // Programm beenden
    verbunden = false;
});


// Bei Verbindungsende das Programm beenden
echoSocket.on("end", () => verbunden = false);
