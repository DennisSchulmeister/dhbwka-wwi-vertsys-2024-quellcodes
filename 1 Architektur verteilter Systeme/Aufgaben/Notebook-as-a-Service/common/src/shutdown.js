import {createHttpTerminator} from "http-terminator";

/**
 * Dieses Funktion sorgt dafür, dass der Webservier sauber heruntergefahren werden kann,
 * wenn ihm das SIGTERM oder SIGINT-Signal vom Betriebssystem geschickt wird. Diese werden
 * häufig in folgenden Fällen gesendet:
 * 
 *  - SIGTERM: Von Prozessmanagern für Node.js-Anwendungen und manchen Cloud-Umgebungen,
 *    wenn der Prozess beendet werden soll.
 * 
 *  - SIGINT: Wenn auf der Konsole Strg+C gedrückt wird.
 * 
 * Hier wird dann dafür gesorgt, dass der Server keine neuen Verbindungen mehr annimmt,
 * aber die bestehenden Verbindungen noch zu Ende bearbeitet (sog. Graceful Shutdown).
 * Das Problem dabei ist allerdings, dass seit HTTP 1.1 die Socketverbindung zum Server
 * offen gehalten werden, auch wenn aktuell keine Daten vom Server abgerufen werden.
 * In diesem Fall würde der Server hier aber "hängen" bleiben, bis der Browser die
 * Verbindung tatsächlich schließt. Um dies zu verhindern, wird ein Timeout von zwei
 * Sekunden festgelegt. Jede Verbindung, die zwei Sekunden nach Beginn des Shutdowns
 * immer noch offen ist, wird hart getrennt.
 * 
 * @param {logging.Logger} logger Logger für Konsolenausgaben
 * @param {Express.Server} server Express Webserver
 */
export function allowGracefulShutdown({logger, server} = {}) {
    const httpTerminator = createHttpTerminator({
        server: server,
        gracefulTerminationTimeout: 2000,   // Millisekunden
    });
    
    async function signalHandler() {
        console.log();
        logger.info("Server Shutdown. Keine neuen Verbindungen mehr möglich.");
    
        await httpTerminator.terminate();
    
        logger.info("Server wurde beendet!");
    };
    
    process.on("SIGTERM", signalHandler);
    process.on("SIGINT",  signalHandler);
}