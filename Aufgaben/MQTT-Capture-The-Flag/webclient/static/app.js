const MQTT_BROKER_URL = "wss://mqtt.zimolong.eu/";
const MQTT_USERNAME   = "dhbw";
const MQTT_PASSWORD   = "dhbw";
const MQTT_CLIENT_ID  = "client-" + (Math.random() + 1).toString(36).substring(2);

const MQTT_TOPIC_FROM_CLIENT = `vorlesung/catch-the-flag/client/${MQTT_CLIENT_ID}`;
const MQTT_TOPIC_TO_CLIENT   = `vorlesung/catch-the-flag/game-master/client/${MQTT_CLIENT_ID}`;
const MQTT_TOPIC_TO_PLAYERS  = "vorlesung/catch-the-flag/game-master/player/#";

/**
 * Hauptklasse unser kleinen Anwendung.
 */
class MyApplication {
    /**
     * Konstruktor. Besorgt sich die HTML-Elemente und startet die Anwendung.
     */
    constructor() {
        // Karte
        this.map = new MyMap("#map");

        // MQTT-Broker
        this.mqttClient = undefined;
        this.connected  = false;
        this.error      = "";
        
        this.players = {};
        this.followPlayerId = "";
        this.removeStalePlayers();

        // UI-Status: Verbindung herstellen
        this.windowConnect   = document.getElementById("window-connect");
        this.inputBrokerUrl  = this.windowConnect.querySelector(".broker-url");
        this.inputUsername   = this.windowConnect.querySelector(".username");
        this.inputPassword   = this.windowConnect.querySelector(".password");
        this.divErrorMessage = this.windowConnect.querySelector(".error-message");

        this.inputBrokerUrl.value = MQTT_BROKER_URL;
        this.inputUsername.value  = MQTT_USERNAME;
        this.inputPassword.value  = MQTT_PASSWORD;

        this.buttonConnect = document.getElementById("button-connect");
        this.buttonConnect.addEventListener("click", this.connect.bind(this));
        
        // UI-Status: Verbunden mit Server
        this.windowConnected = document.getElementById("window-connected");

        this.buttonDisconnect = document.getElementById("button-disconnect");
        this.buttonDisconnect.addEventListener("click", this.disconnect.bind(this));

        this.playerNames   = document.querySelector("#player-names");
        this.playerDetails = document.querySelector("#player-details");
    }

    /**
     * Verbindung zum MQTT-Broker herstellen.
     */
    async connect() {
        const brokerUrl = this.inputBrokerUrl.value.trim();
        const username  = this.inputUsername.value.trim();
        const password  = this.inputPassword.value.trim();

        if (!brokerUrl) {
            this.error = "Bitte Broker-URL eingeben!";
        }

        try {
            if (!this.error) {
                console.log(`Verbindung herstellen zu ${brokerUrl}`);

                this.mqttClient = await mqtt.connectAsync(brokerUrl, {username, password});
                this.connected = true;

                // Topics abonnieren
                console.log(`Abonniere Topic: ${MQTT_TOPIC_TO_CLIENT}`);
                await this.mqttClient.subscribeAsync(MQTT_TOPIC_TO_CLIENT);

                console.log(`Abonniere Topic: ${MQTT_TOPIC_TO_PLAYERS}`);
                await this.mqttClient.subscribeAsync(MQTT_TOPIC_TO_PLAYERS);

                this.mqttClient.on("message", this.onMqttMessage.bind(this));


                // Standort der Flaggen anfordern
                await this.sendMqttMessage({request: "get-flag-locations"});
            }
        } catch (err) {
            this.error = err.toString();
            this.connected = false;
        }

        this.switchVisibleElements();
    }

    /**
     * Verbindung mit dem MQTT-Broker trennen.
     */
    async disconnect() {
        console.log("Verbindung trennen");

        if (this.mqttClient) {
            await this.mqttClient.endAsync();
        }

        this.mqttClient     = null;
        this.connected      = false;
        this.players        = {};
        this.followPlayerId = "";

        this.map.reset();
        this.switchVisibleElements();
    }

    /**
     * Sichtbare Elemente umschalten, je nach Verbindungsstatus.
     */
    switchVisibleElements() {
        this.windowConnect.classList.add("hidden");
        this.windowConnected.classList.add("hidden");

        if (!this.connected) {
            this.windowConnect.classList.remove("hidden");
        } else {
            this.windowConnected.classList.remove("hidden");
        }

        if (this.error) {
            this.divErrorMessage.textContent = this.error;
            this.divErrorMessage.classList.remove("hidden");
        } else {
            this.divErrorMessage.textContent = "";
            this.divErrorMessage.classList.add("hidden");
        }

        if (!this.followPlayerId) {
            this.playerDetails.classList.add("hidden");
        } else {
            this.playerDetails.classList.remove("hidden");
        }
    }

    /**
     * Hilfsfunktion zum Senden einer Nachricht
     * @param {Object} message Inhalt der Nachricht
     */
    async sendMqttMessage(message) {
        const json = JSON.stringify(message);
        // console.debug(`Sende an ${MQTT_TOPIC}: ${json}`);

        await this.mqttClient.publishAsync(MQTT_TOPIC_FROM_CLIENT, json);
    }

    /**
     * Callback-Funktion für empfangene MQTT-Nachricht.
     * 
     * @param {string} topic Topic der Nachricht
     * @param {string} payload Inhalt der Nachricht
     */
    async onMqttMessage(topic, payload) {
        ///////////////////////////////////
        //console.debug(`Empfange von ${topic}: ${payload}`);
        
        const message = JSON.parse(payload);

        switch (message?.message?.toString()?.toLowerCase()) {
            case "flag-locations": {
                for (const flagId in message?.flags || []) {
                    const flag = message.flags[flagId];
                    this.map.setFlagPosition(flagId, flag);
                }

                break;
            }
            case "player-status": {
                if (message.id) {
                    this.players[message.id] = message;
                    this.updatePlayerDisplay(message.id);
                }

                break;
            }
        }
    }

    /**
     * Fremde Spieler entfernen, wenn sie mehr als 30 Sekunden inaktiv waren.
     */
    removeStalePlayers() {
        const now = new Date().valueOf();

        for (const playerId of Object.keys(this.players)) {
            const player = this.players[playerId];
            const lastSeen = player.last_seen || null;

            if (!lastSeen || (now - lastSeen) > 30000) {
                delete this.players[playerId];
                this.map.removePlayer(playerId);
            }
        }

        window.setTimeout(this.removeStalePlayers.bind(this), 5000);
    }

    /**
     * Angezeigte Daten zu einem Spieler aktualisieren. Ändert seine Position auf der Karten und
     * blendet seine Details ein, falls der Spieler aus aktuell verfolgter Spieler ausgewählt wurde.
     * Rendert auch die Liste aller Spieler neu.
     */
    updatePlayerDisplay(playerId) {
        // Liste aller Spieler neurendern
        this.playerNames.innerHTML = "";

        for (const playerId of Object.keys(this.players)) {
            const player = this.players[playerId];

            const divElement = document.createElement("div");
            this.playerNames.appendChild(divElement);

            divElement.innerHTML = player.name || player.id || "Unbekannter Spieler";
            divElement.classList.add("clickable");

            if (player.id === this.followPlayerId) {
                divElement.classList.add("active");
            }

            divElement.addEventListener("click", () => {
                if (player.id === this.followPlayerId) {
                    console.log("Folge keinem Spieler mehr");

                    this.followPlayerId = "";
                    divElement.classList.remove("active");
                } else {
                    console.log(`Folge dem Spieler ${player.name} mit Id ${player.id}`);

                    this.followPlayerId = player.id;
                    divElement.classList.add("active");
                }

                this.switchVisibleElements();
            });
        }

        // Spielfiguren auf der Karte platzieren
        const player = this.players[playerId];
        if (!player) return;

        const following = player.id === this.followPlayerId;

        if (player.left_game) {
            this.map.removePlayer(player.id);
        } else {
            this.map.setPlayerPosition(player, following);
        }

        // Karte um den ausgewählten Spieler zentrieren
        if (following) this.map.followPlayer(player);
        if (!this.followPlayerId) this.map.unfollowPlayer();

        // Details zum ausgewählten Spieler rendern
        if (following) {
            this.displayDetailValue(player?.health, ".health");
            this.displayDetailValue(player?.position?.lon, ".lon");
            this.displayDetailValue(player?.position?.lat, ".lat");
            this.displayDetailValue(player?.position?.alt, ".alt");
            this.displayDetailValue(player?.position?.rot, ".rot");
            this.displayDetailValue(player?.speed?.kmh_f, ".kmh_f");
            this.displayDetailValue(player?.speed?.kmh_s, ".kmh_s");
            this.displayDetailValue(player?.speed?.kmh_h, ".kmh_h");
            this.displayDetailValue(player?.flight_input?.forward, ".forward");
            this.displayDetailValue(player?.flight_input?.sideward, ".sideward");
            this.displayDetailValue(player?.flight_input?.height, ".height");
            this.displayDetailValue(player?.flight_input?.rotation, ".rotation");
            this.displayDetailValue(player?.flight_input?.honk, ".honk");
            this.displayDetailValue(player?.next_flag?.data?.nam, ".next_flag_nam");
            this.displayDetailValue(player?.next_flag?.distance?.len, ".next_flag_d_len");
            this.displayDetailValue(player?.next_flag?.distance?.alt, ".next_flag_d_alt");
            this.displayDetailValue(player?.next_flag?.distance?.rot, ".next_flag_d_rot");
        }
    }

    /**
     * Detailwert zu Spieler anzeigen
     * @param {any} value Anzuzeigender Wert
     * @param {string} selector CSS-Selektor im #player-details
     */
    displayDetailValue(value, selector) {
        let span = this.playerDetails.querySelector(selector);
        if (!span) return
        span.textContent = value ? value.toString() : "";
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new MyApplication();
});