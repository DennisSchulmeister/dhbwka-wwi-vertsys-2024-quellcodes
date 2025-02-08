import {WizardPage} from "../wizard.js";

/**
 * Wizardseite 4: Bestätigung
 */
export class WizardPageFinish extends WizardPage {
    /**
     * Konstruktor.
     * @param {Wizard} wizard Übergeordnete Wizard-Instanz
     */
    constructor(wizard) {
        super(wizard);

        let restartButton = document.getElementById("finish-button-restart");
        restartButton.addEventListener("click", () => this._wizard.gotoPrevPage(0));
    }
}