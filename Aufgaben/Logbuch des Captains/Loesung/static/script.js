const API_URL = "/api/logbook";

/**
 * Daten nach dem Laden der Seite vom Server abrufen und anzeigen. Ebenso
 * Event Handler zum Anlegen neuer Einträge registrieren.
 */
window.addEventListener("load", async () => {
    // Vorhandene Einträge abrufen und anzeigen
    let entries = await fetch(API_URL);
    entries = await entries.json();
    entries.forEach(displayEntry);
    
    // Event Handler zum Hinzufügen neuer Einträge
    let formElement = document.getElementById("form");
    formElement.addEventListener("submit", event => {
        createNewEntry(event);
    
        // Old-School Abschicken des Formulars unterdrücken
        event.preventDefault();
        return false;
    });
});

/**
 * Hilfsfunktion zum Anzeigen eines Logeintrags
 */
function displayEntry(entry) {
    let listElement = document.getElementById("entries");
    listElement.innerHTML += `<li><b>Sternzeit ${entry.starDate}:</b> ${entry.text}`;
}

/**
 * Hilfsfunktion zum Anlegen eines neuen Eintrags.
 */
async function createNewEntry() {
    // Eingegebenen Text ermitteln
    let formElement = document.getElementById("form");    
    let text = formElement.text.value;
    if (text.trim() === "") return;    
    formElement.text.value = "";

    // Backend-API aufrufen
    let entry = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({text: text})
    });
    
    // Gespeicherten Eintrag anzeigen
    displayEntry(await entry.json());
}