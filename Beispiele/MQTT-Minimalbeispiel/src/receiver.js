import chalk   from "chalk";
import dotenv  from "dotenv";
import logging from "logging";
import mqtt    from "mqtt";
import process from "node:process";

const logger = logging.default(`receiver ${process.argv[2] || ""}`.trim());
dotenv.config();

logger.info(chalk.bold("Knight Rider -- Das Node.js Programm -- MQTT-Empfänger"));

logger.info(`Stelle Verbindung her zu ${process.env.MQTT_BROKER}`);

// Verbindung herstellen
const mqtt_client = await mqtt.connectAsync(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});

// Nachrichten empfangen
const load_balancing = process.argv[3] === "lb";
const topic = load_balancing ? process.env.MQTT_SUBSCRIBE_TOPIC_LB : process.env.MQTT_SUBSCRIBE_TOPIC;

logger.info(`Abonniere Topic ${chalk.red(topic)}`);
await mqtt_client.subscribeAsync(topic);

mqtt_client.on("message", (topic, payload) => {
    logger.info(`Empfange von ${chalk.red(topic)}: ${chalk.blue(payload)}`);
});

