Minimalbeispiel zur Socketprogrammierung
========================================

 1. [Kurzbeschreibung](#kurzbeschreibung)
 1. [Start der beiden Anwendungen](#start-der-beiden-anwendungen)

Kurzbeschreibung
----------------

Dieses Beispiel zeigt die absolut minimalste Version einer Client/Server-Anwendung mit
Node.js und direkter Socketprogrammierung. Der Server ist ein einfacher Echo-Server,
der jede Eingabe, die man ihm schickt, wieder zurückschickt. Dementsprechend fragt der
Client einfach in einer großen Endlosschleife nach einer Eingabe, schicke sie an den
Server und zeigt dessen Antwort an, bis das Programm durch Eingabe einer Leerzeile
beendet wird.

An dem Beispiel zeigt sich auch, dass JavaScript grundsätzlich asynchron programmiert
wird. Dies macht es insbesondere im Client etwas schwer, gezielt nach dem Senden einer
Zeile auf die Antwort des Servers zu warten. Senden und Empfangen geschehen unabhängig
voneinander in zwei asynchronen, voneinander unabhängigen Event Handlern. Das Beispiel
nutzt daher ein `EventEmitter`-Objekt, um die im einen Event Handler empfangenen Daten
an den anderen Handler zu schicken. Dieses wartet mit der `once()`-Funktion gezielt auf
dieses Ereignis.

Große Sorgfalt ist geboten, die asynchronen Abläufe korrekt hinzubekommen. Zum Glück
laufen die Event Handler im selben Thread, nur jeweils zu anderen Zeitpunkten. Das
vereinfacht die Programmierung zumindest insofern, als dass man sich darauf verlassen
kann, dass nach dem Auslösen eines Events zunächst die Eventempfänger ausgeführt werden,
bevor neue Daten empfangen und neue Events hierzu ausgelöst werden können. Würden die
Event Handler, wie zum Beispiel in älterem Java- oder Python-Code üblich, in separaten
Threads laufen, wäre diese Garantie nicht gegeben und man müsste die Threads zusätzlich
noch mit Sperren synchronisieren, damit keine Ereignisse verloren gehen.

Start der beiden Anwendungen
----------------------------

Die beiden Verzeichnisse `Echo-Server` und `Echo-Client` beinhalten jeweils ein kleines
Node.js-Konsolenprogramm. Auf dem eigenen Rechner muss daher Node.js  installiert sein,
um die Programme ausführen zu können. Zunächst müssen hierfür die jeweiligen Abhängigkeiten
installiert werden:

```sh
cd Echo-Server
npm install

cd ../Echo-Client
npm install
```

Anschließend kann im jeweiligen Verzeichnis `npm start` ausgeführt werden, um das eigentliche
Programm zu starten.
