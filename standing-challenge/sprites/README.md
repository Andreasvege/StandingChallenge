# Tegn dine egne sprites 🎨

Her kan du tegne nye ting til figurene i Stå på! – hodeplagg (caps, lue, hodetelefoner …) og ting
på pulten (katt, kaktus, kaffekanne …). Tegningene blir automatisk til nye valg i figurbyggeren på `/admin`.

```
sprites/
├── hode/    ← hodeplagg, 26×22 piksler   (eksempel: caps.png)
├── pult/    ← ting på pulten, 18×12 piksler (eksempel: katt.png)
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
