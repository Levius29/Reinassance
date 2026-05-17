# Protocollo 12 Settimane

PWA statica offline-first per diario giornaliero, checklist, integratori, allenamenti, valori settimanali, referti, grafici e report.

## Deploy GitHub Pages

1. Push su GitHub.
2. Repository `Settings` → `Pages`.
3. Source: branch `main`, cartella root.
4. Apri URL generato da GitHub Pages.

Tutti i path sono relativi (`./`) perché GitHub Pages può servire il sito da sottocartella `/REPO/`.

## Installazione iPhone

Apri con Safari, tocca Condividi, poi `Aggiungi a Home`. Usala dalla Home per ridurre rischio che Safari elimini IndexedDB dopo inattività.

## Backup

I dati restano solo sul dispositivo. Usa `Backup JSON` regolarmente. Disinstallare la PWA o cancellare dati sito può eliminare i dati locali.

## Modifica protocollo

Tutto il contenuto operativo sta in `js/protocol.js`: calendario, allenamenti, integratori, milestone e campi clinici.
