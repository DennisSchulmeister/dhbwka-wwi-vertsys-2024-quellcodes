/**
 * Kleine Hilfsfunktion zum Abruf von JSON-Daten aus dem Internet. Zwar müsste
 * man hierfür keine neue Funktion definieren. Auf diese Weise können wir jedoch
 * zeigen, wie "größere" JavaScript-Programme in einzeln Module (Quellcode-Dateien)
 * aufgeteilt werden können.
 * 
 * @param {string} url Abzurufende URL
 * @returns Die abgerufenen, deserialisierten Daten
 * @throws Dieselben Exceptions wie fetch() bei einem Fehler
 */
export async function fetchJson(url) {
    let response = await fetch(url);
    return await response.json();
}