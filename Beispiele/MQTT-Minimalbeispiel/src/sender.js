import chalk   from "chalk";
import dotenv  from "dotenv";
import logging from "logging";
import mqtt    from "mqtt";
import process from "node:process";

const quotes = [
    "Er führt eine internationale Verbrecherbande.",
    "Bonnie soll sich das mal anschauen.",
    "Ich brauche den Turbo Boost! Jetzt!",
    "Was gibt es, Devon?",
    "Ich fahre gleich los und schaue mir das mal an.",
    "Michael!? Sie sollten aufhören, beim Fahren Computerspiele zu spielen.",
    "Er kommt. Ein Mann und sein Auto sorgen für Gerechtigkeit.",
    "Fortsetzung folgt ...",
    "Super Pursuit Mode, Kumpel.",
];

const logger = logging.default("sender");
dotenv.config();

logger.info(chalk.bold("Knight Rider -- Das Node.js Programm -- MQTT-Sender"));

logger.info(`Stelle Verbindung her zu ${process.env.MQTT_BROKER}`);

// Verbindung herstellen
const mqtt_client = await mqtt.connectAsync(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});


// Nachrichten senden
while (true) {
    const index = Math.floor(Math.random() * quotes.length);
    const quote = quotes[index];

    logger.info(`Sende an ${chalk.red(process.env.MQTT_PUBLISH_TOPIC)}: ${chalk.blue(quote)}`);
    await mqtt_client.publishAsync(process.env.MQTT_PUBLISH_TOPIC, quote);

    await new Promise(resolve => {
        setTimeout(resolve, 2000);
    });
}