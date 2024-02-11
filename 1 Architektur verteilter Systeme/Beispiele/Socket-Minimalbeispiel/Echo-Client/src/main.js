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


// Serverkonfiguration aus Umgebungsvariablen oder .env-Datei lesen
dotenv.config();

const DEFAULT_PORT = 7001;

const LISTEN_IP   =          process.env.ECHO_LISTEN_IP    || "";
const LISTEN_PORT = parseInt(process.env.ECHO_LISTEN_PORT) || DEFAULT_PORT;

// Hilfsobjekt, um die empfangenen Daten aus dem Event Handler ganz unten
// an die Programmlogik in der Hauptschleife zu senden. Bei Empfang von
// neuen Daten wird mit diesem Objekt ein Event ausgelöst, auf das an den
// richtigen Stellen in der Hauptschleife gewartet wird.
//
// Hier zeigt sich die Komplexität der asynchronen Programmierung. :-)
// Zum Glück werden async/await im selben Thread wie der Rest ausgeführt, nur
// eben zu einem späteren Zeitpunkt. Sonst wäre die Synchronisation noch komplizierter.
let dataReceived = new EventEmitter();

// Hilfsobjekt zum vorzeitigen Abbrechen einer Benutzereingabe. Dieses wird
// benötigt, da das Programm beim Warten auf eine Benutzereingabe stehen
// bleibt, bis die Eingabe mit ENTER abgeschickt wurde. In der Zwischenzeit
// kann der Socket aber auf einen Fehler gelaufen sein, bei dem das Programm
// beendet werden soll.
let abortUserInput = new AbortController();

// Flag, ob wir noch mit dem Server verbunden sind
let connected = false;

// Verbindung mit Server herstellen und Protokoll abwickeln
console.log(`Stelle Verbindung her zu ${LISTEN_IP}:${LISTEN_PORT}`);

let socket = net.createConnection({host: LISTEN_IP, port: LISTEN_PORT}, async () => {
    socket.setNoDelay();
    connected = true;

    console.log("Verbindung wurde hergestellt. Warte auf Begrüßung vom Server.");

    let greeting = await once(dataReceived, "data");
    console.log("Server:", greeting[0]);

    // Auf Benutzereingabe warten
    const rl = readline.createInterface({input, output});

    while (connected) {
        let input;

        try {
            input = await rl.question("Ihre Eingabe (zum Beenden leer lassen): ", {signal: abortUserInput.signal});
        } catch {
            // Benutzereingabe soll abgebrochen werden (ausgelöst in den Event Handlern unten)
        }

        if (!connected) break;

        // Daten an den Server schicken
        if (input) {
            socket.write(input);
    
            // Antwort vom Server anzeigen
            let response = await once(dataReceived, "data");
            console.log("Server:", response[0], "\n");
        } else {
            connected = false;
        }
    }

    // Verbindung trennen
    socket.end();
    socket.destroy();

    rl.close();
});


// Empfangene Daten an die Hauptschleife oben schicken
socket.on("data", data => {
    data = data.toString();
    dataReceived.emit("data", data);
});

// Fehler protokollieren
socket.on("error", err => {
    // Benutzereingabe abbrechen
    abortUserInput.abort();

    // Fehler anzeigen
    console.error("\n", err);

    // Programm beenden
    connected = false;
});

// Bei Verbindungsende das Programm beenden
socket.on("end", () => connected = false);