/**
 * Div-Element mit einem Alert (Fehler, Warnung, Info) erzeugen. Das Element
 * kann mit `fadeIn(element)` eingeblendet werden, nachdem es im DOM-Baum
 * eingefügt wurde.
 * 
 * @param {type} type Art des Alerts (danger, success, warning, ...)
 * @param {type} message HTML-Inhalt bzw. Meldungstext
 * @returns {Element} Erzeugtes HTML-Element
 */
export function createBootstrapAlert(type, message) {
    let divElement = document.createElement("div");

    divElement.classList.add("alert");
    divElement.classList.add(`alert-${type}`);
    divElement.classList.add("mb-4");
    divElement.classList.add("fx-fade");
    divElement.setAttribute("role", "alert");
    divElement.innerHTML = message;
    
    return divElement;
}

/**
 * Zuvor erzegutes Alert-Element einblenden, nachdem es im DOM-Baum eingefügt
 * wurde. Hierzu wird ein kleiner Timer gestartet, da der Effekt mit einer
 * CSS-Transition realisiert wird, die aber erst dann wirken kann, wenn das
 * Element zum Zeitpunkt der Style-Änderung bereits die Eigenschaften aus
 * dem Stylesheet übernommen hat.
 * 
 * @param {Element} element Einzublendender Alert
 */
export function fadeIn(element) {
    window.setTimeout(() => element.style.opacity = 1, 100);
}