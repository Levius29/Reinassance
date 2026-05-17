# Handoff per Claude — Protocollo 12 Settimane

## Contesto

Questa è una PWA statica, senza build step, pensata per iPhone. Serve come cockpit giornaliero per un protocollo di 12 settimane: allenamento, integratori, alimentazione, abitudini, dati persistiti localmente.

Priorità utente attuale: UX mobile snella, schermata non scrollabile globalmente, slide interne scorrevoli, design da rifinire.

## Come aprire

Da cartella progetto:

```bash
python3 -m http.server 5183 --bind 0.0.0.0
```

Poi aprire da iPhone con IP Mac sulla stessa rete, esempio:

```text
http://192.168.x.x:5183/?v=claude
```

Per test locale Mac:

```bash
python3 -m http.server 5174 --bind 127.0.0.1
```

## Struttura

- `index.html`: shell PWA e modale onboarding.
- `css/style.css`: tutto il layout mobile-first.
- `js/protocol.js`: dati statici del protocollo, allenamenti, integratori, dieta.
- `js/checklist.js`: item checklist e calcolo percentuale completamento.
- `js/db.js`: IndexedDB + mirror localStorage + export/import.
- `js/app.js`: rendering app, slide, onboarding, salvataggi.
- `sw.js`: service worker cache app shell.
- `manifest.webmanifest`: PWA manifest.
- `tests/`: test Node per logica pura.

## UX Attuale

Pagina principale bloccata a viewport: niente scroll globale.

Dentro `Oggi` ci sono slide orizzontali, una alla volta:

1. Allenamento
2. Integratori
3. Alimentazione
4. Abitudini

Le singole slide possono scrollare internamente se il contenuto è lungo. Scrollbar nascoste.

In alto:

- data giorno
- settimana corrente
- percentuale completamento
- frecce giorno precedente/successivo
- barra settimana a 7 segmenti: si riempie giorno per giorno e resetta alla settimana successiva
- pulsante `Settimana` per riepilogo settimanale leggero

Rimosso per ora:

- header `Protocollo 12 Settimane`
- bottone `!`
- nota giorno
- Passi
- Valori/Grafici/Report dalla home

## Alimentazione

La slide alimentazione esiste e legge da `DIET_PLAN` in `js/protocol.js`.

Ogni giorno ha 3 pasti:

- Colazione
- Pranzo
- Cena

Al momento ogni pasto contiene `Da compilare`. Non è stata inventata una dieta sanitaria. Serve riempire `DIET_PLAN` con i contenuti reali.

Formato:

```js
export const DIET_PLAN = {
  1: {
    label: "Lunedì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", items: ["..."] },
      { id: "meal_lunch", label: "Pranzo", time: "13:00", items: ["..."] },
      { id: "meal_dinner", label: "Cena", time: "20:00", items: ["..."] },
    ],
  },
};
```

## Persistenza

IndexedDB store:

- `days`
- `weeks`
- `labs`
- `settings`
- `meta`

Ogni modifica passa da `db.js`. Mirror compatto in `localStorage` con chiave `protocol_backup_v1`.

## Cose Da Non Rompere

- Nessun build step.
- Tutti i path devono restare relativi (`./`) per GitHub Pages.
- Niente backend, account, analytics, cloud.
- Pagina principale non deve scrollare globalmente.
- Su mobile le card devono restare `100%` larghezza viewport interno: una slide alla volta.
- Input almeno `16px` per evitare zoom automatico iOS.
- Viewport blocca zoom: `maximum-scale=1, user-scalable=no`.

## Verifica Attuale

Comandi eseguiti:

```bash
node --test tests/*.test.js
node --check js/app.js
node --check sw.js
```

Risultato: 11 test passati, sintassi OK.

Smoke test Playwright su viewport iPhone:

- 4 slide da 366px su board da 366px.
- `documentElement.scrollHeight === innerHeight`.
- `html/body overflow: hidden`.
- zero errori console.

## Richiesta Per Claude

Fare revisione grafica/UX senza cambiare architettura dati.

Focus:

- rendere slide più belle e immediate
- migliorare gerarchia visiva dei segmenti settimana
- migliorare card integratori/alimentazione
- preservare dimensioni touch-friendly
- mantenere pagina senza scroll globale
- non reinserire nav inferiore, header grande, note o extra non richiesti

Se serve aggiungere contenuto dieta, farlo solo in `js/protocol.js`.
