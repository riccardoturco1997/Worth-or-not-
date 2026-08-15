# Worth It?

App web mobile-first (installabile come PWA) che ti aiuta a capire se un acquisto vale davvero la pena.

Inserisci il costo di un prodotto e l'app calcola:

- **Ore/giorni di lavoro** necessari per pagarlo, in base alla retribuzione e all'orario settimanale che imposti nel tuo profilo.
- **Quanto varrebbe quella cifra** se invece la investissi per 10 anni nel FTSE All-World, indice azionario globale, usando il suo rendimento medio annuo storico degli ultimi 10 anni (~11%/anno).
- **Cronologia** degli ultimi calcoli fatti, un **grafico** anno per anno della crescita dell'investimento e una **mini-guida** con le basi dell'investire in indice.

## Come si usa

Non serve nessuna installazione o build: è HTML/CSS/JS puro.

1. Apri `index.html` in un browser mobile, oppure pubblica la cartella su un hosting statico (es. GitHub Pages, Netlify, Vercel).
2. Al primo avvio crea il tuo profilo: retribuzione netta mensile, ore lavorate a settimana, giorni lavorativi a settimana.
3. Da telefono, usa "Aggiungi a schermata Home" (Safari/Chrome) per installarla come app: grazie al `manifest.json` e al service worker (`sw.js`) funziona anche offline dopo il primo caricamento.

## Provarla in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000 dal telefono (stessa rete) o dal browser del PC
```

## Struttura

- `index.html` — markup delle schermate (setup profilo, schermata principale, modali impostazioni/cronologia/guida)
- `style.css` — stile mobile-first
- `app.js` — logica di calcolo (ore di lavoro, valore futuro investito, grafico, cronologia) e gestione del profilo in `localStorage`
- `manifest.json` + `sw.js` — supporto PWA (installazione e uso offline)
- `icons/icon.svg` — icona dell'app

## Note

Il rendimento dell'11%/anno usato per le proiezioni è una media storica del FTSE All-World sugli ultimi 10 anni (dati FTSE Russell) ed è fisso, non impostabile dall'utente: non è una garanzia di rendimento futuro né una consulenza finanziaria.
