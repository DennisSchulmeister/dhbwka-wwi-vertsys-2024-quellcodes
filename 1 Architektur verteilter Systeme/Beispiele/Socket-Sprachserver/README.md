Socketprogrammierung mit Node.js
================================

 1. [Kurzbeschreibung](#kurzbeschreibung)
 1. [Start der beiden Anwendungen](#start-der-beiden-anwendungen)
 1. [Ausführen mit Docker](#ausführen-mit-docker)

Kurzbeschreibung
----------------

Dieses Projekt zeigt ein Minimalbeispiel für eine verteilte Anwendung, wie sie low-level
mit nichts weiter als dem TCP/IP-Stack des Betriebssystems realisiert werden kann. Als
Programmiersprache dient JavaScript mit Node.js sowohl für Client als auch Server.
Der Server implementiert hierbei einen einfachen „Vorlesedienst“, dem ein beliebiger
(englischer) Text zum Vorlesen auf dem Computerlautsprecher geschickt werden kann.

Der Tradition früher Internetprotokolle folgend handelt es sich um ein zeilenbasiertes
Anwendungsprotokoll, bei dem die ausgetauschten Nachrichten als Klartext kodiert und
mit einem Zeilenumbruch abgeschlossen werden. Zunächst schicken sich Client und Server
gegenseitig eine `HELLO`-Nachricht (der Client zuerst). Anschließend wartet der Server
in einer Schleife auf die Befehle des Clients, führt diese aus und sendet daraufhin
jeweils eine Antwort.

Standardmäßig lauscht der Server auf allen Netzwerkinterfaces auf TCP-Port 7000. Dies ist
keine sicherer Voreinstellung. Besser wäre, nur auf `localhost:7000` zu lauschen und
keine Verbindungen von außerhalb des Rechners anzunehmen, wenn dies beim Programmstart
nicht explizit mitgegeben wird. Die Voreinstellung bietet sich jedoch für die Verwendung
in der Vorlesung an, weil die Studierenden somit versuchen können, mit Netcat oder Telnet
eine Verbindung zum Dozentenlaptop herzustellen. Über die Umgebungsvariablen `LISTEN_IP` und
`LISTEN_PORT` kann die Voreinstellung beeinflusst werden. Um die Verwendung in der Vorlesung
zu vereinfachen, verwendet der Client dieselben Vorgaben und Umgebungsvariablen.

Folgende Konversationen sind dabei vorgesehen:

__Begrüßung:__

```text
< HELLO
> HELLO
> COMMANDS: ...
>
```

__Text vorlesen:__

```text
< SAY: Hello, world!
> CONFIRM
< SAY: How are you?
> CONFIRM
< SAY: Tell the truth.
> CONFIRM
```

__Status abfragen:__

```text
< GET_STATUS
> SERVER_STATUS: speaking

< GET_QUEUE
> QUEUE: How are you?
> QUEUE: Tell the truth.
> QUEUE_END

< GET_STATUS
> SERVER_STATUS: waiting

< BYE
```

Die spitzen Klammern gehören dabei nicht zum Nachrichtenaustausch, sondern zeigen
hier nur Client (`<`) und Server (`>`) an. Nachrichten vom Client an den Server
umfassen immer eine Zeile. Nachrichten vom Server an den Client mehrere Zeilen,
von denen jede mit einem eindeutigen Kommando beginnt.

Start der beiden Anwendungen
----------------------------

Die beiden Verzeichnisse `Server` und `Client` beinhalten jeweils ein kleines
Node.js-Konsolenprogramm. Auf dem eigenen Rechner muss daher Node.js (oder Docker,
siehe unten) installiert sein, um die Programme ausführen zu können. Zunächst
müssen hierfür die jeweiligen Abhängigkeiten installiert werden:

```sh
cd Server
npm install

cd ../Client
npm install
```

Anschließend kann im jeweiligen Verzeichnis `npm start` ausgeführt werden, um
das eigentliche Programm zu starten.

Ausführen mit Docker
--------------------

Mit Hilfe von Docker können die beiden Programme auch ohne dauerhafte Node.js-Installation
ausgeführt werden. Stattdessen können mit folgenden Befehlen zwei temporäre Container 
gestartet werden.

__Server:__

  ```sh
  cd Server
  docket network create saynet
  docker run -it --net saynet -p 7000:7000 -w /app -v "$(pwd):/app" node:17-alpine sh
  ```

__Client:__

  ```sh
  cd ../Client
  docker run -it --net saynet -p 7000:7000 -w /app -v "$(pwd):/app" node:17-alpine bash
  ```

Innerhalb der beiden Container müssen dann die Befehle `npm install` und `npm start`
ausgeführt werden.
