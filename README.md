# Worth It?

App web mobile-first (installabile come PWA) che ti aiuta a capire se un acquisto vale davvero la pena.

Inserisci il costo di un prodotto e l'app calcola:

- **Ore/giorni di lavoro** necessari per pagarlo, in base alla retribuzione e all'orario settimanale che imposti nel tuo profilo.
- **Quanto varrebbe quella cifra** se invece la investissi per 5 anni in un indice azionario mondiale, in base a un rendimento medio annuo stimato (modificabile nelle impostazioni).

## Come si usa

Non serve nessuna installazione o build: è HTML/CSS/JS puro.

1. Apri `index.html` in un browser mobile, oppure pubblica la cartella su un hosting statico (es. GitHub Pages, Netlify, Vercel).
2. Al primo avvio crea il tuo profilo: retribuzione netta mensile, ore lavorate a settimana, giorni lavorativi a settimana e rendimento annuo atteso dell'indice mondiale.
3. Da telefono, usa "Aggiungi a schermata Home" (Safari/Chrome) per installarla come app: grazie al `manifest.json` e al service worker (`sw.js`) funziona anche offline dopo il primo caricamento.

## Provarla in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000 dal telefono (stessa rete) o dal browser del PC
```

## Struttura

- `index.html` — markup delle schermate (setup profilo, schermata principale, modale impostazioni)
- `style.css` — stile mobile-first
- `app.js` — logica di calcolo (ore di lavoro, valore futuro investito) e gestione del profilo in `localStorage`
- `manifest.json` + `sw.js` — supporto PWA (installazione e uso offline)
- `icons/icon.svg` — icona dell'app

## Note

Il rendimento dell'indice mondiale è una stima basata su medie storiche di lungo periodo ed è impostabile dall'utente: non è una garanzia di rendimento futuro.
