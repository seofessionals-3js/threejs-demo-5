# three.js Demo 5 · Projekt Steininger

Der Bauzeitenplan von Projekt Steininger, angedockt am unteren Bildschirmrand, und darüber die Baustelle am Hang. Mit dem Mausrad bewegt sich die Heute-Linie durch 38 Wochen: Ein Bauzaun entsteht, der Hang wird ausgehoben, ein Turmdrehkran setzt jedes Wandelement, jede Deckenplatte und jede Scheibe, während sich der zugehörige Balken füllt. Ein Schild am Bauteil nennt, was gerade gesetzt wird, mit Maßen und Material. Dann kommen Travertin, Eichendielen, der Pool und die Möbel. Bei der Übergabe öffnet sich die Tür zum Hof, und Sie gehen durch das Wohngeschoss, die Treppe hinab ins Poolgeschoss und hinaus an den Pool. Scrollen Sie zurück, und das Haus baut sich wieder ab.

[**Live ansehen**](https://seofessionals-3js.github.io/threejs-demo-5/?dir=a) · [**Startprompt**](PROMPT.md) · [**Alle Demos**](https://seofessionals-3js.github.io/threejs-demos/)

Die Seite öffnet in Woche 12, mitten im Bau. `?dir=a&wk=0&open` startet stattdessen mit dem vollständigen Bauzeitenplan in Woche 0. Ziehen Sie am Diagramm, um zu spulen, oder drücken Sie **Abspielen**.

Drei Varianten mit demselben Code: `?dir=a` der Bauzeitenplan (die Hauptdemo), `?dir=b` der Fundamentplan im Maßstab 1:1 auf den Hang gedruckt, `?dir=c` die Zeitraffer-Kamera des Bauunternehmers.

## So funktioniert es

- **Eine Tabelle steuert alles.** `PHASES` in `house.js` (Name, Startwoche, Endwoche) zeichnet die Balken und entscheidet, wann jedes Teil des Hauses existiert. Der Scroll ist ein Datum, und Diagramm und Modell lesen dieselbe Zahl.
- **Jedes Teil kennt seine Phase.** `add(obj, phase, order, how)` platziert es innerhalb seines Phasenbalkens, und es kommt per Kran, wächst hoch, wächst nach oder erscheint. `update(week)` ist eine reine Funktion der Woche, deshalb funktioniert auch das Zurückscrollen.
- **Das Haus ist eine Liste.** Wände, Decken und Dächer stehen als Zeilen mit Maßen in `house.js`. `wall()` teilt eine Wand in Fertigteile von etwa 3,30 m, `slab()` eine Decke in Streifen, und beide hängen die Oberflächen an, die später darüber kommen: Travertin außen, Putz und Eiche innen, Holz unter den Auskragungen.
- **Was in Arbeit ist, ist markiert.** Wie auf einer Lichtpause mit Textmarker: Die aktive Phase füllt sich im Diagramm gelb, die Heute-Linie ist gelb, und das Teil, das gerade gesetzt wird, bekommt gelbe Kanten. Alles Gebaute ist violett gezeichnet oder in den Baustoffen des Hauses gehalten.
- **Jedes Teil hat einen Namen.** Beim Anlegen bekommt jedes Bauteil eine Zeile mit Bezeichnung, Maßen und Material (`info` in `add()`). `label()` liefert das Teil, das gerade in Arbeit ist, und die Seite zeigt es als Schild mit Hinweislinie am Bauteil und in der Anzeige unten links.
- **Die Baustelle lebt.** `site.js` stellt alles dazu, was nicht zum Haus gehört: Bagger, Kipper, Fahrmischer und Tieflader, Deckenstützen unter jeder Decke, das Fassadengerüst, Absturzsicherung, Materiallager, Bauschild und Figuren mit Helm, jedes mit den Wochen, in denen es da ist.
- **Der Hang ist ein Netz.** `buildGround()` hebt die Baugrube aus und verfüllt sie wieder. Höhenlinien im Abstand von 50 cm lassen das Gelände wie einen Lageplan lesen. In den letzten Wochen wächst der Rasen vom Haus aus über den Hang.
- **Der Kran** dreht seinen Ausleger zu dem Teil, das er gerade setzt, und fährt die Laufkatze darüber (`tick()` in `house.js`, das Fachwerk in `site.js`).
- **Materialien im Code.** Beton, Travertin, Eiche, Nussbaum, Putz und Kies sind Canvas-Texturen mit maßstäblichen UVs. Die Daten zählen Arbeitstage.
- **Der Rundgang innen** ist ein Catmull-Rom-Spline durch sechs Stationen.

## Das Haus in Zahlen

Ebenen auf -3,20 (Poolgeschoss), 0,00 (Wohngeschoss) und +3,20 (Obergeschoss), Dächer auf +6,80 und +7,60. Grundfläche 14,6 mal 12 m in zwei Feldern. Der obere Baukörper des Nordfelds kragt 4,8 m über den Balkon aus. Der Pool misst 6,6 mal 11,2 m und steht auf der Böschung unter der Terrasse. Es ist dasselbe Haus wie in [Demo 4](https://seofessionals-3js.github.io/threejs-demo-4/).

## Bedienung und Barrierefreiheit

- **Abspielen** (oder `P`) lässt den Bau für Sie ablaufen. Mausrad, Berührung oder eine Pfeiltaste übernehmen wieder.
- **Ansicht** öffnet die Optionen: Bewegung reduzieren (folgt auch der Systemeinstellung: kein Pendeln am Haken, kein Nachlauf, die Kamera springt), größere Beschriftung, höherer Kontrast (folgt auch der Systemeinstellung) und Sprünge zu zehn Kapiteln (Tasten `1` bis `0`). Die Auswahl wird im Browser gespeichert und gilt auch für Demo 4.
- Die Pfeiltasten bewegen die Heute-Linie um eine halbe Woche, `Bild ↑` und `Bild ↓` um zwei Wochen, `Pos1` und `Ende` springen an den Anfang und vor die Haustür. Der Regler in der Leiste lässt sich mit der Tastatur bedienen.
- Ein Screenreader bekommt eine Zusammenfassung der Bauphasen und eine gesprochene Zeile mit der aktuellen Woche, dem Bauteil in Arbeit oder dem Raum.

## Farben und Schriften

Das Medium ist eine Lichtpause (Diazo): Papier `#eeedea`, Diazoviolett `#3d3492` für alle Linien, Schrift, Balken und Höhenlinien (dunkle Tafeln in tiefem Indigo `#231d5e`), Textmarker-Gelb `#ffd23c` als einzige Akzentfarbe für das, was gerade in Arbeit ist (kleine Schrift auf Papier in `#8a5b00`). Noch nicht Gebautes ist papierweiß mit violetten Kanten, Gebautes hat die Baustoffe aus Demo 4: Travertin, Beton, Eiche, Nussbaum, Schalungsgelb, Rasen `#86a05e`. BBH Bogle für Überschriften, Arimo für alles, was gelesen wird. Beide Schriften liegen in `fonts/` (SIL Open Font License, Lizenztexte daneben). BBH Bogle enthält keine Umlaute, deshalb kommen die Überschriften ohne aus.

## Dateien

`index.html` (Seitensteuerung, Ansichtsoptionen, Zusammenfassung), `sketch.css` (Farben, Schriften, Layout), `view.js` (Kamera, Eingabe, HUD, das Gantt-Diagramm, der gedruckte Plan), `house.js` (Phasen, Gelände, Materialien, jedes Bauteil mit Bezeichnung, Maßen und Material), `site.js` (Kran, Maschinen, Stützen, Gerüst, Lager, Figuren, Bauschild), `quality.js` (Geräteklasse, Auflösung nach Bildrate), `access.js` (Abspielen, Ansichtsoptionen, Kapitel, Tasten, gesprochene Zeile).

Parameter: `wk` (Woche 0 bis 38), `shot` (Kamera: `sig`, `a2`, `top`, `path`, `inside`), `room` (`entry`, `kitchen`, `living`, `stair`, `lounge`, `terrace`), `open` (nur der Plan), `q` (`low`, `mid`, `high`: Geräteklasse erzwingen), `dpr` (Auflösung festlegen), `rec` (Bildpuffer für Aufnahmen behalten), `always` (jedes Bild zeichnen, zum Messen).

## Läuft auch auf dem Handy

Die Seite fragt einmal, worauf sie läuft (`quality.js`), und richtet sich danach:

- **Ein Haus, wenige Zeichenaufrufe.** Die rund 1 500 Bauteile sind keine einzelnen Objekte mehr. `add()` schreibt jedes Teil in einen Stapel je Material, und jede Ecke trägt die Wochen ihres Teils. Der Vertex-Shader senkt, hebt und färbt alle Teile aus einer einzigen Zahl, der Woche. Statt bis zu 1 300 Zeichenaufrufen je Bild sind es 20 bis 70.
- **Der Aushub läuft im Shader.** Jeder Punkt des Geländes kennt seine Höhe im gewachsenen Hang, in der Baugrube und im fertigen Gelände, zwei Zahlen blenden dazwischen.
- **Gezeichnet wird nur, wenn sich etwas ändert.** Steht die Woche und ruht der Kran, zeichnet die Seite kein einziges Bild, und die Schattenkarte entsteht nur neu, wenn sich ein Bauteil, der Kran oder die Sonne bewegt hat.
- **Auflösung nach Bildrate.** Ein Handy beginnt mit etwa 0,75 Megapixeln, wird das Bild langsam, geht die Auflösung in kleinen Schritten zurück und später vorsichtig wieder hinauf. Schattenkarte, Geländeraster, Baumkronen und Texturfilter richten sich nach der Geräteklasse.
- **Die Anzeige schreibt nur, was sich geändert hat.** Das Balkendiagramm wird einmal für seine Größe gezeichnet, danach ändern sich nur Balkenlängen und die Heute-Linie.
- **Hochformat und Querformat.** Auf dem Handy tritt die Kamera zurück und öffnet das Objektiv, bis das ganze Grundstück ins Bild passt. Oben stehen drei kurze Zeilen, unten der Plan mit einer Karte fester Höhe. Wischen bewegt die Wochen, Ziehen am Diagramm spult.

## Lokal starten

Die Seiten nutzen JavaScript-Module und brauchen deshalb einen lokalen Server. Ein Doppelklick auf `index.html` funktioniert nicht.

```bash
python -m http.server 8000
```

Dann http://localhost:8000/ öffnen, auf dem Laptop oder auf dem Handy.

## Herkunft und Lizenz

Basiert auf „Schedule Build“ aus [flat-to-3d](https://github.com/Sam1983Aing/flat-to-3d) von Samnang Aing, veröffentlicht unter der MIT-Lizenz. Haus, Gelände, Kran, Rundgang, Gestaltung und Bedienung wurden für Projekt Steininger neu entwickelt. Die Lizenz liegt unverändert in [LICENSE](LICENSE).

Projekt Steininger ist ein erfundenes Haus. Konzept, UX und three.js-Umsetzung: Micha Schwan, UX Designer, schwanmicha07@gmail.com. three.js (MIT) wird von einem CDN geladen.
