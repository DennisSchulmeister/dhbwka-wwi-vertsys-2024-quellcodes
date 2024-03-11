const MQTT_BROKER_URL = "wss://mqtt.zimolong.eu/";
const MQTT_USERNAME   = "dhbw";
const MQTT_PASSWORD   = "dhbw";
const MQTT_TOPIC      = "vorlesung/landkarte";

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
        this.map.on("click", this.onMapClick.bind(this));

        // MQTT-Broker
        this.mqttClient = undefined;
        this.connected  = false;
        this.error      = "";
        this.realname   = "";
        this.lonLat     = [];
        this.status     = "";

        this.otherAvatars = {};
        this.removeStaleAvatars();

        // UI-Status: Verbindung herstellen
        this.windowConnect   = document.getElementById("window-connect");
        this.inputBrokerUrl  = this.windowConnect.querySelector(".broker-url");
        this.inputUsername   = this.windowConnect.querySelector(".username");
        this.inputPassword   = this.windowConnect.querySelector(".password");
        this.inputRealname   = this.windowConnect.querySelector(".realname");
        this.divErrorMessage = this.windowConnect.querySelector(".error-message");

        this.inputBrokerUrl.value = MQTT_BROKER_URL;
        this.inputUsername.value  = MQTT_USERNAME;
        this.inputPassword.value  = MQTT_PASSWORD;

        this.buttonConnect = document.getElementById("button-connect");
        this.buttonConnect.addEventListener("click", this.connect.bind(this));
        
        // UI-Status: Verbunden mit Server
        this.windowConnected = document.getElementById("window-connected");
        this.hintPlaceMarker = document.getElementById("place-marker-hint");

        this.inputStatus     = document.querySelector("#panel-status-input .status");
        this.inputStatus.addEventListener("keyup", this.onStatusInput.bind(this));

        this.buttonDisconnect = document.getElementById("button-disconnect");
        this.buttonDisconnect.addEventListener("click", this.disconnect.bind(this));
    }

    /**
     * Verbindung zum MQTT-Broker herstellen.
     */
    async connect() {
        const brokerUrl = this.inputBrokerUrl.value.trim();
        const username  = this.inputUsername.value.trim();
        const password  = this.inputPassword.value.trim();
        const realname  = this.inputRealname.value.trim();

        if (!brokerUrl) {
            this.error = "Bitte Broker-URL eingeben!";
        } else if (!realname) {
            this.error = "Bitte echten Namen eingeben!";
        }

        try {
            if (!this.error) {
                console.log(`Verbindung herstellen zu ${brokerUrl}`);

                this.mqttClient = await mqtt.connectAsync(brokerUrl, {username, password});
                this.connected = true;
                this.realname  = realname;

                await this.mqttClient.subscribeAsync(MQTT_TOPIC);
                this.mqttClient.on("message", this.onMqttMessage.bind(this));

                await this.broadcastStatus();
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
            await this.sendMqttMessage({
                realname:   this.realname,
                disconnect: true,
            });

            await this.mqttClient.endAsync();
        }

        this.mqttClient   = null;
        this.connected    = false;
        this.realname     = "";
        this.lonLat       = [];
        this.status       = "";
        this.otherAvatars = {};

        this.inputStatus.value = "";
        this.hintPlaceMarker.classList.remove("hidden");

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
    }

    /**
     * Klick auf die Karte.
     * @param {Object} event Klick-Event
     */
    async onMapClick(event) {
        if (!this.mqttClient || !this.connected) return;
        
        this.hintPlaceMarker.classList.add("hidden");

        this.lonLat = ol.proj.toLonLat(event.coordinate);
        this.map.setOwnPosition(this.realname, this.lonLat);
        this.map.setOwnStatus(this.status);

        await this.sendMqttMessage({
            realname: this.realname,
            lonLat:   this.lonLat,
        });
    }

    /**
     * Eigenen Status aktualisieren
     */
    async onStatusInput() {
        this.status = this.inputStatus.value.trim();
        this.map.setOwnStatus(this.status);

        await this.sendMqttMessage({
            realname: this.realname,
            status:   this.status,
        });
    }

    /**
     * Regelmäßig eigenen Status senden, damit neue Teilnehmer ihn bekommen.
     */
    async broadcastStatus() {
        if (!this.mqttClient || !this.connected) return;

        if (this.lonLat.length) {
            await this.sendMqttMessage({
                realname: this.realname,
                lonLat:   this.lonLat,
                status:   this.status,
            });
        }

        window.setTimeout(this.broadcastStatus.bind(this), 1000);
    }

    /**
     * Hilfsfunktion zum Senden einer Nachricht
     * @param {Object} message Inhalt der Nachricht
     */
    async sendMqttMessage(message) {
        const json = JSON.stringify(message);
        // console.debug(`Sende an ${MQTT_TOPIC}: ${json}`);

        await this.mqttClient.publishAsync(MQTT_TOPIC, json);
    }

    /**
     * Callback-Funktion für empfangene MQTT-Nachricht.
     * 
     * @param {string} topic Topic der Nachricht
     * @param {string} payload Inhalt der Nachricht
     */
    async onMqttMessage(topic, payload) {
        // console.debug(`Empfange von ${topic}: ${payload}`);
        
        const message = JSON.parse(payload);
        if (!message.realname || message.realname === this.realname) return;

        if (message.lonLat) {
            this.map.setOtherPosition(message.realname, message.lonLat);
        }

        if (message.status !== undefined) {
            this.map.setOtherStatus(message.realname, message.status);
        }

        if (message.disconnect) {
            this.map.removeOther(message.realname);
        }

        this.otherAvatars[message.realname] = {
            lastSeen: new Date(),
        }
    }

    /**
     * Fremde Avatare entfernen, wenn sie mehr als 5 Sekunden inaktiv waren.
     */
    removeStaleAvatars() {
        const now = new Date();

        for (let realname of Object.keys(this.otherAvatars)) {
            const lastSeen = this.otherAvatars[realname].lastSeen || null;

            if (!lastSeen || (now - lastSeen) > 5000) {
                this.map.removeOther(realname);
            }
        }

        window.setTimeout(this.removeStaleAvatars.bind(this), 5000);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new MyApplication();
});