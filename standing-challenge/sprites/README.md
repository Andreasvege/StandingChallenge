# Tegn dine egne sprites 🎨

Her kan du tegne nye ting til figurene i Stå på! – hodeplagg (caps, lue, hodetelefoner …) og ting
på pulten (katt, kaktus, kaffekanne …). Tegningene blir automatisk til nye valg i figurbyggeren på `/admin`.

```
sprites/
├── hode/    ← hodeplagg, 26×22 piksler   (eksempel: caps.png)
├── pult/    ← ting på pulten, 18×12 piksler (eksempel: katt.png)
├── scene/   ← pynt i rommet: utsikten fra vinduene, gresskar, løvhauger … (vanlige PNG-er, ingen skript)
└── mal/     ← maler og palett (lages på nytt hver gang du kjører skriptet)
```

## Slik gjør du det

1. **Åpne malen** i et pikselprogram:
   - `mal/hode-mal.png` for hodeplagg, `mal/pult-mal.png` for pult-ting.
   - Gratis: [Piskel](https://www.piskelapp.com) (i nettleseren) eller [Lospec Pixel Editor](https://lospec.com/pixel-editor).
     Best: [Aseprite](https://www.aseprite.org) (ca. 20 $).
2. **Last inn paletten** (valgfritt, men anbefalt): `mal/sta-pa.gpl` (Aseprite, Lospec, GIMP) eller `mal/sta-pa.hex`.
   Da passer fargene med resten av kontoret.
3. **Tegn rett oppå malen.** Alt som fortsatt er likt malen blir ignorert, så du trenger ikke viske ut figuren.
   Du kan også tegne på et tomt, gjennomsiktig lerret i samme størrelse.
4. **Lagre som PNG** i `hode/` eller `pult/`. **Filnavnet blir navnet i figurbyggeren**:
   `rosa lue.png` → «Rosa lue». Bruk bokstaver, tall, mellomrom eller bindestrek.
5. **Kjør** (fra `standing-challenge/`):
   ```bash
   npm run sprites
   ```
   Skriptet sier fra hvis noe er feil (feil størrelse, rart filnavn, farger utenfor paletten).
6. **Se resultatet** på `/admin` (velg noen og prøv det nye valget) eller `/dev/room` med `npm run dev`.
7. **Commit og push** – da er det ute hos alle etter neste deploy.

## Godt å vite

- **Figuren ser mot høyre.** Skyggen på en caps peker altså mot høyre.
- **Hodeplagg følger hodet** både når figuren står og sitter. Malen viser hodet slik det står;
  ansiktets øverste venstre hjørne er piksel (6, 8) på lerretet.
- **Pult-ting står på pultplata.** Nederste rad i malen er kanten av pulten; laptopen står til venstre,
  så tegn helst i høyre halvdel (x 11–17).
- **Kontur:** bruk den mørke konturfargen `#120d22` rundt tingen, 1 piksel tykk – da ligner det resten.
- **Få farger** ser best ut: 3–5 farger per ting holder lenge.
- Lederens krone tegnes alltid oppå hodeplagget. 👑
- Ikke rediger `lib/sprite-art.generated.ts` for hånd – den lages av skriptet.

## Scenepynt (`scene/`) – vanlige PNG-er, ingen skript

Alt i `scene/` vises **akkurat som du tegner det**, bare forstørret med skarpe piksler. Ingen
`npm run sprites`, ingen konvertering. Det eneste som trengs er én linje i
`components/office/scene-art.ts` som sier hvor tegningen skal stå og hvilke måneder den gjelder
(be Claude om det, eller kopier eksempelet som står der).

**Utsikt fra vinduene** – 60×32 piksler, gjennomsiktig bakgrunn. Hvert vindu kan ha sin egen fil
(`høst-venstre.png`, `høst-høyre.png`); én fil holder hvis begge skal være like.
1. Åpne `mal/vindu-mal.png`. Den viser glasset slik det ser ut midt på dagen: himmel, sol, byen og sprossen i midten.
2. Legg til et **nytt lag** og tegn trærne der. Himmelen og byen kommer fra koden og skifter med
   klokka, så de skal *ikke* være med i fila di.
3. Skjul mal-laget og eksporter som PNG (60×32), f.eks. `scene/høst-trær.png`.
4. Tegn i dagslysfarger: om kvelden blir tegningen automatisk mørkere sammen med himmelen.
   Sprossen (x 29–30) tegnes alltid oppå, så det du tegner der blir skjult.

**Vegg og gulv** – fliser som gjentas over hele flaten, fordi rommet ikke har fast størrelse.
Start fra `mal/vegg-flis-mal.png` (32×32) og `mal/gulv-flis-mal.png` (40×15, én planke), som viser
rommet slik det er i dag. Kantene må gå i hverandre: tegn i Aseprites *Tiled Mode*.

**Ting på gulvet og veggene** (gresskar, løvhauge …) – valgfri størrelse.
1. `mal/gulv-mal.png` er en **målestokk**: en figur med pult i samme skala som rommet
   (1 piksel = 3 skjermpiksler). Bruk den til å se hvor stort gresskaret skal være.
2. Tegn på et nytt, gjennomsiktig lerret som er akkurat så stort som tingen (Aseprite: *Sprite → Trim*).
3. **Animasjon:** legg bildene ved siden av hverandre i én fil, like brede. Et gresskar på 16×14 med
   to bilder av et flimrende lys blir en fil på 32×14. Si fra hvor mange bilder og hvor raskt.

Same tips som over gjelder: kontur `#120d22`, få farger, og paletten `mal/sta-pa.gpl`.
Se resultatet på `/dev/room?month=10` (bytt måned for å sjekke andre årstider, `&hour=21` for kveld).
