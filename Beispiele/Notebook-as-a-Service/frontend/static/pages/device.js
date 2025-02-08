import {WizardPage} from "../wizard.js";

/**
 * Wizardseite 2: Gerät auswählen
 */
export class WizardPageDevice extends WizardPage {
    /**
     * Konstruktor.
     * @param {Wizard} wizard Übergeordnete Wizard-Instanz
     */
    constructor(wizard) {
        super(wizard);

        this._pageElement = document.getElementById("page-device");
        this._cardsDiv    = this._pageElement.querySelector("#device-cards");
    }

    /**
     * Seite für die Anzeige vorbereiten.
     */
    async showPage() {
        // Verfügbare Geräte abrufen
        this._cardsDiv.innerHTML = "";

        let deviceClass = this._wizard.context.deviceClass;
        let response    = await fetch(this._wizard.context.api("deviceClass") + "/" + deviceClass + "/devices");
        let json        = await response.json();

        let startTime = encodeURI(`${this._wizard.context.startdate}T${this._wizard.context.starttime}`);
        let endTime   = encodeURI(`${this._wizard.context.enddate}T${this._wizard.context.endtime}`);

        // Je Gerät eine Card erzeugen
        json.forEach(device => {
            let cardElement = document.createElement("div");
            this._cardsDiv.appendChild(cardElement);
            cardElement.classList.add("card");
            cardElement.classList.add("m-2");

            let imgElement = document.createElement("div");
            cardElement.appendChild(imgElement);
            imgElement.classList.add("card-img-top");
            imgElement.classList.add("device-img");
            let imageUrl = "placeholder.svg";

            if (device.imageUrl) {
                imageUrl = this._wizard.context.api("catalogue") + "/" + device.imageUrl;
            }

            imgElement.style.backgroundImage = `url(${imageUrl})`;

            let bodyElement = document.createElement("div");
            cardElement.appendChild(bodyElement);
            bodyElement.classList.add("card-body");

            let nameElement = document.createElement("h5");
            bodyElement.appendChild(nameElement);
            nameElement.classList.add("card-title");
            nameElement.textContent = `${device.manufacturer} ${device.model}`;

            let buttonElement = document.createElement("button");
            bodyElement.appendChild(buttonElement);
            buttonElement.classList.add("btn");
            buttonElement.classList.add("btn-secondary");
            buttonElement.setAttribute("type", "button");
            buttonElement.setAttribute("disabled", "disabled");
            buttonElement.textContent = "Verfügbarkeit wird geprüft";

            buttonElement.addEventListener("click", () => this._gotoNextPage(device));

            // Verfügbarkeit des Geräts prüfen und Button entsprechend anpassen
            let promise = fetch(this._wizard.context.api("deviceAvailable") + `/${device.id}?startTime=${startTime}&endTime=${endTime}`);
            
            promise.then(response1 => {
                return response1.json();
            }).then(json1 => {
                if (json1.available) {
                    buttonElement.classList.remove("btn-secondary");
                    buttonElement.classList.add("btn-success");
                    buttonElement.removeAttribute("disabled");
                    buttonElement.textContent = "Ausleihen";
                } else {
                    buttonElement.classList.remove("btn-secondary");
                    buttonElement.classList.add("btn-danger");
                    buttonElement.textContent = "Nicht verfügbar";
                }
            });
        });
    }

    /**
     * Wizard weiterschalten, um das ausgewählte Gerät auszuleihen.
     * @param {Object} device Webservice-Daten des Geräts
     */
    _gotoNextPage(device) {
        this._wizard.context.device = device;
        this._wizard.gotoNextPage("order");
    }
}
