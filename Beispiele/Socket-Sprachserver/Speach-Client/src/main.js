/**
 * Speach-Client
 * =============
 * 
 * Kommuniziert über ein einfaches zeilenbasiertes Protokoll mit dem Speach-Server
 * auf TCP/IP Port 7000. Sendet dem Server Texte zum Vorlesung und hilft dabei,
 * seinen Status abzufragen.
 */
import net                from "net";
import * as dotenv        from "dotenv";

import * as readline      from 'node:readline/promises';
import {stdin as input}   from 'node:process';
import {stdout as output} from 'node:process';

import {EventEmitter}     from 'node:events';
import {once}             from 'node:events';

dotenv.config();
const LISTEN_IP   = process.env.SAY_LISTEN_IP || "";
const LISTEN_PORT = parseInt(process.env.SAY_LISTEN_PORT) || 7000;

// Hilfsobjekt, um die empfangenen Daten aus dem Event Handler ganz unten
// an die Programmlogik in der Hauptschleife zu senden. Bei Empfang von
// neuen Daten wird mit diesem Objekt ein Event ausgelöst, auf das an den
// richtigen Stellen in der Hauptschleife gewartet wird.
//
// Hier zeigt sich die Komplexität der asynchronen Programmierung. :-)
// Zum Glück werden async/await im selben Thread wie der Rest ausgeführt, nur
// eben zu einem späteren Zeitpunkt. Sonst wäre die Synchronisation noch komplizierter.
let dataReceived = new EventEmitter();

// Weitere Hilfsvariablen
let connected      = false;
let abortUserInput = new AbortController();
let finished       = false;

// Verbindung mit Server herstellen und Protokoll abwickeln
console.log(`Connecting to ${LISTEN_IP}:${LISTEN_PORT}`);

let socket = net.createConnection({host: LISTEN_IP, port: LISTEN_PORT}, async () => {
    socket.setNoDelay();
    connected = true;

    console.log("Connection successful!");
    console.log("Waiting for server greeting.");

    // Begrüßungen austauschen
    socket.write("HELLO\n");
    let response = await once(dataReceived, "data");

    if (!response[0].startsWith("HELLO")) {
        console.error("Unexpected server response:", response);
        return;
    }

    const rl = readline.createInterface({input, output});

    while (connected) {
        // Menü anzeigen und Benutzereingabe abwarten
        console.log("");
        console.log("=========");
        console.log("MAIN MENU");
        console.log("=========");
        console.log("");
        console.log("  [1] Say something");
        console.log("  [2] Get server status");
        console.log("  [3] Get queued messages");
        console.log("  [Q] Quit");
        console.log("");

        let choice     = "";

        try {
            choice = await rl.question("Your choice: ", {signal: abortUserInput.signal});
        } catch {
            // Benutzereingabe soll abgebrochen werden (ausgelöst in den Event Handlern unten)
        }

        // Benutzereingabe auswerten und mit Server reden
        switch (choice) {
            case "1":
                // Text vorlesen
                try {
                    let text = await rl.question("Message to say: ", {signal: abortUserInput.signal});
                    socket.write(`SAY: ${text}\n`);
                } catch {
                    // Benutzereingabe soll abgebrochen werden (ausgelöst in den Event Handlern unten)
                }

                break;

            case "2":
                // Serverstatus abfragen
                socket.write("GET_STATUS\n");
                response = await once(dataReceived, "data");

                if (response[0].startsWith("SERVER_STATUS:")) {
                    let status = response[0].slice(14).trim();
                    console.log(`Server status: ${status}`);
                }

                break;

            case "3":
                // Warteschlange auf dem Server abfragen
                socket.write("GET_QUEUE\n");

                finished = false;

                while (!finished) {
                    response = await once(dataReceived, "data");

                    for (let line of response[0].split("\n")) {
                        if (line.startsWith("QUEUE:")) {
                            console.log(` - ${line.slice(6).trim()}`);
                        } else if (line === "QUEUE_END") {
                            finished = true;
                        }
                    }
                }

                break;

            case "Q":
            case "q":
                // Leave program
                connected = false;
                socket.write("BYE\n");
                break;

            case "":
                break;
            default:
                console.log("Invalid choice. Please retry.");
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
    abortUserInput.abort();
    console.error("\n", err)
});

// Bei Verbindungsende das Programm beenden
socket.on("end", () => connected = false);
