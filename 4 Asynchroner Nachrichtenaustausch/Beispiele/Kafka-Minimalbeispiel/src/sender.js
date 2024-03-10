import chalk      from "chalk";
import dotenv     from "dotenv";
import logging    from "logging";
import process    from "node:process";

import {Kafka}    from "kafkajs";
import {logLevel} from "kafkajs";

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

logger.info(chalk.bold("Knight Rider -- Das Node.js Programm -- Kafka-Sender"));

// Verbindung als Produzent herstellen
const clientId = "Sender-" + (Math.random() + 1).toString(36).substring(2);
logger.info(`Stelle Verbindung her zu kafka://${process.env.KAFKA_BROKER} mit Client ID ${clientId}`);

const kafka_client = new Kafka({
    clientId:              clientId,                                            // Zufällige Client Id, damit wir Sender und Empfänger mehrfach starten können
    brokers:               [process.env.KAFKA_BROKER],                          // Broker-URLs
    ssl:                   process.env.KAFKA_USE_SSL === "true",                // Verschlüsselte Verbindung ja/nein
    sasl:                  JSON.parse(process.env.KAFKA_AUTH_SASL || "{}"),     // Authentifizierung am Broker
    logLevel:              logLevel.ERROR,                                      // Automatische Log-Ausgaben des Kafka-Clients
    connectionTimeout:     5000,                                                // Verbindungs-Timeout
    authenticationTimeout: 5000,                                                // Anmelde-Timeout
});

const kafka_producer = kafka_client.producer();
await kafka_producer.connect();

logger.info("Verbindung wurde hergestellt!");

// Nachrichten senden
const publish_topic = `${process.env.KAFKA_TOPIC || ""}`.trim();

while (true) {
    const index = Math.floor(Math.random() * quotes.length);
    const quote = quotes[index];

    // Nachrichten müssen bei Kafka einen festen Aufbau haben!
    // Vgl. https://kafka.js.org/docs/producing#message-structure
    const message = {key: "KnightRider-Zitat", value: quote};

    logger.info(`Sende an ${chalk.red(publish_topic)}: ${chalk.blue(JSON.stringify(message))}`);

    await kafka_producer.send({
        topic:    publish_topic,
        messages: [message],
    });

    await new Promise(resolve => {
        setTimeout(resolve, 2000);
    });
}