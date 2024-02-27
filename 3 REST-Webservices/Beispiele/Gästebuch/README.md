Gästebuch
=========

![Screenshot](screenshot.png)

Dies ist ein minimalistisches Beispiel für die Programmierung eines einfachen
Webservices mit Node.js und dem Express-Framework. Es handelt sich dabei um
eine sehr einfache Single Page App, die serverseitig einen Webservice mit folgenden
zwei Endpunkten konsumiert:

 * `GET /api/guesbook`: Abrufen aller Gästebucheinträge
 * `POST /api/guestbook`: Anlegen eines neuen Gästebucheintrags

Gemäß den REST-Prinzipien handelt es sich dabei um eine Collection, deren Inhalte
abgerufen und in welche neue Inhalte eingefügt werden können. Weitere Funktionen
wurden nicht implementiert, um das Beispiel klein zu halten.

Der kompette serverseitige Code befindet sich in der Datei `src/main.js`. Der
Clientseitige Code befindet sich in der `static/script.js`.

