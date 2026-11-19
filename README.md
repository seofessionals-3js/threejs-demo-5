# seofessionals three.js Demo 5

Ein Bauzeitenplan, angedockt am unteren Bildschirmrand, und darüber die Baustelle. Mit dem Mausrad bewegt sich die Heute-Linie: Ein Bauzaun entsteht, die Grube wird ausgehoben, ein Kran setzt jeden Rahmen, jedes Wand- und Dachelement, während sich sein Balken füllt. Bei der Übergabe öffnet sich die Haustür, und Sie gehen hinein. Scrollen Sie zurück, und das Haus baut sich wieder ab.

[**Live ansehen**](https://seofessionals-3js.github.io/seofessionals-threejs-demo-5/?dir=a) · [**Startprompt**](PROMPT.md) · [**Alle Demos**](https://seofessionals-3js.github.io/seofessionals-threejs-demos/)

Die Seite öffnet in Woche 7, mitten im Bau. `?dir=a&wk=0&open` startet stattdessen mit dem vollständigen Bauzeitenplan in Woche 0. Ziehen Sie am Diagramm, um zu spulen, oder drücken Sie ▶ BAUEN.

Drei Varianten mit demselben Code: `?dir=a` der Bauzeitenplan (die Hauptdemo), `?dir=b` der Fundamentplan im Maßstab 1:1 auf dem Boden gedruckt, `?dir=c` die Zeitraffer-Kamera des Bauunternehmers.

## So funktioniert es

- **Eine Tabelle steuert alles.** `PHASES` in `house.js` (Name, Startwoche, Endwoche) zeichnet die Gantt-Balken und entscheidet, wann jedes Teil des Hauses existiert. Der Scroll ist ein Datum, und Diagramm und Modell lesen dieselbe Zahl.
- **Jedes Teil kennt seine Phase.** `add(obj, phase, order, how)` platziert es innerhalb seines Phasenbalkens, und es kommt per Kran, wächst hoch, wächst nach oder erscheint. `update(week)` ist eine reine Funktion der Woche, deshalb funktioniert auch das Zurückscrollen.
- **Aktiv ist orange.** Die aktive Phase füllt sich im Diagramm orange, und das Teil, das gerade gesetzt wird, bekommt orange Kanten.
- **Materialien im Code.** Beton, Brettschichtholz, OSB, verkohlte Lärche, Zink und Eiche sind Canvas-Texturen mit maßstäblichen UVs. Die Daten zählen Arbeitstage.
- **Der Rundgang innen** ist ein Catmull-Rom-Spline durch fünf Stationen.

## Dateien

`index.html`, `sketch.css`, `view.js` (Kamera, Eingabe, HUD, das Gantt-Diagramm), `house.js` (Phasen, Materialien, jedes Bauteil). Insgesamt etwa 135 KB.

Am besten auf einem Laptop. Diese Demo hat noch kein Handy-Layout.

## Lokal starten

Die Seiten nutzen JavaScript-Module und brauchen deshalb einen lokalen Server. Ein Doppelklick auf `index.html` funktioniert nicht.

```bash
python -m http.server 8000
```

Dann http://localhost:8000/ öffnen. Am besten auf einem Laptop mit aktuellem Browser.

## Herkunft und Lizenz

Basiert auf „Schedule Build“ aus [flat-to-3d](https://github.com/Sam1983Aing/flat-to-3d) von Samnang Aing, veröffentlicht unter der MIT-Lizenz, und für seofessionals ins Deutsche übersetzt. Die Lizenz liegt unverändert in [LICENSE](LICENSE).

Alle Büros, Häuser, Adressen und Kontaktdaten in der Demo sind erfunden. three.js (MIT) wird von einem CDN geladen, die Schriften Chakra Petch und IBM Plex Mono von Google Fonts (SIL Open Font License).
