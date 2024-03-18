Capture The Flag
================

1. [Kommunikation via MQTT](#kommunikation-via-mqtt)
1. [Spiel beitreten und verlassen](#spiel-beitreten-und-verlassen)
1. [Statusmeldungen des Game-Masters](#statusmeldungen-des-game-masters)
1. [Hubschrauber steuern](#hubschrauber-steuern)
1. [Andere Spieler angreifen](#andere-spieler-angreifen)

Heute haben wir etwas ganz Besonderes vor: Wir wollen ein Spiel spielen! Allerdings spielen
wir es nicht selbst, sondern wir schicken ein Programm ins Rennen, das für uns spielt. Es
handelt sich um eine Hubschrauber-Simulation, bei der man mit einem Hubschrauber durch Karlsruhe
fliegen muss, um zehn blaue Fahnen einzusammeln.

Hierfür gibt es bereits einen "Game-Master", der das Spiel steuert und einen Webclient zum Betrachten
des Spielgeschehens. Ihre Aufgabe besteht darin, sich in einer kleinen Gruppe zusammenzuschließen und
ein Programm zu schreiben, dass einen Ihren Hubschrauber steuert und versucht, die Fahnen durch nahe
genug vorbei fliegen einzusammeln. Im Webclient können Sie Ihren Hubschrauber und den der anderen
Gruppen fliegen sehen. :-)

Kommunikation via MQTT
----------------------

Beim Start Ihres Programms, müssen Sich sich einen Spielernamen und einer Spieler-ID überlegen.
Dies geht in etwa so, wenn das Node-Module `readline-sync` installiert ist (`npm add readline-sync`):

```js
const player_name = readlineSync.question("Wie heißt du? ");
const player_id   = player_name + "-" + (Math.random() + 1).toString(36).substring(2);

readlineSync.question(`Okay, ${player_name}! Drücke ENTER, um das Spiel zu starten.`);
```

Anschließend kann eine Verbindung mit dem MQTT-Server hergestellt werden, dessen Verbindungsdaten
in den Umgebungsvariablen `MQTT_BROKER`, `MQTT_USERNAME` und `MQTT_PASSWORD` gespeichert sind.
Die Umgebungsvariable `MQTT_TOPIC` enthält den Topic-Prefix für alle Nachrichten: `vorlesung/catch-the-flag`.

Um eine Nachricht an den Game-Master zu schicken, muss diese an folgende Topic adressiert werden,
wobei `...` die Spieler ID sein muss:

**Nachricht vom Spieler an den Game-Master:** `vorlesung/catch-the-flag/player/...`

Der Game-Master sendet seine Nachrichten wiederum an:

**Nachricht vom Game-Master an einen Spieler:** `vorlesung/catch-the-flag/game-master/player/...`

Auch hier entspricht `...` der Spieler ID.

**ACHTUNG:** Es handelt sich um keine Request/Response-Verfahren. Beide Seiten können sich jederzeit
gegenseitig Nachrichten schicken!

Spiel beitreten und verlassen
-----------------------------

Um das Spiel zu starten, muss man ihm erst beitreten, indem man folgende Nachricht an den
Game-Master schickt:

```json
{
    "message": "join",
    "name": "Name des Spielers",
}
```

Entsprechend kann man das das Spiel verlassen mit:

```json
{
    "message": "leave"
}
```

Will man das Spiel beenden, aber noch nicht verlassen (damit die Spielfigur im Weblcient sichtbar
bliebt), schickt man:

```json
{
    "message": "finish"
}
```

Statusmeldungen des Game-Masters
--------------------------------

Der Game-Master schickt jede Sekunde einen aktuellen Spielstatus an jeden Spieler.
Dieses kann man auswerten und daraufhin entscheiden, welche Spielaktion man auslösen will.
Am interessantesten sind hierfür folgende Attribute:

 * `next_flag`: Richtung und Entfernung zur nächsten Flagge
 * `nearest_players`: In Radarreichweite befindliche Spieler
 * `weapon_amo`: Verfügbare Munition für Angriffe

**ACHTUNG:** Der Game-Master sendet auch andere Nachrichten. Prüfen Sie daher immer den
Wert des `message`-Attributs.

```json
{
    "message": "player-status",                 // Art der Nachricht
    "id": "Dennis-zhy0xq476s",                  // Spieler ID
    "name": "Dennis",                           // Spieler Name
    "playing": false,                           // Spieler nimmt am Spielt teil
    "crashed": false,                           // Spieler ist abgestürzt
    "finished": false,                          // Spieler hat das Spiel beendet
    "all_flags": false,                         // Spieler hat alle Flaggen eingesammelt
    "left_game": false,                         // Spieler hat das Spiel verlassen
    "timestamp": 1710740614718,                 // Zeitstempel des letzten Status-Updates (Millisekunden seit dem 01.01.1970, 0:00 Uhr)
    "last_seen": 1710740614372,                 // Zeitstempel der letzten Spielaktion
    "start_time": 0,                            // Zeitstempel, wann der Spieler das Spiel begonnen hat
    "end_time": 0,                              // Zeitstempel, wann der Spieler das Spiel beendet hat
    "health": 100,                              // Lebensenergie des Spielers (wichtig für Angriffe, siehe Waffen unten)
    "position": {                               // Aktuelle Position
        "lat": 49.007911187451874,              //  - Breitengrad
        "lon": 8.376294851473187,               //  - Längengrad
        "alt": 0,                               //  - Höhe in Metern
        "rot": 0                                //  - Kompassrichtung in Grad, 0 = N, 90 = O, 180 = S, 270 = W
    },
    "speed": {                                  // Fluggeschwindigkeit
        "kmh_f": 0,                             //  - Vorwärts-Fluggeschwindigkeit in km/h
        "kmh_s": 0,                             //  - Seitwärts-Fluggeschwindigkeit in km/h
        "kmh_h": 0                              //  - Höhen-Fluggeschwindigkeit in km/h
    },
    "max_values": {                             // Maximal zulässige Flugwerte (für den Game-Master intern  )
        "kmh_f": 50,                            //  - Vorwärts-Fluggeschwindigkeit in km/h
        "kmh_s": 20,                            //  - Seitwärts-Fluggeschwindigkeit in km/h
        "kmh_h": 5,                             //  - Höhen-Fluggeschwindigkeit in km/h
        "alt": 500,                             //  - Maximale Höhe in m
        "acc_s": 1.1,                           //  - Beschleunigungsfaktor je Sekunde
        "deg_s": 5                              //  - Maximale Rotationsänderung je Sekunde in Grad
    },
    "flight_input": {                           // Flugsteuerung (Eingaben des Spielers, alle von -1...1)
        "forward": 0,                           //  - Flughebel Vor/Zurück
        "sideward": 0,                          //  - Flughebel Rechts/Links
        "height": 0,                            //  - Flughebel Hoch/Runter
        "rotation": 0,                          //  - Flughebel Drehung
        "honk": false                           //  - Hupe an/aus
    },
    "next_flag": {                              // Nächste zu erreichende Flagge
        "index": 0,                             //  - Tabellenindex (Game-Master intern)
        "data": {                               //  - Daten zur Flagge
            "lat": 49.0288367208213,            //     - Breitengrad
            "lon": 8.384767980547116,           //     - Längengrad
            "alt": 18,                          //     - Höhe
            "nam": "Energieberg",               //     - Name
            "spk": "Los geht's!"                // - Funkspruch
        },
        "distance": {                           //  - Richtung und Entfernung 
            "len": 2407.4567382933756,          //     - Entfernung in Metern
            "lat": 0.020925533369428706,        //     - Breitenunterschied in Grad
            "lon": 0.008473129073928831,        //     - Längenunterschied in Grad
            "alt": 18,                          //     - Höhenunterschied in Metern
            "rot": 22.04392043356938            //     - Kompasswinkeldifferenz in Grad (0 = in Flugrichtung)
        }
    },
    "captured_flags": [                         // Namen der bereits erreichten Flaggen (Strings)
        "DHBW Karlsruhe",
    ],
    "nearest_players": [{                       // In Radar-Reichweite befindliche Spieler
        "id":  "Dennis2-ybc4qv734t",            //  - Spieler ID
        "nam": "Dennis2",                       //  - Spieler Name
        "len": 2407.4567382933756,              //  - Entfernung in Metern
        "lat": 0.020925533369428706,            //  - Breitenunterschied in Grad
        "lon": 0.008473129073928831,            //  - Längenunterschied in Grad
        "alt": 18,                              //  - Höhenunterschied in Metern
        "rot": 22.04392043356938                //  - Kompasswinkeldifferenz in Grad (0 = in Flugrichtung)
    }],
    "radar_sight_distance": 5000,               // Radarreichweite in Metern
    "weapon_amo": {                             // Waffen-Munition für Angriffe auf andere Spieler
        "water_gun": 10000,                     //  - Wasserwerfer (geringer Schaden)
        "machine_gun": 5000,                    //  - Maschinengewehr (mittlerer Schaden)
        "torpedo": 5                            //  - Torpedo (großer Schaden)
    }
}
```

Hubschrauber steuern
--------------------

Um seinen Hubschrauber zu steuern, antwortet man am besten auf eine Statusmeldung des Game-Masters
und sendet ihm folgende Nachricht:

```json
{
    "message": "fly",
    "forward": 1,
    "sideward": 0,
    "height": 0,
    "rotation": 0,
    "honk": false
}
```

Die vier Zahlen stehen für die Flughebel zur Steuerung von:

1. Vorwärts/Rückwärts-Flug
1. Rechts/Links-Flug
1. Hoch/Runter-Flug
1. Drehung in Vorwärtsrichtung

Positive Werte bedeuten vorwärts / rechts / hoch, negative Werte rückwärts / links / runter.
Als Wertebereich sind alle Zahlen von -1 bis 1 zulässig.

`honk` ist die Hupe.

Andere Spieler angreifen
------------------------

Tauchen auf dem Radar andere Spieler auf, können Sie ggf. angegriffen werden. Dies geschieht
durch folgende Nachricht an den Game-Master:

```json
{
    "message": "attack",
    "weapon": "water_gun",                          // Name der Waffe: water_gun, machine_gun, torpedo
    "amount": 10,                                   // Anzahl abgegebener Schuss
    "target_player_id": "Dennis2-ybc4qv734t",       // Spieler ID des angegriffenen Spielers
}
```

Der Angriff wirkt aber nur, wenn der andere Spieler nahe genug ist. Dies teilt der Game-Master
nach Beitritt zum Spiel einmalig durch folgende Nachricht an den Spieler mit:

```json
{
    "message": "weapon-info",
    "water_gun": {
        "d_health": 0,
        "x_rot": 5,
        "x_alt": 1,
        "max_d_len": 80,
        "max_d_alt": 20
    },
    "machine_gun": {
        "d_health": 5,
        "x_rot": 15,
        "x_alt": 10,
        "max_d_len": 100,
        "max_d_alt": 25
    },
    "torpedo": {
        "d_health": 45,
        "x_rot": 45,
        "x_alt": 75,
        "max_d_len": 500,
        "max_d_alt": 50
    }
}
```

`max_d_len` und `max_d_alt` sind die zulässigen Maximalabstände in der Ebene bzw. in der Höhe.