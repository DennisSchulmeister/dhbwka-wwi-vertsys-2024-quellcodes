import {Wizard}           from "./wizard.js";
import {WizardPageSearch} from "./pages/search.js";
import {WizardPageDevice} from "./pages/device.js";
import {WizardPageOrder}  from "./pages/order.js";
import {WizardPageFinish} from "./pages/finish.js";

window.addEventListener("load", async () => {
    // Basis-URL des API-Gateways abrufen
    let response = await fetch("/api/gateway");
    let gatewayURL = await response.text();

    let urls = {
        catalogue:       "/api/catalogue",
        device:          "/api/catalogue/device",
        deviceClass:     "/api/catalogue/device-class",
        order:           "/api/order",
        deviceExists:    "/api/order/device/exists",
        deviceAvailable: "/api/order/device/available",
        deviceOrder:     "/api/order/order"
    };

    // Neuladen der Seite bei Klick auf einen der Submit-Buttons unterbinden
    document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", event => event.preventDefault());
    });

    // Wizard-Ablauf starten
    let wizard = new Wizard("#main-carousel", {
        search: WizardPageSearch,
        device: WizardPageDevice,
        order:  WizardPageOrder,
        finish: WizardPageFinish
    }, {
        // Hilfsmethode zum Ermitteln einer Webserivce-URL.
        // Parameter ist der Schlüssel im urls-Objekt oben.
        api: a => gatewayURL + urls[a]
    });

    wizard.gotoNextPage("search");
});