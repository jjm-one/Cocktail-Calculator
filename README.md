# JJM's Cocktail-Calculator

Bilinguale (Deutsch/Englisch), responsive React-/TypeScript-Anwendung für Cocktailrezepte, Einkaufspreise, Bestellplanung, Rezeptskalierung, Schankverlust, Kommissionsware sowie Margen- und Break-even-Kalkulation. Die Anwendung läuft vollständig im Browser ohne Backend, ist als installierbare PWA offlinefähig und speichert alle Eingaben automatisch lokal.

Live: [https://jjm-one.github.io/Cocktail-Calculator/](https://jjm-one.github.io/Cocktail-Calculator/)

## Funktionen

- **Zweisprachig per URL**: `/de/…` und `/en/…`, umschaltbar über ein Sprach-Toggle im Header.
- **Getrennte Start- und Dashboard-Seite**: Landing-Intro für den Einstieg, eigenes Dashboard mit Kennzahlen, Bestellübersicht und Wirtschaftlichkeit.
- **EK-Posten** mit CSV-Import/-Export, Preisangabe netto/brutto, Kommissionsregeln, Lagerbestand je Produkt (reduziert automatisch die berechnete Bestellmenge) sowie Suche/Filter.
- **Rezepte** verwalten, duplizieren, als JSON importieren/exportieren, per Suche filtern, sowie ein separater Rezept-Skalierer auf beliebige Zielmengen (PDF/CSV-Export).
- **Bestellplanung** je Cocktail nach Stückzahl oder Flüssigkeitsmenge, inklusive Warnbanner bei fehlender EK-Zuordnung und einer Funktion, um die Einkaufsliste als Text in die Zwischenablage zu kopieren.
- **Kalkulation** mit Wareneinsatz, Marge, Deckungsbeitrag, Gebindeüberhang, Break-even (mit/ohne Kommission) je Cocktail und gesamt.
- **Export**: PDF-Bericht (komplett oder Kalkulation/Bestellmengen einzeln), Excel-Arbeitsmappe, CSV-Paket, Rezepte- sowie Komplett-Backup als JSON – alle mit App-Version und Exportdatum.
- **Robuster Import**: CSV- und JSON-Importe werden strukturell validiert, melden übersprungene/fehlerhafte Einträge und warnen bei abweichender Sicherungsversion, statt kommentarlos abzubrechen.
- **Lokale Speicherung ohne Backend**: automatisches Speichern im Browser; für einen Geräte- oder Browserwechsel steht ein Download/Upload der kompletten Konfiguration bereit.
- **Offline nutzbar (PWA)**: nach dem ersten Laden funktioniert die Anwendung inklusive Standardrezepten und -preisen vollständig ohne Internetverbindung und lässt sich auf dem Startbildschirm installieren.
- **Zweisprachige Hilfe-Seite** mit Ablaufbeschreibung, Kennzahlen-Erklärung, Offline-/Installationshinweisen und einer Referenz aller Import-/Export-Dateiformate.

## Tech-Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/) für das sprachpräfigierte URL-Routing
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox) für Service Worker, Manifest und Offline-Precaching
- [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) für PDF-Exporte, [SheetJS/xlsx](https://sheetjs.com/) für Excel-Exporte
- [Vitest](https://vitest.dev/) für Unit-Tests

## Entwicklung

Voraussetzungen: Node.js ≥ 24.18.0 und npm ≥ 11 (siehe `engines` in `package.json`).

```bash
npm install
npm run dev
```

Alternativ das Repository in VS Code mit **Dev Containers: Reopen in Container** öffnen. Der Devcontainer verwendet Node.js 24 auf Debian Bookworm, aktualisiert npm auf `12.0.2`, installiert die Projektabhängigkeiten automatisch und leitet Port `5173` weiter. `node_modules` liegt in einem eigenen Docker-Volume (`jjm-one-cocktail-calculator-node-modules`), damit Abhängigkeiten nicht mit dem Host-Dateisystem kollidieren – das funktioniert auch, wenn der lokale Projektordner Leerzeichen im Namen enthält.

Im Entwicklungsmodus läuft die App unter der Root-URL (`http://localhost:5173/de/…`); der GitHub-Pages-Unterpfad wird nur für den Produktionsbuild verwendet (siehe [Deployment](#deployment)).

### Verfügbare Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit Hot-Reload |
| `npm run build` | Typprüfung (`tsc -b`) + Produktionsbuild nach `dist/` |
| `npm run preview` | Lokales Ausliefern des Produktionsbuilds |
| `npm run typecheck` | Nur Typprüfung, ohne Build |
| `npm test` | Unit-Tests einmalig ausführen |
| `npm run test:watch` | Unit-Tests im Watch-Modus |

## Tests

Die Kernlogik (`src/lib/`) ist mit [Vitest](https://vitest.dev/) unit-getestet: Preis-/Einheitenumrechnung, die vollständige Bestell- und Kalkulationsberechnung (`compute()`, inklusive Lagerbestand-Verrechnung, fehlender EK-Posten und Break-even), CSV-Parsing sowie die Validierung von Import-Dateien (Komplettsicherung und Rezepte-JSON, inklusive Erkennung fehlerhafter oder veralteter Dateien). Testdateien liegen als `*.test.ts` neben dem jeweils getesteten Modul.

```bash
npm test
```

Der Workflow `.github/workflows/deploy-pages.yml` führt `npm test` bei jedem Push und Pull-Request auf `main` aus, **bevor** Typprüfung, Build und Deployment starten – ein fehlgeschlagener Test blockiert damit auch das Deployment.

## Deployment

Das Repository ist für automatisches Deployment auf GitHub Pages über GitHub Actions eingerichtet.

### Einmalige Einrichtung

1. Repository zu GitHub pushen (Standardbranch `main`).
2. In **Settings → Pages → Build and deployment** als Source **GitHub Actions** auswählen.
3. Einen Push auf `main` ausführen oder den Workflow unter **Actions → Test, build and deploy GitHub Pages → Run workflow** manuell starten.

### Pipeline

Der Workflow `.github/workflows/deploy-pages.yml`:

- installiert Node.js 24.18.1 und npm 12.0.2,
- führt die Unit-Tests aus (`npm test`),
- führt Typprüfung und Produktionsbuild aus (`npm run build`),
- lädt `dist/` als Build-Artefakt hoch,
- deployt bei Push auf `main` bzw. manueller Ausführung auf GitHub Pages,
- führt bei Pull Requests gegen `main` nur Test und Build aus, ohne zu deployen.

### Projektpfad & Routing

Die App nutzt echtes URL-Routing (`/de/…`, `/en/…`). Da GitHub Pages als Projekt-Seite unter `https://jjm-one.github.io/Cocktail-Calculator/` läuft, ist die Vite-Basis in `vite.config.ts` für den Produktionsbuild fest auf `/Cocktail-Calculator/` gesetzt (im Entwicklungsmodus dagegen `/`, für saubere lokale URLs). Der Build kopiert `index.html` zusätzlich nach `404.html`, damit GitHub Pages tief verlinkte Routen (z. B. `/Cocktail-Calculator/de/recipes`) beim direkten Aufruf oder Neuladen an die React-Router-App ausliefert.

Bei einem Umzug auf ein anderes Repository, eine Organisations-/Benutzer-Page oder eine eigene Domain muss dieser feste Pfad in `vite.config.ts` (und die PWA-`start_url`/`scope`) entsprechend angepasst werden.

### Lokale Produktionsprüfung

```bash
npm install
npm run build
npm run preview
```

Der fertige statische Build liegt anschließend im Verzeichnis `dist/`, inklusive Service Worker (`sw.js`), Web-App-Manifest (`manifest.webmanifest`) und `404.html`.

### Datenhaltung

GitHub Pages stellt ausschließlich statische Dateien bereit. Eingaben und Einstellungen werden im jeweiligen Browser gespeichert (siehe [Funktionen](#funktionen)). Für den Umzug auf ein anderes Gerät dient der vollständige Konfigurations-Download/-Upload auf der Daten-Seite.

## CSV-Import für EK-Posten

Unterstützte Spalten:

```text
ingredient, product, package_ml, price, tax_rate, price_basis, commission, units_per_case, active, stock_units, source
```

Einige Spalten erkennen zusätzlich deutsche Alternativnamen beim Import (z. B. `zutat`, `produkt`, `preis`). Die vollständige Spaltenreferenz mit Beispielwerten sowie die Formate der Rezepte- und Komplettsicherungs-JSON-Dateien stehen auf der Hilfe-Seite der Anwendung unter „Dateiformate im Detail“.

Die Standardpreisliste liegt ausschließlich unter `public/default-prices.csv` und wird beim ersten Start beziehungsweise beim Laden der Werkseinstellungen verwendet.

## Standard-EK-Preisliste Januar 2026

Die Werkseinstellungen enthalten 62 EK-Posten, die aus einer bereitgestellten **Festpreisliste Januar 2026** abgeleitet wurden. Enthalten sind für die Cocktailplanung relevante Spirituosen, Mixer, Limonaden, Säfte, Wasser, Sekt und Wein.

- Die Preisliste weist Nettopreise aus; daher sind die Posten mit `price_basis = net` hinterlegt.
- Mehrfachgebinde wurden auf den Nettopreis je Flasche beziehungsweise Einzeleinheit umgerechnet. Beispiel: 6 × 1 l Orangensaft zu 15,12 € netto entspricht 2,52 € netto je 1-l-Flasche.
- Der Steuersatz ist als frei änderbarer Standardwert mit 19 % hinterlegt, da die Preisliste selbst nur auf die gesetzliche Mehrwertsteuer verweist.
- Kommission ist nicht automatisch aktiviert, da keine eindeutige Kommissionskennzeichnung je Artikel vorliegt.
- Produkte, die in der Preisliste nicht angeboten werden, bleiben in den Rezeptkalkulationen als „EK fehlt“ sichtbar (mit Warnbanner auf Planung und Dashboard). Dazu zählen etwa Pfirsichlikör, Tequila, Triple Sec, Grenadine, Blue-Curaçao-Sirup, Limetten- und Zitronensaft sowie Ginger Beer.

Die Liste kann auf der Daten-Seite als CSV heruntergeladen werden. Mit „Werkseinstellungen“ wird sie erneut geladen, ohne bereits lokal gespeicherte eigene Daten stillschweigend zu überschreiben.

## Default-Dateien im Public-Ordner

Die unveränderlichen Werkseinstellungen sind nicht im Anwendungscode dupliziert:

- `public/default-prices.csv` enthält die Standard-EK-Preise.
- `public/default-recipes/manifest.json` listet alle Standardrezepte auf.
- Jedes Standardrezept liegt als eigene JSON-Datei unter `public/default-recipes/`.

Dadurch können Preise und einzelne Rezeptdefinitionen unabhängig vom TypeScript-/JavaScript-Code gepflegt werden. Zusätzlich zu den ursprünglichen Rezepten sind Klassiker wie Caipirinha, Piña Colada, Espresso Martini, Mojito, Moscow Mule, Cuba Libre, Margarita, Whiskey Sour, Cosmopolitan, Aperol Spritz, Gin Tonic, Negroni, White Russian und Mai Tai enthalten. Bei bestehenden Browserdaten wird dieses Rezeptpaket einmalig ergänzt, ohne vorhandene eigene Rezepte oder EK-Posten zurückzusetzen.

## Projektstruktur

```text
src/
  lib/          Reine Berechnungs-/Formatierungs-/Validierungslogik (unit-getestet)
  state/        React-Context für globalen App-State inkl. Autosave
  i18n/         Deutsche/englische Übersetzungen + Sprach-Hook
  components/   Header, Navigation, Footer, Dialoge, Warnbanner, Toast
  pages/        Eine Komponente je Route (Start, Dashboard, EK-Posten, Rezepte, Planung, Kalkulation, Daten, Einstellungen, Hilfe)
public/
  default-prices.csv       Standard-EK-Preisliste
  default-recipes/         Standardrezepte (ein JSON je Rezept)
  icons/                   PWA-Icons
design/
  brand-reference/         Vom Auftraggeber bereitgestelltes JJM-Logo (Designreferenz)
```

## Branding

Das Cocktail-Emoji `🍸` wird als Website-Logo und Favicon eingesetzt. Das vom Auftraggeber bereitgestellte JJM-Logo erscheint klein und unverlinkt im Footer; die Originaldateien liegen als Designreferenz unter `design/brand-reference/`.

## Projekt und Organisation

Das Projekt wird von **jjm.one** beziehungsweise **jjm-one** gepflegt.

- Repository: [https://github.com/jjm-one/Cocktail-Calculator](https://github.com/jjm-one/Cocktail-Calculator)
- SSH-Remote: `git@github.com:jjm-one/Cocktail-Calculator.git`
- Organisationswebsite: [https://jjm.one](https://jjm.one)
- GitHub-Pages-Deployment: [https://jjm-one.github.io/Cocktail-Calculator/](https://jjm-one.github.io/Cocktail-Calculator/)

Das npm-Paket trägt den Namen `@jjm-one/cocktail-calculator`.

## Lizenz

Copyright © 2026 jjm.one. Dieses Projekt ist unter der **GNU Lesser General Public License Version 3 (LGPLv3)** veröffentlicht. Der vollständige Lizenztext steht in [`LICENSE`](LICENSE).
