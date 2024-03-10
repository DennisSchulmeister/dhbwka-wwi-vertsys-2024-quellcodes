import chalk      from "chalk";
import dotenv     from "dotenv";
import logging    from "logging";
import process    from "node:process";

import {Kafka}    from "kafkajs";
import {logLevel} from "kafkajs";

const logger = logging.default(`receiver ${process.argv[2] || ""}`.trim());
dotenv.config();

logger.info(chalk.bold("Knight Rider -- Das Node.js Programm -- Kafka-Empfänger"));

// Verbindung als Empfänger herstellen
const clientId = "Receiver-" + (Math.random() + 1).toString(36).substring(2);
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

const load_balancing = process.argv[3] === "lb";
const groupId        = load_balancing ? "group1" : clientId;                    // Empfänger mit derselben Group ID teilen sich die Nachrichten per Load Balancing
const kafka_consumer = kafka_client.consumer({groupId});

await kafka_consumer.connect();

// Nachrichten empfangen
const subscribe_topic = `${process.env.KAFKA_TOPIC || ""}`.trim();
logger.info(`Abonniere Topic ${chalk.red(subscribe_topic)} mit Group ID ${groupId}`);

await kafka_consumer.subscribe({
    topics: [subscribe_topic],
})

kafka_consumer.run({
    // Empfangene Nachrichten alle 5 Sekunden automatisch bestätigen
    autoCommitInterval: 5000,

    // Callback-Funktion für eine empfangene Nachricht
    eachMessage: async function({topic, partition, message}) {
        // Key/Value aus dem message-Objekt rausschälen
        let message1 = {
            key: message.key.toString(),
            value: message.value.toString(),
        }

        // Umwandlung in JSON-String für die Konsolenausgabe
        let message2 = JSON.stringify(message1);

        logger.info(`Empfange von ${chalk.red(topic)}, Partition ${chalk.red(partition)}: ${chalk.blue(message2)}`);
    },
});

