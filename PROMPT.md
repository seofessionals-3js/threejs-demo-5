# Startprompt · three.js Demo 5

Der Prompt, mit dem ich anfangen würde, um diese Demo nachzubauen. Er liefert nicht genau diese Seite, sondern eine erste Version der Idee. Danach beginnt die eigentliche Arbeit.

Ersetzen Sie die Teile in `[eckigen Klammern]` durch Ihr eigenes Thema.

```text
Ich möchte eine Landingpage bauen für [ein Planungs- und Bauunternehmen, Ihr Thema], die
verspricht: „Ihr Haus in [38 Wochen].“

Die Idee: Ein Bauzeitenplan, das Gantt-Diagramm, nach dem Bauleute arbeiten, sitzt in einem
Dock über die volle Breite am unteren Bildschirmrand: schraffierte Balken, die Wochen oben, eine
grüne „Heute“-Linie. Darüber liegt die Baustelle [an einem Hang], noch leer. Das Mausrad bewegt
die Heute-Linie, und das Haus baut sich in Bauabfolge selbst: [Bauzaun und Container, Aushub,
Fundamente, Poolgeschoss, Wohngeschoss, Obergeschoss, Dächer, Verglasung, Travertin und Ausbau,
Pool und Möbel]. Scrollt man zurück, baut es sich wieder ab.

Was Besucher sehen, der Reihe nach:
1. Baustelleneinrichtung und Aushub: Ein Zaun entsteht, ein Bagger hebt die Grube aus dem Hang.
2. Ein Turmdrehkran setzt jedes Wandelement, jede Deckenplatte und jede Scheibe, mit etwas
   Pendeln und einer weichen Landung. Sein Ausleger dreht sich zu dem Teil, das er setzt.
3. Die Fassade kommt dran, der Pool füllt sich, innen gehen die Lichter an.
4. Bei der Übergabe verschwindet die Baustelleneinrichtung, die Haustür schwingt auf, und die
   Kamera geht hinein durch [den Eingang, die Küche, den Wohnraum, die Treppe hinab ins
   Poolgeschoss] und endet [am Pool, mit Blick zurück auf das ganze Haus].

Worauf es mir ankommt:
- Das Diagramm ist kein Bild. Eine einzige Tabelle von Phasen (Name, Startwoche, Endwoche)
  zeichnet die Balken und entscheidet, wann jedes Teil des Hauses existiert. Jedes Teil kennt
  seine Phase und seine Reihenfolge darin.
- Das Haus ist eine Liste von Wänden, Decken und Dächern mit Maßen. Aus jeder Zeile entstehen
  die Fertigteile und später die Oberflächen darüber.
- Die aktive Phase ist an beiden Stellen grün: Ihr Balken füllt sich, und das Teil, das
  gerade gesetzt wird, bekommt grüne Kanten.
- Jedes Bauteil hat eine Bezeichnung, seine Maße und sein Material. Ein Schild mit
  Hinweislinie zeigt sie am Teil, das gerade gesetzt wird, und unten in der Anzeige.
- Die Baustelle ist belebt: Bagger, Lkw, Deckenstützen, Gerüst, Materiallager, ein Bauschild
  und Maßstabsfiguren mit Helm kommen und gehen mit den Wochen.
- Die Kamera hält während des Baus eine hohe Dreiviertelansicht, sodass sich das Gebäude
  bewegt. Ziehen am Diagramm spult ebenfalls, und ein Play-Button lässt den Bau ablaufen.
- Nicht comichaft: [Beton, Travertin, Eiche, Nussbaum, Putz und Kies], im Code texturiert,
  weiche Schatten, eine Sonne, die mit den Jahreszeiten steigt und fällt, feine Tuschekanten,
  Höhenlinien auf dem Gelände. Die Daten zählen Arbeitstage.
- Der Look: Papier #f1f0e6, Waldgrün #10241a, Blattgrün #5fa512 auf Papier, Limette #c4f03e
  auf Dunkel, BBH Bogle für Überschriften, Arimo für Beschriftungen, Passermarken in den Ecken
  und eine dunkle Anzeige mit Woche, Datum und Phase.
- Bedienbar für alle: Abspielen, Pfeiltasten, Sprünge zu Kapiteln, Optionen für reduzierte
  Bewegung, größere Beschriftung und höheren Kontrast, eine Zusammenfassung für Screenreader.
- three.js 0.169 von einem CDN, einfache Dateien, kein Build-Schritt. Keine Bilddateien.

Bevor du Code schreibst, schlage das Haus mit Maßen vor, die Phasen mit ihren Wochen und die
Kamera für den Bau und für den Rundgang innen, und warte auf meine Antwort. Dann baue in
Etappen. Nur die erste Etappe: das Dock mit dem Bauzeitenplan, die Baustelle und der Bau bis
zur ersten Decke. Nimm es auf und zeig es mir, bevor du weitermachst.
```

Der letzte Absatz ist genauso wichtig wie die Idee. Ohne ihn bekommen Sie eine fertige Seite, die Sie nicht selbst ausgewählt haben.
