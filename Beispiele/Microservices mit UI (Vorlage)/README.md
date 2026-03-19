Vorlage: Microservices mit UI (Microservices + Express-Frontend)
================================================================

Inhaltsverzeichnis
------------------

- [Kurzüberblick](#kurzüberblick)
- [Los geht's!](#los-gehts)
- [Projektstruktur (Monorepo)](#projektstruktur-monorepo)
- [Teilprojekte: Schema & wichtigste Dateien](#teilprojekte-schema--wichtigste-dateien)
- [Proxy-Regeln (Frontend → Microservices)](#proxy-regeln-frontend--microservices)
- [Verwendung der Vorlage](#verwendung-der-vorlage)
- [Wichtige NPM-Kommandos](#wichtige-npm-kommandos)
- [Konfiguration via `.env`](#konfiguration-via-env)
- [Hinweise & typische Stolpersteine](#hinweise--typische-stolpersteine)

Kurzüberblick
-------------

Diese Vorlage zeigt, wie Sie eine Microservice-Architektur mit einem **separaten Frontend-Projekt**
aufbauen könnt, das gleichzeitig als **UI-Server** dient. Alle Teilprojekte sind **Express-Apps**
(wie in der Vorlesung besprochen). Dadurch kann das Frontend flexibel als **SPA**, **MPA** oder
**hybrid** umgesetzt werden.

Wichtiges Ziel dieser Vorlage: Im Browser gibt es **nur einen Einstiegspunkt** (das Frontend)!
Das Frontend kann per Proxy HTTP-Aufrufe an die Microservices weiterleiten – so müssen Sie sich
beim UI nicht mit CORS/mehreren Origins herumschlagen. Wünschen Sie, das UI komplett separat zu
entwickeln, ist dies ebenfalls möglich, da die entsprechenden CORS-Header vom Frontend-Server
gesetzt werden. In diesem Fall dient der Frontend-Server lediglich als API-Gateway, das alle
Zugriffe auf die Backend-Microservices kapselt.

* **Microservice 1** läuft standardmäßig auf Port **9000** und bietet beispielhaft `GET /api/hello`.
* **Microservice 2** läuft standardmäßig auf Port **9001** und bietet beispielhaft `GET /api/hello`.
* **Frontend** läuft standardmäßig auf Port **8888**, liefert statische Dateien aus und enthält Proxy-Routen:

	- `/api/microservice1/*` → Microservice 1
	- `/api/microservice2/*` → Microservice 2

Das Repo nutzt ein gemeinsames Paket **common/** als (NPM-)Workspace-Paket, um **Code und Dependencies**
zu teilen.

Los geht's!
-----------

Voraussetzungen: aktuelle Node.js-LTS + npm.

1) Dependencies installieren (im Projekt-Root):

```bash
npm install
```

2) Alle Teilprojekte starten:

```bash
npm start
```

Für die Entwicklung (Auto-Restart bei Änderungen):

```bash
npm run watch
```

3) Im Browser öffnen:

- UI/Frontend: http://localhost:8888/

Beispielaufrufe (über das Frontend, inkl. Proxy):

- http://localhost:8888/api/microservice1/hello
- http://localhost:8888/api/microservice2/hello

Direktzugriff auf die Microservices geht natürlich auch, z.B. http://localhost:9000/api/hello.
Im UI sollten Sie aber die Proxy-URLs nutzen.

Projektstruktur (Monorepo)
--------------------------

Auf Root-Ebene liegen Orchestrierung und gemeinsame Abhängigkeiten:

```text
.
├─ package.json            # Root-Scripts: start/watch für alle Teilprojekte
├─ common/                 # Geteiltes Paket (Workspace): Middleware, Utils, Dependencies
├─ microservice1/          # Beispiel-Microservice 1 (Express)
├─ microservice2/          # Beispiel-Microservice 2 (Express)
└─ frontend/               # Frontend/UI (Express + Proxy + static/)
```

Beachten Sie die `workspace`-Anweisung in der obersten `package.json`!

Teilprojekte: Schema & wichtigste Dateien
-----------------------------------------

### `common/` (geteilter Code + Dependencies)

* `common/package.json`
	- enthält bewusst die **gemeinsam genutzten Dependencies** (u.a. `express`, `dotenv`, `qs`, Logging)

* `common/src/utils.js`
	- `logger` und kleine Helpers wie `throwError()` / `throwNotFound()`

* `common/src/middleware.js`
	- `logRequest(logger)` (Request-Logging)
	- `handleError(logger)` (zentraler JSON-Error-Handler)

➡️ Idee: Alles, was mehrere Services brauchen (z.B. Middleware, Validatoren, DTOs, Fehlerklassen, Shared Config),
kommt in `common/`.

**Hinweis zur Dependency-Verwaltung:** In dieser Vorlage liegen zentrale Dependencies (z.B. `express`, `dotenv`, `qs`)
im `common/`-Paket. Darum wirken `microservice1/`, `microservice2/` und `frontend/` in ihrer jeweiligen `package.json`
teilweise „ungewöhnlich leer“ – das ist hier Absicht. Wenn Sie ein Paket **nur** in einem Service brauchen, installieren
und verwalten Sie es es ganz normal im entsprechenden Unterordner.

### `microservice1/` und `microservice2/` (Backend-Services)

Beide Microservices sind strukturell gleich aufgebaut:

* `src/main.js`
	- Express-Setup (JSON, Static, Logging, Error-Handling)
	- lädt Controller aus `src/controllers/index.js`
	- Standardports: **9000** bzw. **9001** (überschreibbar per `.env`)

* `src/controllers/`
	- `*.controller.js`: registriert Routen am Express-`app`
	- `index.js`: sammelt alle Controller in einem Array (damit `main.js` nicht dauernd angepasst werden muss)

* `src/services/`
	- fachliche Logik (wird von Controllern aufgerufen)

* `static/`
	- Dateien, die direkt ausgeliefert werden (z.B. Status-Seite, Dokumentation, kleine Assets)

Beispiel-Endpoint (in beiden Microservices):

* `GET /api/hello?name=...` → JSON `{ "text": "Hallo ..." }`

### `frontend/` (UI-Server + Proxy)

* `src/main.js`
	- Express-Server für die UI (Standardport **8888**)
	- liefert `frontend/static/` aus
	- registriert Controller aus `frontend/src/controllers/index.js`

* `src/controllers/proxy.controller.js`
	- Proxy-Regeln zu den Microservices (siehe nächster Abschnitt)

* `static/`
	- hier liegt das UI
	- in der Vorlage eine einfache `index.html`, die per `fetch()` über den Proxy beide Microservices aufruft

➡️ Je nach Projekt können Sie das Frontend auf drei Arten umsetzen:

* **SPA**: Build/Assets (oder einfache Vanilla-HTML/JS-Dateien) nach `frontend/static/` legen.
* **MPA**: zusätzliche Express-Routen im Frontend ergänzen (weitere Controller unter `frontend/src/controllers/`).
* **Hybrid**: Mischung aus statischen Dateien + serverseitigen Endpunkten. (Auch „Backend for Frontend” genannt).

Proxy-Regeln (Frontend → Microservices)
---------------------------------------

Die Proxy-Regeln sind in `frontend/src/controllers/proxy.controller.js` definiert. Aktuell gilt:

- `/api/microservice1/*` wird an `http://localhost:9000/api/*` weitergeleitet
- `/api/microservice2/*` wird an `http://localhost:9001/api/*` weitergeleitet

Wichtig für Ihr UI:

- Im Browser rufen Sie **nur** relative URLs am Frontend auf (z.B. `fetch("/api/microservice1/hello")`).
- Das Frontend „übersetzt“ diese Aufrufe intern zu den jeweiligen Backend-Hosts/Ports.

➡️ Wenn Sie neue Microservices hinzufügen oder Ports ändern, müssen Sie **hier** die Proxy-Regeln anpassen.

Verwendung der Vorlage
----------------------

Diese Vorlage ist absichtlich „dünn“ – ihr ergänzt die fachliche Anwendung:

1) **Eigene Services implementieren**

	- fachliche Logik in `microserviceX/src/services/…`

2) **Eigene Controller/Routen implementieren**

	- REST-Endpunkte in `microserviceX/src/controllers/…`
	- neuen Controller in `microserviceX/src/controllers/index.js` eintragen

3) **Proxy-Regeln im Frontend anpassen**

	- neue Backend-Routen/Services in `frontend/src/controllers/proxy.controller.js` ergänzen

4) **UI implementieren**

	- als SPA: Dateien/Build nach `frontend/static/` (z.B. `index.html`, `app.js`, Assets)
	- oder serverseitig/hybrid: weitere Express-Handler im Frontend ergänzen

5) **(Optional) Weitere Microservices hinzufügen**

	- neuen Ordner nach dem Schema `microservice1/` anlegen/kopieren
	- eigenen Port konfigurieren (z.B. per `.env`/`LISTEN_PORT`)
	- Root-Scripts in `package.json` (`start`, `watch`) erweitern
	- Proxy-Regeln im Frontend ergänzen

Wichtige NPM-Kommandos
----------------------

### Im Projekt-Root (startet/verwaltet alle Teilprojekte)

* `npm install` - installiert die Abhängigkeiten
* `npm run install` - (re-)installiert die Abhängigkeiten in den Teilprojekten (wird beim normalen `npm install` im Root i.d.R. automatisch mit ausgeführt)
* `npm start` - startet Frontend + beide Microservices parallel
* `npm run watch` - wie `start`, aber mit Auto-Restart bei Code-Änderungen (über `nodemon`)

### In einem Teilprojekt (z.B. `microservice1/`, `microservice2/`, `frontend/`)

Im jeweiligen Unterordner:

- `npm start` – startet genau dieses Teilprojekt
- `npm run watch` – startet mit Auto-Restart
- `npm run debug` – startet mit Node-Debugger (`--inspect-brk`)

Konfiguration via `.env`
------------------------

Alle Express-Apps laden beim Start eine optionale `.env` im jeweiligen Projektordner.
Unterstützt werden insbesondere:

- `LISTEN_HOST` (Standard: leer, d.h. „alle Interfaces“)
- `LISTEN_PORT` (Standard: 9000/9001/8888 – je nach Teilprojekt)

Beispiel für `frontend/.env`:

```env
LISTEN_PORT=8888
```

Hinweise & typische Stolpersteine
---------------------------------

* **ES6-Module:** Alle Projekte sind mit `"type": "module"` konfiguriert. Nutzt also `import … from …` statt `require()`.

* **Einheitliche API-Pfade:** In den Microservices sind die Beispielrouten unter `/api/...` definiert.
  Halten Sie das konsequent, dann bleiben die Proxy-Regeln simpel.

* **Shared Dependencies:** Wenn mehrere Services dasselbe Paket brauchen, ist `common/package.json` ein guter Platz dafür.

* **Direkter vs. proxied Zugriff:** Im Browser am besten immer über das Frontend gehen (`/api/microserviceX/...`).

* **„Hello“-Beispiel als Vorlage:** Schauen Sie sich `hello.controller.js` und `hello.service.js` als Muster für Ihre
  eigene Code-Struktur (Controller ↔ Service) an. Dadurch werden die in der Vorlesung besprochenen SOLID-Prinzipien
  bestens eingehalten.
