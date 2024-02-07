/**
 * Echo-Server
 * ===========
 * 
 * Schickt eine kleine Begrüßung an jeden Client und sendet sonst einfach nur die
 * Daten zurück, die vom Client empfangen werden.
 */
import * as dotenv from "dotenv";
import net         from "net";

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
const LISTEN_PORT = parseInt(process.env.SAY_LISTEN_PORT) || 7001;

// Socket-Server starten
let server = net.createServer(socket => {
    // Verbindung mit neuem Client hergestellt
    log(socket, "Client verbunden");

    socket.setEncoding("utf-8");
    socket.setNoDelay();
    socket.write("Hallo! Ich bin der Echo-Server. Schicke mir Daten und ich schicke sie dir zurück.\n");

    socket.on("error", err => log(socket, err));
    socket.on("close", () => log(socket, "Client getrennt"));

    socket.on("data", data => {
        log(socket, "Empfangene Daten:", data);
        socket.write(data);
    });
});

log(null, `Server lauscht auf ${LISTEN_IP}:${LISTEN_PORT}`);
server.listen(LISTEN_PORT, LISTEN_IP);