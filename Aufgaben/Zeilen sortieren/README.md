Aufgabe: Zeilen sortieren
=========================

Schreiben Sie ein Programm, dass den `sort`-Befehl von Unix nachbildet. Das Programm soll
über seinen Standard Input so lange Textzeilen einlesen und in einem Array ablegen, bis das
sendende Programm den Datenstrom schließt. Anschließend soll das Array sortiert und mit
`console.log()` zeilenweise auf dem Standard Output ausgegeben werden.

Hier sind die wichtigsten Schritte für die Umsetzung:

1. __Einlesen von Daten über `stdin`:__

   Das Programm soll zeilenweise Text einlesen, ähnlich wie `sort` unter Unix.

   Dazu nutzen wir `process.stdin.on("data", callback)`.

1. __Speicherung der Zeilen in einem Array:__

   Die eingelesenen Daten müssen in einem Array zwischengespeichert werden. Dabei muss beachtet
   werden, dass die Daten als Zeichenstrom angeliefert werden, der bei jedem Zeilenendezeichen
   `"\n"` in Einzelzeilen aufgetrennt werden muss. Die Einzelzeilen müssen dann, da die Daten
   in mehreren Blöcken ankommen können, dem eigentlichen Array angehängt werden. Leerzeilen sollen
   ignoriert werden.

1. __Sortierung der Zeilen:__

   Nach vollständigem Einlesen soll das Array mit `meinArray.sort()` sortiert werden.

1. __Ausgabe auf `stdout`:__

   Die sortierten Zeilen sollen zeilenweise auf `stdout` ausgegeben werden.