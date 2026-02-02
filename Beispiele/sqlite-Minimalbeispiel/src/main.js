import sqlite from "better-sqlite3";

// Datenbank öffnen
console.log(">> Stelle Verbindung zur Datenbank her");
let db = sqlite("db.sqlite");

db.pragma("journal_mode = WAL");        // Bessere Performance
db.pragma("foreign_keys = ON");         // Fremdschlüsselprüfungen aktivieren

// Datenbank sauber schließen, wenn das Programm beendet wird
process.on("exit", () => {
    console.log();
    console.log(">> Trenne Datenbankverbindung");
    db.close();
});

process.on("SIGHUP",  () => process.exit(128 + 1));
process.on("SIGINT",  () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

// Tabellen anlegen
console.log(">> Erstelle Tabelle ShoppingList");
db.prepare(`
    CREATE TABLE IF NOT EXISTS ShoppingList(
        listId    INTEGER PRIMARY KEY, 
        listName  TEXT UNIQUE,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )    
`).run();

console.log(">> Erstelle Tabelle ShoppingListItem");
db.prepare(`
    CREATE TABLE IF NOT EXISTS ShoppingListItem(
    itemId     INTEGER PRIMARY KEY AUTOINCREMENT,
    itemName   TEXT, 
    count      NUMBER CHECK (count > 0),

    -- Fremdschlüsselbeziehung herstellen
    listId     INTEGER REFERENCES ShoppingList(listId)
               ON UPDATE CASCADE
               ON DELETE CASCADE
    )
`).run();

// Daten einfügen (als geschlossene Transaktion)
console.log();
console.log(">> Erzeuge Datenbankeinträge");

const insertShoppingList = db.prepare("INSERT INTO ShoppingList (listId, listName) VALUES (@listId, @listName)");
const insertShoppingListItem = db.prepare("INSERT INTO ShoppingListItem (itemName, count, listId) VALUES (@name, @count, @listId)");

const createShoppingList = db.transaction((listId, listName, listItems) => {
    console.log(`>>>> shopping_list(${listId}): ${listName}`);
    insertShoppingList.run({listId, listName});

    for (let listItem of listItems || []) {
        console.log(`>>>> shopping_list_item: ${listItem.count}x ${listItem.name}`);
        insertShoppingListItem.run({...listItem, listId});
    }
});

createShoppingList(1, "Lebensmittel", [
    {name: "Brot",       count: 1},
    {name: "Butter",     count: 1},
    {name: "Marmelade",  count: 2},
    {name: "Frischkäse", count: 2},
    {name: "Aufschnitt", count: 1},
]);

// Anzahl der Listeneinträge ausgeben
let result = db.prepare("SELECT COUNT(*) AS count FROM ShoppingListItem").get();
console.log(`>> Anzahl Einträge in ShoppingListItem: ${result.count}`);

// ID der Liste ändern: Ändert die Listen-ID ihrer Einträge
console.log();
console.log(">> Ändere ShoppingList(1).listId auf 2");
db.prepare("UPDATE ShoppingList SET listId = @new WHERE listId = @old").run({old: 1, new: 2});

// Löschen der Liste: Löscht auch ihre Einträge
console.log(">> Lösche ShoppingList(2)");
db.prepare("DELETE FROM ShoppingList WHERE listId = @id").run({id: 2});

result = db.prepare("SELECT COUNT(*) AS count FROM ShoppingListItem").get();
console.log(`>> Anzahl Einträge in ShoppingListItem: ${result.count}`);