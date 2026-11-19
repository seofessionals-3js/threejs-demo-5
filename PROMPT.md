# Startprompt · seofessionals three.js Demo 5

Der Prompt, mit dem ich anfangen würde, um diese Demo nachzubauen. Er liefert nicht genau diese Seite, sondern eine erste Version der Idee. Danach beginnt die eigentliche Arbeit.

Ersetzen Sie die Teile in `[eckigen Klammern]` durch Ihr eigenes Thema.

```text
Ich möchte eine Landingpage bauen für [ein Planungs- und Bauunternehmen, Ihr Thema], die
verspricht: „Ihr Haus in [14 Wochen].“

Die Idee: Ein Bauzeitenplan, das Gantt-Diagramm, nach dem Bauleute arbeiten, sitzt in einem
Dock über die volle Breite am unteren Bildschirmrand: schraffierte Balken, die Wochen oben, eine
orange „Heute“-Linie. Darüber liegt die Baustelle, noch leer. Das Mausrad bewegt die
Heute-Linie, und das Haus baut sich in Bauabfolge selbst: [Bauzaun und Container, Aushub,
Fundamente, Holzrahmen, Decken, Wände, Dach, Fenster, Fassade und Ausbau, Möbel]. Scrollt man
zurück, baut es sich wieder ab.

Was Besucher sehen, der Reihe nach:
1. Baustelleneinrichtung und Aushub: Ein Zaun entsteht, ein Bagger hebt die Grube aus.
2. Ein Kran setzt jeden Rahmen, jedes Wand- und Dachelement, mit etwas Pendeln und einer
   weichen Landung.
3. Die Fassade kommt dran, der Rasen wächst, innen gehen die Lichter an.
4. Bei der Übergabe verschwindet die Baustellenausrüstung, die Haustür schwingt auf, und die
   Kamera geht hinein durch [den Eingang, den Wohnraum, die Küche, die Treppe hinauf zur
   Galerie] und endet [auf der Galerie über dem zweigeschossigen Raum].

Worauf es mir ankommt:
- Das Diagramm ist kein Bild. Eine einzige Tabelle von Phasen (Name, Startwoche, Endwoche)
  zeichnet die Balken und entscheidet, wann jedes Teil des Hauses existiert. Jedes Teil kennt
  seine Phase und seine Reihenfolge darin.
- Die aktive Phase ist an beiden Stellen orange: Ihr Balken füllt sich, und das Teil, das
  gerade gesetzt wird, bekommt orange Kanten.
- Die Kamera hält während des Baus eine hohe Dreiviertelansicht, sodass sich das Gebäude
  bewegt. Ziehen am Diagramm spult ebenfalls, und ein Play-Button lässt den Bau ablaufen.
- Nicht comichaft: Beton, Brettschichtholz, OSB, verkohlte Lärche, Zink und Eiche, im Code
  texturiert, weiche Schatten, eine Sonne, die mit den Wochen steigt, feine Tuschekanten.
  Die Daten zählen Arbeitstage.
- Der Look: Papier #f2efe7, Tusche #1d1c19, ein Orange #e85d04, Chakra Petch für
  Überschriften, IBM Plex Mono für Beschriftungen, CAD-Eckmarken und eine dunkle Anzeige mit
  Woche, Datum und Phase.
- three.js 0.169 von einem CDN, einfache Dateien, kein Build-Schritt. Keine Bilddateien.

Bevor du Code schreibst, schlage das Haus mit Maßen vor, die Phasen mit ihren Wochen und die
Kamera für den Bau und für den Rundgang innen, und warte auf meine Antwort. Dann baue in
Etappen. Nur die erste Etappe: das Dock mit dem Bauzeitenplan, die Baustelle und der Bau bis
zu den Rahmen. Nimm es auf und zeig es mir, bevor du weitermachst.
```

Der letzte Absatz ist genauso wichtig wie die Idee. Ohne ihn bekommen Sie eine fertige Seite, die Sie nicht selbst ausgewählt haben.
