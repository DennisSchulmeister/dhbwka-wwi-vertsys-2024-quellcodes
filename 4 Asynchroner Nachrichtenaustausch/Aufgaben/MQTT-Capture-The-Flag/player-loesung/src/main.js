import chalk           from "chalk";
import dotenv          from "dotenv";
import logging         from "logging";
import mqtt            from "mqtt";
import process         from "node:process";
import readlineSync    from "readline-sync";

const logger = logging.default(`player ${process.argv[2] || ""}`.trim());
dotenv.config();

logger.info(chalk.bold("Capture The Flag - Player"));

// Verbindung herstellen
logger.info(`Stelle Verbindung her zu ${process.env.MQTT_BROKER}`);

const mqtt_client = await mqtt.connectAsync(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});

if (!process.env.MQTT_TOPIC || !process.env.MQTT_TOPIC.trim()) {
    throw new Error("Umgebungsvariable MQTT_TOPIC ist nicht gesetzt!");
}

// Spielernamen abfragen
const player_name = readlineSync.question("Wie heißt du? ");
const player_id   = player_name + "-" + (Math.random() + 1).toString(36).substring(2);

readlineSync.question(`Okay, ${player_name}! Drücke ENTER, um das Spiel zu starten.`);

// Spiel beitreten
logger.info(`Verwende Player ID: ${player_id}`);

const topic_from_player = `${process.env.MQTT_TOPIC}/player/${player_id}`;
const topic_from_master = `${process.env.MQTT_TOPIC}/game-master/player/${player_id}`;

logger.info(`Abonniere Topic ${chalk.red(topic_from_master)}`);
await mqtt_client.subscribeAsync(topic_from_master);

let playing = true;

/**
 * Hilfsfunktion zum Senden einer Nachricht an den Game-Master
 * @param {any} message Inhalt der Nachricht
 */
async function send_message(message) {
    const topic   = topic_from_player;
    const payload = JSON.stringify(message, null, 4);

    logger.debug(`Sende an ${chalk.red(topic)}: ${chalk.blue(payload)}`);
    await mqtt_client.publishAsync(topic, payload);
}

await send_message({message: "join", name: player_name});

// Empfangene Nachrichten des Game-Masters
mqtt_client.on("message", async (topic, payload) => {
    if (!playing) return;

    try {
        ////////////////////////////////////////////////////////////////////////////////////
        logger.info(`Empfange von ${chalk.red(topic)}: ${chalk.blue(payload)}`);
        const message = JSON.parse(payload);

        switch (message?.message?.toString()?.toLowerCase()) {
            case "player-status": {
                fly_helicopter(message);
                break;
            }
        }
    } catch (error) {
        logger.error(error);
    }
});

/**
 * Logik zum Fliegen des Hubschraubers. Wertet die empfangenen Spielerdaten aus und versucht,
 * den Helikopter zur nächsten Flagge zu steuern.
 * 
 * @param {object} player_status Empfangener Status des Spielers
 */
async function fly_helicopter(player_status) {
    // Spiel beenden, wenn alle Flaggen eingesammelt wurden
    if (player_status.all_flags) {
        await send_message({message: "finish"});
        return;
    }

    const flight_input = player_status.flight_input;

    // Vorwärtsgeschwindigkeit anpassen
    flight_input.forward = player_status.next_flag.distance.len / 1000;
    flight_input.forward = Math.min(flight_input.forward, 1);
    flight_input.forward = Math.max(flight_input.forward, -1);

    // Drehung anpassen
    flight_input.rotation = player_status.next_flag.distance.rot / 360;

    // Höhe anpassen
    if (player_status.next_flag.distance.len <= 100) {
        if (player_status.next_flag.distance.alt > 0) {
            flight_input.height = -0.8;
        } else if (player_status.next_flag.distance.alt < 0) {
            flight_input.height = 0.4;
        } else {
            flight_input.height = 0;
        }
    } else if (player_status.position.alt < 200) {
        flight_input.height = 0.4;
    } else if (player_status.position.alt > 200) {
        flight_input.height = -0.2;
    } else {
        flight_input.height = 0;
    }

    // Hupen, wenn andere Spieler in der Nähe sind
    flight_input.honk = false;

    for (let other_player of player_status.nearest_players || []) {
        if (Math.abs(other_player.len) <= 100 && Math.abs(other_player.alt) <= 50) {
            flight_input.honk = true;
        }
    }

    // Steuereingaben an Game-Master schicken
    await send_message({message: "fly", ...flight_input});
}

// Bei Strg+C das Spiel sauber verlassen
process.on('SIGINT',  leave_game); // CTRL+C
process.on('SIGQUIT', leave_game); // Keyboard quit
process.on('SIGTERM', leave_game); // `kill` command

async function leave_game() {
    if (playing) {
        playing = false;
        await send_message({message: "leave"});
    }

    setTimeout(() => process.exit(0), 1000);
}