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

// Hilfsmethode für strukturierte Logausgaben
function log(socket, ...args) {
    if (socket) {
        let address = `Remote IP ${socket.remoteAddress}, Remote Port ${socket.remotePort}:`;
        console.log(new Date(), address, ...args);
    } else {
        console.log(new Date(), ...args);
    }
}

// Serverkonfiguration aus Umgebungsvariablen oder .env-Datei lesen
dotenv.config();

const LISTEN_IP   = process.env.SAY_LISTEN_IP || "";
const LISTEN_PORT = parseInt(process.env.SAY_LISTEN_PORT) || 7000;

// Worker Thread für die Sprachausgabe starten
let speach = new Speach();

// Socket-Server starten
// Aus Kompatibilität mit Windows-Telnet senden wir \r\n als Zeilenende, anstatt nur \n
let server = net.createServer(socket => {
    // Verbindung mit neuem Client hergestellt
    log(socket, "Client connected");

    socket.setEncoding("utf-8");
    socket.setNoDelay();
    socket.write("CONNECTED! You need to say HELLO to me now.\r\n");

    socket.on("error", err => log(socket, err));
    socket.on("close", () => log(socket, "Client disconnected"));

    let lineBuffer = "";

    function handleLine(line) {
        line = line.replaceAll("\r", "");
        line = line.replaceAll("\n", "");

        let cmd = line.split(" ")[0];
        let val = line.split(" ").slice(1).join(" ");

        switch (cmd) {
            case "HELLO":
                // Begrüßung durch Client
                log(socket, "Send greeting");

                socket.write("HELLO\r\n");
                socket.write("COMMANDS:  SAY: some words,  GET_STATUS,  GET_QUEUE,  BYE\r\n");
                break;

            case "SAY:":
                // Neuen Satz für die Sprachausgabe vormerken
                log(socket, `Say: ${val}`);

                speach.say(val);
                socket.write("CONFIRM\r\n");
            
                break;

            case "GET_STATUS":
                // Aktuellen Serverstatus liefern
                log(socket, "Get server status");

                let status = speach.speaking ? "speaking" : "waiting";
                socket.write(`SERVER_STATUS: ${status}\r\n`);
                break;

            case "GET_QUEUE":
                // Inhalt der Sprach-Queue zurückliefern
                log(socket, "Get queue");

                for (let text of speach.queue) {
                    socket.write(`QUEUE: ${text}\r\n`);
                }

                socket.write("QUEUE_END\r\n");
                break;

            case "BYE":
                // Verbindung trennen
                log(socket, "Client says goodbye");

                socket.end();
                socket.destroy();
                return;

            default:
                // Unbekanntes Kommando
                log(socket, "Unknown command", cmd);
                socket.write("?!?\r\n");
                break;
        }
    }
    
    socket.on("data", data => {
        // ACHTUNG: Je nach Client kann es vorkommen, dass wir ganze Zeile geschickt bekommen oder
        // nur einzelne Zeichen. Deshalb werden die empfangenen Daten hier so lange gepuffert, bis
        // ein Zeilenende empfangen wurde. Denn insbesondere telnet unter Windows sendet standardmäßig
        // jeden Tastendruck einzeln und wartet nicht darauf, dass ENTER gedrückt wird.
        lineBuffer += data;

        if (lineBuffer.includes("\n")) {
            for (let line of lineBuffer.split("\n")) {
                if (line) handleLine(line);
            }

            lineBuffer = "";
        }
    });
});

log(null, `Server listening on ${LISTEN_IP}:${LISTEN_PORT}`);
server.listen(LISTEN_PORT, LISTEN_IP);