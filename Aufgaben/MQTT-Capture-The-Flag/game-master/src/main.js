import game_logic      from "./game-logic.js";
import {get_timestamp} from "./utils.js";

import chalk           from "chalk";
import dotenv          from "dotenv";
import logging         from "logging";
import mqtt            from "mqtt";
import process         from "node:process";

const logger = logging.default(`game-master ${process.argv[2] || ""}`.trim());
dotenv.config();

logger.info(chalk.bold("Capture The Flag - Game Master"));

// Verbindung herstellen
logger.info(`Stelle Verbindung her zu ${process.env.MQTT_BROKER}`);

const mqtt_client = await mqtt.connectAsync(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});

if (!process.env.MQTT_TOPIC || !process.env.MQTT_TOPIC.trim()) {
    throw new Error("Umgebungsvariable MQTT_TOPIC ist nicht gesetzt!");
}

const topic_from_client = `${process.env.MQTT_TOPIC}/client`;
const topic_from_player = `${process.env.MQTT_TOPIC}/player`;
const topic_from_master = `${process.env.MQTT_TOPIC}/game-master`;

logger.info(`Abonniere Topic ${chalk.red(topic_from_client)}/#`);
await mqtt_client.subscribeAsync(`${topic_from_client}/#`);

logger.info(`Abonniere Topic ${chalk.red(topic_from_player)}/#`);
await mqtt_client.subscribeAsync(`${topic_from_player}/#`);

// Empfangene Nachrichten der Webclients und Spieler verarbeiten
mqtt_client.on("message", async (topic, payload) => {
    try {
        ////////////////////////////////////////////////////////////////////////////////////
        logger.debug(`Empfange von ${chalk.red(topic)}: ${chalk.blue(payload)}`);

        if (topic.startsWith(topic_from_client)) {
            const client  = topic.split("/").slice(-1)[0];
            const message = JSON.parse(payload);

            await handle_client_message(client, message);
        } else if (topic.startsWith(topic_from_player)) {
            const player  = topic.split("/").slice(-1)[0];
            const message = JSON.parse(payload);

            await handle_player_message(player, message);
        }

    } catch (error) {
        console.error(error);
    }
});

// Regelmäßig den Spielstand aktualisieren und versenden
const delay   = 1000 / parseInt(process.env.GAME_FPS || 2);
const timeout = parseInt(process.env.PLAYER_TIMEOUT || 60) * 1000;

while (true) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const timestamp = get_timestamp();

    for (const player_id of game_logic.players.keys()) {
        try {
            let player = game_logic.update_player(player_id);

            if ((timestamp - player.last_seen) >= timeout) {
                // Spieler nach zu langer Inaktivität entfernen, bspw. weil das Programm abgestürzt ist
                player = game_logic.leave_game(player.id);
            }
    
            await send_message("player", player.id, {
                message: "player-status",
                ...player,
            });
        } catch (error) {
            console.error(error);
            game_logic.leave_game(player_id);
        }
    }
}

/**
 * Empfangene Nachrichten von den Webclients verarbeiten.
 * 
 * @param {string} client_id ID des Clients
 * @param {any} message Inhalt der Nachricht
 */
async function handle_client_message(client_id, message) {
    try {
        const request = message?.request?.toString()?.toLowerCase();

        switch (request) {
            case "get-flag-locations": {
                await send_message("client", client_id, {
                    message: "flag-locations",
                    flags:   game_logic.flags,
                });

                break;
            }
            case "get-weapon-info": {
                await send_message("client", client_id, {
                    message: "weapon-info",
                    ...game_logic.weapons,
                });
            }
        }
    } catch (error) {
        console.error(error);

        await send_message("client", client_id, {
            message: "error",
            error:   error.code || "ERROR",
            text:    error.toString() || "Ein Fehler ist aufgetreten",
        });
    }
}

/**
 * Empfangene Nachrichten von den Spielern abwickeln.
 * 
 * @param {string} player_id ID des Spielers
 * @param {any} message Inhalt der Nachricht
 */
async function handle_player_message(player_id, message) {
    try {
        const event = message?.message?.toString()?.toLowerCase();
        
        switch (event) {
            case "join": {
                const player_name = message?.name?.toString();
                game_logic.join_game(player_id, player_name);

                await send_message("player", player_id, {
                    message: "weapon-info",
                    ...game_logic.weapons,
                });

                break;
            }
            case "fly": {
                game_logic.touch_player(player_id);
                game_logic.change_flight_input(player_id, message);
                break;
            }
            case "attack": {
                game_logic.touch_player(player_id);
                game_logic.attack_other_player(player_id, message);
                break;
            }
            case "finish": {
                game_logic.touch_player(player_id);
                game_logic.finish_game(player_id);
                break;
            }
            case "leave": {
                game_logic.touch_player(player_id);
                game_logic.leave_game(player_id);
                break;
            }
            case "ping": {
                game_logic.touch_player(player_id);
                break;
            }
        }
    } catch (error) {
        console.error(error);

        await send_message("player", player_id, {
            message: "error",
            error:   error.code || "ERROR",
            text:    error.toString() || "Ein Fehler ist aufgetreten",
        });
    }
}

/**
 * Hilfsfunktion zum Senden einer Nachricht an einen Client oder Spieler.
 * 
 * @param {string} type Art des Empfängers: "client" oder "player"
 * @param {string} id ID des Empfängers
 * @param {any} message Inhalt der Nachricht
 */
async function send_message(type, id, message) {
    const topic = `${topic_from_master}/${type}/${id}`;
    const payload = JSON.stringify(message, null, 4);

    logger.debug(`Sende an ${chalk.red(topic)}: ${chalk.blue(payload)}`);
    await mqtt_client.publishAsync(topic, payload);
}
