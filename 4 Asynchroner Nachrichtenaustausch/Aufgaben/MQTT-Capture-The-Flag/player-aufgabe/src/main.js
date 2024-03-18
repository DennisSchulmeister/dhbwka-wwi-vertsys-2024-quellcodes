import chalk           from "chalk";
import dotenv          from "dotenv";
import logging         from "logging";
import mqtt            from "mqtt";
import process         from "node:process";
import readlineSync    from "readline-sync";

const logger = logging.default(`player ${process.argv[2] || ""}`.trim());
dotenv.config();

logger.info(chalk.bold("Capture The Flag - Player"));

let playing = true;



// Bei Strg+C das Spiel sauber verlassen
process.on('SIGINT',  leave_game); // CTRL+C
process.on('SIGQUIT', leave_game); // Keyboard quit
process.on('SIGTERM', leave_game); // `kill` command

async function leave_game() {
    if (playing) {
        playing = false;
        // TODO: Hier leave-Nachricht schicken
    }

    setTimeout(() => process.exit(0), 1000);
}


/**
 * Hilfsfunktion zur Anzeige der empfangenen Spielerdaten auf der Konsole (als Ersatz für
 * den Webclient).
 * 
 * @param {object} player_status Empfangener Status des Spielers
 */
function print_player_status(player_status) {
    console.log();
    console.log(`STATUS - playing: ${player_status.playing}, crashed: ${player_status.crashed}, finished: ${player_status.finished}, all_flags: ${player_status.all_flags}`);
    console.log(`POSITION - lat: ${player_status.position.lat}, lon: ${player_status.position.lon}, alt: ${player_status.position.alt}, rot: ${player_status.position.rot}`);
    console.log(`SPEED - kmh_f: ${player_status.speed.kmh_f}, kmh_s: ${player_status.speed.kmh_s}, kmh_h: ${player_status.speed.kmh_h}`);
    console.log(`FLIGHT INPUT - forward: ${player_status.flight_input.forward}, sideward: ${player_status.flight_input.sideward}, height: ${player_status.flight_input.height}, rotation:: ${player_status.flight_input.rotation}, honk: ${player_status.flight_input.honk}`);
    console.log(`NEXT FLAG - nam: ${player_status.next_flag.data.nam}, DISTANCE - len: ${player_status.next_flag.distance.len}, lat: ${player_status.next_flag.distance.lat}, lon: ${player_status.next_flag.distance.lon}, alt: ${player_status.next_flag.distance.alt}, rot: ${player_status.next_flag.distance.rot}`);
}