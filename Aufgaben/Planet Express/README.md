Aufgabe: Planet Express
=======================

Nimm dir das Logbuch-Beispiel aus dem Vorlesungsskript über Express als Vorlage
und programmiere es so um, dass folgende Daten über den Webservice abgerufen und
angelegt werden können. Bei der konkreten Umsetzung des Datenmodells hast du freie
Wahl.

![Datenmodell](datenmodell.png)

Achte darauf, die Version zu nehmen, bei der die SOLID-Prinzipien vollständig
eingehalten werden. Die statischen Dateien für die Single Page App musst du nicht
übernehmen, da wir hier nur den Webservice programmieren wollen.

Folgende HTTP-Endpunkte soll der Webservice besitzen. Teste ihre Funktion mit einem
HTTP-Testwerkzeug wie ![httpie](https://httpie.io/).

#### Lieferungen

* `GET /api/parcel`: Eine Liste abrufen
* `GET /api/parcel/:id`: Details eines Eintrags abrufen
* `POST /api/parcel`: Neuen Eintrag anlegen

#### Frachtflüge

* `GET /api/flight`: Eine Liste abrufen
* `GET /api/flight/:id`: Details eines Eintrags abrufen
* `POST /api/flight`: Neuen Eintrag anlegen
