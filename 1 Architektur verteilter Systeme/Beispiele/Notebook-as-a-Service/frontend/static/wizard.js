/**
 * Hilfsklasse zur Steuerung des Wizard-Ablaufs. Im HTML-Code ist hierfür zwar
 * ein Bootstrap-Karussell definiert, der Anwender soll die einzelnen Seiten
 * aber nicht in beliebiger Reihenfolge anspringen können. Diese Klasse sorgt
 * dafür, dass die Seiten nur eine nach der anderen aufgerufen werden können
 * oder zu einer der vorherigen Seiten zurück gesprungen werden kann. Hierfür
 * muss die Logik jeder Seite in eine WizardPage-Klasse verpackt werden.
 */
export class Wizard {
    /**
     * Konstruktor.
     * 
     * @param {String} carouselSelector CSS-Selektor für das Karussell-Element
     * @param {Object} pages Dictionary mit den WizardPage-Klassen. Schlüssel
     * ist jeweils die Seiten ID, Wert die Klasse.
     * @param {Object} context Mit den Schritten geteilter Kontext
     */
    constructor(carouselSelector, pages, context) {
        this._carouselElement = document.querySelector(carouselSelector);
        this._carousel = new bootstrap.Carousel(carouselSelector)
        this._pages = pages;

        this._currentPage = null;
        this._pageHistory = [];

        this.context = context;
    }

    /**
     * Aufruf der nächsten Wizardseite. Diese Methode kann von überall
     * aufgerufen werden, um den Wizard weiterzuschalten.
     * 
     * @param {string} page_id Seiten-ID
     * @param {boolean} finished Keine Rückwärtsnavigation zulassen
     */
    async gotoNextPage(page_id, finished) {
        this._currentPage = new this._pages[page_id](this);
        this._pageHistory.push(this._currentPage);

        this._currentPage.showPage();
        this._updateCarousel(finished);
    }

    /**
     * Rückkehr zu einer früheren Seite.
     * @param {number} nr Index der vorherigen Seite (beginnend bei null)
     */
    gotoPrevPage(nr) {
        if (nr in this._pageHistory) {
            this._currentPage = this._pageHistory[nr];
            this._pageHistory = this._pageHistory.slice(0, nr + 1);
            this._updateCarousel();
        }
    }

    /**
     * Interne Methode zur Aktualisierung des Bootstrap-Karussells, nachdem
     * der Wizard zu einer neuen Seite gewechselt hat.
     * 
     * @param {boolean} finished Keine Rückwärtsnavigation zulassen
     */
    _updateCarousel(finished) {
        // Indikatoren am unteren Bildschirmrand rendern
        let parentElement = document.getElementById("main-carousel-indicators");
        parentElement.innerHTML = "";

        let indicatorButton;

        for (let i = 0; i < this._pageHistory.length; i++) {
            indicatorButton = document.createElement("button");
            indicatorButton.setAttribute("type", "button");
            indicatorButton.setAttribute("data-bs-target", "#main-carousel");
            indicatorButton.setAttribute("aria-current", "false");
            indicatorButton.setAttribute("aria-label", `Schritt ${i + 1}`);
            indicatorButton.classList.add("bg-secondary");

            if (finished) {
                indicatorButton.classList.add("inactive");
            } else {
                indicatorButton.addEventListener("click", () => this.gotoPrevPage(i));
            }

            parentElement.appendChild(indicatorButton);
        }

        if (indicatorButton) {
            indicatorButton.classList.add("active");
            indicatorButton.setAttribute("aria-current", "true");
        }

        // Sichtbare Karussell-Seite wechseln
        this._carousel.to(this._pageHistory.length - 1);
        this._carousel.pause();
    }
}

/**
 * Basisklasse für eine Wizardseite.
 */
export class WizardPage {
    /**
     * Konstruktor.
     * @param {Wizard} wizard Übergeordnete Wizard-Instanz
     */
    constructor(wizard) {
        this._wizard = wizard;
    }

    /**
     * Vom Wizard aufgerufene Methode, sobald eine Seite zum ersten mal
     * aufgerufen wird. Die Methode wird nur aufgerufen, wenn die Seite durch
     * Weiterschalten des Wizards zu einer neuen Seite erreicht wird. Kehrt
     * der Anwender über die Indikatoren am unteren Bildschirmrand zu einer
     * alten Seite zurück, wird die Methode nicht erneut aufgerufen.
     */
    async showPage() {
    }
}