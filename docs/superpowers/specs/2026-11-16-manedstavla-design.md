# Månedstavla — Design

**Dato:** 2026-11-16
**Status:** Godkjent (2026-11-19), klar for plan
**Skisse (godkjent av Andreas):** https://claude.ai/artifact/3AkMZ36WRpRVLEXVZPwBU4

## Hvorfor
I dag har appen bare topplister for i dag og denne uka. Kontoret vil ha en månedskonkurranse som
henger på veggen i pikselrommet, og som man kan bla bakover i. Den skal være morsom å se på, i samme
koselige stil som resten av rommet. Andreas slutter kanskje i Brave, og det som bygges skal kunne
leve videre uten at noen må skrive kode hver måned.

Even har vunnet alle månedene så langt (88,6 t i oktober mot 9,7 t for nummer to). Derfor får
månedstavla også en kategori for **mest framgang**, så alle andre har noe å kjempe om.

## Mål
1. **Seierspallen på veggen.** Et innrammet pikselbilde med en pall: vinneren av inneværende måned
   står på midten med kronen, nummer to til venstre og nummer tre til høyre. Hodene er figurene
   slik de ser ut i rommet. Over bildet står «Månedens ståere», som «Visste du?» og «Arbeidsklokke».
2. **Panelet.** Et trykk på pallen åpner et panel med samme stil som fakta-panelet:
   - piler ‹ › for å bla mellom månedene, fra den første måneden noen sto til inneværende måned
     (pilene er av i hver ende);
   - pallen i større utgave;
   - status: for en ferdig måned «Even vant oktober med 88,6 t», for inneværende måned
     «Pågår · Even leder akkurat nå» med grønn prikk;
   - **mest framgang**: «🚀 Mest framgang: George, +9 t fra oktober» (se reglene under);
   - hele lista over alle som sto den måneden: plass, hode, navn, en stolpe og timer. Den som er
     logget inn, er markert i gult;
   - en fotlinje med kontorets sum for måneden («så langt» for inneværende måned).
3. **Telefon (≤700 px).** Veggen har ikke plass. Der blir månedstoppen en tredje liste,
   «Denne måneden», ved siden av «I dag» og «Denne uka». Den viser alle, med «Vis alle» akkurat som
   de to andre, og under den er det en knapp, «Tidligere måneder», som åpner det samme panelet
   (tilpasset telefonbredde). *(Claudes valg.)*
4. **Historikken bevares når noen slutter** (Andreas' ønske). Se «Arkivering» under.

## Regler
- **Måned** er kalendermåned i Europe/Oslo (`osloMonthStart`, `osloPrevMonthStart` i `lib/time.ts`).
  Tid som krysser midnatt mellom to måneder, deles som i dag (`creditedSecondsBetween`).
- **Rangering** er samme som for vandrepokalen: `rankBetween` i `lib/trophy.ts`. Pallen, panelet og
  pokalen ved pulten skal aldri være uenige om hvem som vant.
- **Mest framgang** måles i **timer**, ikke prosent (Andreas' valg): timer denne måneden minus egne
  timer forrige måned. Den med størst positiv økning vinner. Det kan godt være månedens vinner
  (Andreas' valg). Hvis ingen har økt, vises ikke linjen. For den aller første måneden finnes ingen
  forrige måned, så linjen vises ikke der. For inneværende måned sammenlignes timene så langt med
  hele forrige måned, og linjen sier «så langt». Ved likt resultat vinner den som står først i
  rangeringen for måneden. *(Claudes valg.)*
- **Vandrepokalen** (forrige måneds vinner har pokal ved pulten hele måneden) finnes allerede
  (`lib/trophy.ts`) og skal ikke endres.

## Tegningen
Den godkjente pallen er et 68×54-rutenett (se skissen). Hodene er `spriteRects(figure, { pose: 'stand' })`
beskåret med `HEAD_VIEWBOX` (18×21), og vinneren tegnes med `crown: true`. Fra skissen:

| Del | Ruter |
|---|---|
| Ramme | ytre 68×54 i `OUTLINE`, tre `#8a5a36` 1 rute inn, bilde fra (3,3) til (65,51) |
| Himmel / gress | `#9fd2ff` med `#8fc4ff` øverst; gress fra y = 40 i `#9ab78f` |
| Sølv (venstre) | blokk x 4–25, topp y 35; hode på (5, 14) |
| Gull (midten) | blokk x 24–45, topp y 29; hode på (25, 8) med krone |
| Bronse (høyre) | blokk x 44–65, topp y 39; hode på (45, 18) |

Hvis noen av plassene er tomme (bare én eller to har stått), står blokken tom. Hvis ingen har
stått, viser pallen tre tomme blokker.

**Størrelse:** på veggen tegnes pallen i **1,5×** (102 × 81 px). Andreas ba om den mindre enn 2×.
På vanlige skjermer gir 1,5× litt ujevne piksler. På retina-skjermer blir det 3 ekte piksler per
rute, så der er den skarp. I panelet kan den gjerne tegnes i 3×.

## Plassering på veggen
- Pallen henger **til høyre for det høyre vinduet**, med en luke på omtrent 40 px, og er
  **midtstilt i høyden mot vinduet**.
- Som alle ting på veggen skal den henge etter veggens 20 %-felt og ikke en fast avstand fra taket
  (se «Rules & conventions» i CLAUDE.md).
- Den skal aldri dekke veggskjermene (`.screens`, høyrestilt), hengeplanten eller noe annet.
- **På smale skjermer** flytter vinduene, oppslagstavla og klokka seg mot venstre, akkurat nok til
  at pallen får plass. I skissen trengte en 1280 px skjerm med én veggskjerm 59 px. På 1920 px står
  alt der det står i dag.
- Bredder som må holde: 701–1920 px, med 0, 1 og 2 veggskjermer. Det sjekkes ved å gå gjennom
  bredder på `/dev/room`, som CLAUDE.md beskriver.

## Arkivering
I dag sletter admin-knappen «slett» personen, og `stand_sessions` slettes med (`on delete cascade`).
Da skriver man om historien: en ferdig måned kan få en ny vinner i ettertid. Det skal ikke skje.

- `employees` får en kolonne `archived_at` (tidsstempel, null = aktiv). Kolonnen må legges til med
  `npm run db:push:prod` før koden som bruker den, deployes.
- Å fjerne noen som **har stått minst én runde**, arkiverer dem: `archived_at` settes og pulten
  (`seat`) frigjøres. Rundene deres blir liggende. Noen som aldri har stått, kan fortsatt slettes
  helt, som i dag. *(Claudes valg.)*
- En arkivert person vises ikke i rommet, på veggskjermene, i dag-, uke- eller månedslisten for
  inneværende måned, eller i adminlista over aktive. De kan ikke logge inn (som om de ikke fantes),
  og de kan ikke få heiarop.
- I **ferdige måneder** står de fortsatt, med navn og figur, i pallen, lista og framgangen. Vandrepokalen
  regnes også med dem, men vises bare ved pulten hvis vinneren er aktiv.
- Admin får en liten liste «Arkiverte» med en knapp «Hent tilbake», i tilfelle noen kommer tilbake
  eller ble arkivert ved en feil. Hvis de hentes tilbake, får de ingen pult før admin plasserer dem.
- Med arkivering endrer en ferdig måned seg aldri, og panelet kan trygt hurtigbufre gamle måneder.

## Data
- Snapshotet som pulles hvert 5. sekund, får med månedstimer for alle aktive (som `weekSeconds`
  i dag), så pallen på veggen og listen på telefon følger med live. *(Claudes valg.)*
- Panelet henter én måned om gangen når den åpnes eller når man blar, gjennom en egen rute eller
  Server Action som sjekker innlogging selv, som resten. Gamle måneder endrer seg ikke, så de kan
  hurtigbufres i nettleseren. *(Claudes valg.)*
- Den første måneden å bla til regnes ut fra den eldste runden i databasen, ikke fra en fast dato.

## Ikke i omfang
- **Premie som admin setter** for måneden («vinneren får kake»). Den hører til admin-panelet, som
  er neste prosjekt.
- Andre kategorier enn vinner og mest framgang.
- Endringer i ledertavla for i dag og denne uka, utover den nye listen på telefon.

## Anti-mål
- Pallen må ikke se rotete eller trang ut på veggen. Det visuelle er viktigst i hele appen.
- Pallen, panelet og pokalen må aldri vise forskjellige vinnere.
- Ingen pikselfont for tekst. Etiketter og panel bruker DM Sans og Bricolage Grotesque.

## Overlatt til den som bygger
- Navn på filer og komponenter. Ren logikk legges i `lib/` med tester ved siden av, som i resten av appen.
- Nøyaktig CSS for hvordan veggen flytter seg mot venstre, så lenge breddekravet over holdes.
- All ny tekst går i `locales/nb.json` og `locales/en.json`.
