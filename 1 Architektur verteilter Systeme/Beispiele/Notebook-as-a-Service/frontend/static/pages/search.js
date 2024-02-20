import {WizardPage} from "../wizard.js";
import {createBootstrapAlert, fadeIn} from "../utils.js";

/**
 * Wizardseite 1: Zeitraum und Gerätetyp auswählen
 */
export class WizardPageSearch extends WizardPage {
    /**
     * Konstruktor.
     * @param {Wizard} wizard Übergeordnete Wizard-Instanz
     */
    constructor(wizard) {
        super(wizard);

        this._pageElement      = document.getElementById("page-search");
        this._formElement      = this._pageElement.querySelector("form");
        this._deviceClassDiv = this._pageElement.querySelector("#form-search-device-class");
        this._alertsDiv        = this._pageElement.querySelector("#form-search-alerts");
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

        // Geräteklassen abrufen
        this._deviceClassDiv.innerHTML = "";

        let response = await fetch(this._wizard.context.api("deviceClass"));
        let json     = await response.json();

        // Datum und Uhrzeit vorbelegen
        let datetime  = new Date();
        let startdate = datetime.toISOString().split("T")[0];
        let starttime = datetime.toISOString().split("T")[1].slice(0, 5);

        datetime.setDate(datetime.getDate() + 3);
        let enddate = datetime.toISOString().split("T")[0];
        let endtime = datetime.toISOString().split("T")[1].slice(0, 5);

        this._formElement.elements.startdate.value = startdate;
        this._formElement.elements.starttime.value = starttime;
        this._formElement.elements.enddate.value   = enddate;
        this._formElement.elements.endtime.value   = endtime;

        // Je Geräteklassen einen Radiobutton erzeugen
        let checked = "checked";

        json.forEach(deviceClass => {
            let id   = deviceClass.id;
            let name = deviceClass.name;

            let divElement = document.createElement("div");
            this._deviceClassDiv.appendChild(divElement);

            divElement.classList.add("form-check");

            divElement.innerHTML = `
                <input class="form-check-input" type="radio" name="device-class" id="form-search-device-class-${id}" value="${id}" ${checked}>
                <label class="form-check-label" for="form-search-device-class-${id}">${name}</label>
            `;

            checked = "";
        });
    }

    /**
     * Eingaben prüfen und nächste Seite aufrufen, wenn alles okay ist.
     */
    _gotoNextPage() {
        // Eingaben prüfen
        this._alertsDiv.innerHTML = "";
        let messages = [];

        let startdate   = this._formElement.elements.startdate.value;
        let starttime   = this._formElement.elements.starttime.value;
        let enddate     = this._formElement.elements.enddate.value;
        let endtime     = this._formElement.elements.endtime.value;
        let deviceClass = this._formElement.elements["device-class"].value;

        if (startdate === "" || starttime === "") {
            messages.push("Legen Sie erst den Beginn der Ausleihe fest.");
        }

        if (enddate === "" || endtime === "") {
            messages.push("Legen Sie erst das Ende der Ausleihe fest.");
        }

        if (new Date(`${enddate}T${endtime}`) <= new Date(`${startdate}T${starttime}`)) {
            messages.push("Der Beginn der Ausleihe muss vor der Rückgabe liegen");
        }

        if (deviceClass === "") {
            messages.push("Wählen Sie erst einen Gerätetyp aus.");
        }

        messages.forEach(message => {
            let divElement = createBootstrapAlert("danger", message);
            this._alertsDiv.appendChild(divElement);
            fadeIn(divElement);
        });

        if (messages.length > 0) {
            return;
        }

        // Weiter zum nächsten Schritt
        this._wizard.context.startdate   = startdate;
        this._wizard.context.starttime   = starttime;
        this._wizard.context.enddate     = enddate;
        this._wizard.context.endtime     = endtime;
        this._wizard.context.deviceClass = deviceClass;

        this._wizard.gotoNextPage("device");
    }
}