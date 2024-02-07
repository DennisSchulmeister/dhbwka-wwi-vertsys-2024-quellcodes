/**
 * Speach-Server
 * =============
 * 
 * Liest auf der internen Soundkarte die Texte vor, die man ihm schickt.
 * Siehe README-Datei für eine Beschreibung des Protokolls. Der Tradition
 * früherer Internetprotokolle folgend implementiert der Server ein einfaches
 * textbasiertes Protokoll über TCP/IP.
 */
import * as dotenv from "dotenv";
import net         from "net";

import {Speach}    from "./speach.js";

// Serverkonfiguration aus Umgebungsvariablen oder .env-Datei lesen
dotenv.config();

const LISTEN_IP   = process.env.SAY_LISTEN_IP || "";
const LISTEN_PORT = parseInt(process.env.SAY_LISTEN_PORT) || 7000;

// Worker Thread für die Sprachausgabe starten
let speach = new Speach();

// Hilfsmethode für strukturierte Logausgaben
function log(socket, ...args) {
    if (socket) {
        let address = `Remote IP ${socket.remoteAddress}, Remote Port ${socket.remotePort}:`;
        console.log(new Date(), address, ...args);
    } else {
        console.log(new Date(), ...args);
    }
}

// Socket-Server starten
let server = net.createServer(socket => {
    // Verbindung mit neuem Client hergestellt
    socket.setEncoding("utf-8");
    socket.setNoDelay();

    log(socket, "Client connected");

    socket.on("data", data => {
        data = data.replace(/\s+$/g, "");
        let cmd = data.split(" ")[0];
        let val = data.split(" ").slice(1).join(" ");

        switch (cmd) {
            case "HELLO":
                // Begrüßung durch Client
                log(socket, "Send greeting");

                socket.write("HELLO\n");
                socket.write("COMMANDS: SAY some words, GET_STATUS, GET_QUEUE, BYE\n");
                break;

            case "SAY:":
                // Neuen Satz für die Sprachausgabe vormerken
                log(socket, `Say: ${val}`);

                speach.say(val);
                socket.write("CONFIRM");
            
                break;

            case "GET_STATUS":
                // Aktuellen Serverstatus liefern
                log(socket, "Get server status");

                let status = speach.speaking ? "speaking" : "waiting";
                socket.write(`SERVER_STATUS: ${status}\n`);
                break;

            case "GET_QUEUE":
                // Inhalt der Sprach-Queue zurückliefern
                log(socket, "Get queue");

                for (let text of speach.queue) {
                    socket.write(`QUEUE: ${text}\n`);
                }

                socket.write("QUEUE_END");
                break;

            case "BYE":
                // Verbindung trennen
                log(socket, "Client says goodbye");

                socket.end();
                return;

            default:
                // Unbekanntes Kommando
                log(socket, "Unknown command", cmd);
                socket.write("?!?\n");
                break;
        }
    });

    socket.on("error", err => log(socket, err));
    socket.on("close", () => log(socket, "Client disconnected"));
});

log(null, `Server listening on ${LISTEN_IP}:${LISTEN_PORT}`);
server.listen(LISTEN_PORT, LISTEN_IP);