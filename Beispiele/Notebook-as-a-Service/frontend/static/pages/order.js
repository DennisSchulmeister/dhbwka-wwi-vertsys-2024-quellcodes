import {WizardPage} from "../wizard.js";
import {createBootstrapAlert, fadeIn} from "../utils.js";

/**
 * Wizardseite 3: Ausgewähltes Gerät ausleihen
 */
export class WizardPageOrder extends WizardPage {
    /**
     * Konstruktor.
     * @param {Wizard} wizard Übergeordnete Wizard-Instanz
     */
    constructor(wizard) {
        super(wizard);

        this._pageElement  = document.getElementById("page-order");
        this._formElement  = this._pageElement.querySelector("form");
        this._imageElement = this._pageElement.querySelector("#lend-image");
        this._alertsDiv    = this._pageElement.querySelector("#form-order-alerts");
    }

    /**
     * Seite für die Anzeige vorbereiten.
     */
    async showPage() {
        // Event Handler für den Submit-Button registrieren
        let submitButton = this._pageElement.querySelector("button[type=submit]");
        let newSubmitButton = submitButton.cloneNode(true);
        submitButton.parentNode.replaceChild(newSubmitButton, submitButton);
        newSubmitButton.addEventListener("click", () => this._gotoNextPage());

        // Daten zum ausgewählten Gerät anzeigen
        let device = this._wizard.context.device;

        if (device.imageUrl) {
            this._imageElement.src = this._wizard.context.api("catalogue") + "/" + device.imageUrl;
        } else {
            this._imageElement.src = "placeholder.svg";
        }

        this._formElement.elements.device.value    = `${device.manufacturer} ${device.model}`;
        this._formElement.elements.startdate.value = this._wizard.context.startdate;
        this._formElement.elements.starttime.value = this._wizard.context.starttime;
        this._formElement.elements.enddate.value   = this._wizard.context.enddate;
        this._formElement.elements.endtime.value   = this._wizard.context.endtime;
        this._formElement.elements.contact.value   = "";
        this._formElement.elements.location.value  = "";
    }

    /**
     * Eingaben prüfen und nächste Seite aufrufen, wenn alles okay ist.
     */
    async _gotoNextPage() {
        // Eingaben prüfen
        this._alertsDiv.innerHTML = "";
        let messages = [];

        let contact  = this._formElement.elements.contact.value;
        let location = this._formElement.elements.location.value;

        if (contact === "") {
            messages.push("Geben Sie erst Ihre Kontaktdaten ein.");
        }

        if (location === "") {
            messages.push("Geben Sie erst den Bereitstellungsort ein.");
        }

        messages.forEach(message => {
            let divElement = createBootstrapAlert("danger", message);
            this._alertsDiv.appendChild(divElement);
            fadeIn(divElement);
        });

        if (messages.length > 0) {
            return;
        }
        
        // Gerät ausleihen
        let orderRequest = {
            deviceId:    this._wizard.context.device.id,
            status:      "LENDED",
            startTime:   `${this._wizard.context.startdate}T${this._wizard.context.starttime}`,
            endTime:     `${this._wizard.context.enddate}T${this._wizard.context.endtime}`,
            contactData: contact,
            location:    location
        };
        
        let response = await fetch(this._wizard.context.api("deviceOrder"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept-Content-Type": "application/json"
            },
            body: JSON.stringify(orderRequest)
        });
        
        let json = await response.json();
        
        // Weiter zum nächsten Schritt
        let errorMessage = "";
        
        if (json.message) {
            errorMessage = json.message;
        } else if (!json.deviceId) {
            errorMessage = "Das gewünschte Gerät konnte nicht ausgeliehen werden. <br> Bitte versuchen Sie es erneut.";
        }
        
        if (errorMessage) {
            let divElement = createBootstrapAlert("danger", errorMessage);
            this._alertsDiv.appendChild(divElement);
            fadeIn(divElement);
        } else {
            this._wizard.gotoNextPage("finish", true);
        }
    }
}