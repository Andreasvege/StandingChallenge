# Stå på! — Design

**Dato:** 2026-09-11
**Status:** Godkjent design, klar for plan
**Admin:** av@thebrave.no

## Mål
En koselig intern nettside for The Brave-kontoret (16 ansatte) med konkurranse om å stå
mest ved ståpulten. Du starter en ståøkt på 30, 60 eller 90 minutter, ser live hvem som står
og sitter i et lite pikselkontor, og konkurrerer på daglig og ukentlig toppliste.

Viktigst av alt er det visuelle: kollegaer som åpner siden for første gang skal tenke
«herregud så gøy og koselig!».

## Omfang (v1)
- Google-innlogging, kun `@thebrave.no`.
- Pikselkontoret (hovedsiden) med live status for alle.
- Ståøkter på 30, 60 eller 90 minutter med «Står du fortsatt?», varsel og lyd.
- Topplister for i dag og denne uka.
- Adminside: figurbygger og plassering av pulter.

**Ikke i omfang (YAGNI):** streaks og merker, Slack-integrasjon, historikk og grafer, egne
varigheter, flere kontorer, andre tidssoner enn Europe/Oslo.

## Visuelt uttrykk
Referanseskisse (valgt variant A, «ett stort rom»):
`docs/superpowers/specs/mockups/2026-09-11-pikselkontoret.html`. Den inneholder også
sprite-koden figurene skal bygges på.

- **Pikselkunst for figurer og omgivelser, vanlig skrift for all tekst og alle knapper.**
- **Skrift:** Bricolage Grotesque (logo og overskrifter) og DM Sans (UI), via `next/font/google`.
- **Palett:** vegg i dus lilla med harde bånd (`#34295e` → `#463879`), mørk UI `#221a3a`,
  tekst krem `#FFF3DC`, rosa aksent `#FF6FA8`, gul `#FFD166`, grønn `#7CF0A6`, pikselkontur
  `#120d22`, tregulv `#7a5140`.
- **Figurer:** SVG med `<rect>` og `shape-rendering="crispEdges"`, et rutenett på 40×48 per
  figur med pult. Står du: hevet pult, åpne øyne og en lett hopping i to steg
  (`steps(2)`). Sitter du: senket pult, stol og lukkede øyne.
- **Boble over hodet** med hakk-kanter i pikselstil og vanlig skrift: «Emma · 32 min»,
  «Mina 💤», og dagens leder i gult med krone: «👑 Even · 2 t 0 min». Dagens leder får også
  en pikselkrone på hodet (regnes ut, lagres ikke).
- **Rommet:** lysslynge som blinker, vinduer med himmel som følger tiden på døgnet (morgen
  06–10, dag 10–16, solnedgang 16–19, kveld 19–06), pikselklokke, hengeplanter, plankegulv og
  en kontorhund som går frem og tilbake.
- **Layout:** på PC to rader med 8 (bakerste rad litt forskjøvet og mørkere for dybde). På
  mobil (smalere enn ca. 700px) fire rader med fire i samme rom. Boblene justeres så de ikke
  dekker ansikter på raden bak. Trykk eller hover på en figur viser dagens totaltid.
- **Fanen:** nedtelling i tittelen (`32:10 · Står`) og et dynamisk pikselhode som favicon.
- **`prefers-reduced-motion`:** ingen hopping, blinking eller gående hund.

## Sider
1. **`/login`:** rommet uskarpt i bakgrunnen og knappen «Logg inn med Google». Andre kontoer
   får beskjeden «Bare for @thebrave.no-kontoer».
2. **`/` (rommet):**
   - Toppfelt: logo, «X av N står akkurat nå», «Sammen har vi stått T i dag».
   - Din status: sitter du, knapper for 30, 60 og 90 min. Står du, timer, fremdrift og
     «Jeg satte meg».
   - Rommet.
   - Topplister for i dag og denne uka: topp 5, pluss din egen plassering hvis du er utenfor.
   - Lyd av/på (lagres i `localStorage`).
3. **Dialogen «Står du fortsatt?»:** vises når runden din er ute. Valgene er «Én runde til
   (X min)» og «Nei, jeg sitter», med en nedtelling fra 5:00.
4. **`/admin`** (bare admin):
   - Liste over ansatte med navn, e-post og plass. Admin kan legge inn ansatte på forhånd
     med e-post.
   - Figurbygger med forhåndsvisning: frisyre (kort, langt, knute, krøller), hårfarge,
     hudfarge, genserfarge, briller, skjegg og ting på pulten (kopp eller plante).
   - Plassering: et rutenett på 2×8 der du klikker en pult og velger person.
   - Listen «Uten plass» for dem som har logget inn uten å være satt opp.

## Autentisering og tilgang
- Auth.js v5 med Google som leverandør. Innloggingen sender med `hd=thebrave.no`, og
  `signIn`-callbacken sjekker i tillegg at `email_verified` er satt og at e-posten slutter på
  `@thebrave.no`.
- Innloggingen lagres i en JWT-cookie, så vi trenger ingen database-adapter for Auth.js. Den
  ansatte slås opp på e-post.
- Første innlogging finner ansatt-raden med samme e-post (hvis admin har laget den på
  forhånd). Finnes den ikke, opprettes den med navnet fra Google, en tilfeldig figur og ingen
  plass.
- Admin styres av miljøvariabelen `ADMIN_EMAILS` (`av@thebrave.no`).
- Lokal utvikling: en innlogging uten Google (Credentials-leverandør), bare aktiv når
  `NODE_ENV=development`.
- Tips: bruker thebrave.no Google Workspace, bør samtykkeskjermen for OAuth settes til
  «Internal», så sperrer Google andre kontoer allerede før innlogging.

## Datamodell (Neon Postgres, Drizzle ORM)
**`employees`**
| felt | type | merknad |
|---|---|---|
| id | uuid pk | |
| email | text unique | lagres med små bokstaver |
| name | text | visningsnavn |
| figure | jsonb | se `Figure` under |
| seat | int unique null | 0–15; 0–7 er fremste rad, 8–15 bakerste. `null` betyr uten plass |
| created_at | timestamptz | |

**`stand_sessions`**
| felt | type | merknad |
|---|---|---|
| id | uuid pk | |
| employee_id | uuid fk | |
| started_at | timestamptz | |
| round_minutes | int | 30, 60 eller 90 |
| round_ends_at | timestamptz | skyves frem ved «Én runde til» |
| ended_at | timestamptz null | `null` betyr at økta pågår |
| end_reason | text null | `sat_down`, `completed` eller `timeout` |

En delvis unik indeks på `employee_id WHERE ended_at IS NULL` sørger for at hver person har
maks én åpen økt.

**`Figure`** (valideres mot faste paletter i `lib/figure.ts`):
`{ hairStyle: 'short'|'long'|'bun'|'curly', hair, skin, shirt: hex fra paletten,
glasses: boolean, beard: boolean, deskItem: 'mug'|'plant' }`

## Øktregler (ren logikk i `lib/sessions.ts`, enhetstestet)
- **Start:** bare lov uten åpen økt. `started_at = nå`, `round_ends_at = nå + runde`.
- **«Jeg satte meg»:** `ended_at = min(nå, round_ends_at)`, årsak `sat_down`. Da teller bare
  tiden du faktisk sto.
- **Runden er ute:** dialogen og varselet vises, og det starter en frist på 5 minutter.
  - **«Én runde til»** innen fristen: `round_ends_at += round_minutes`. Minuttene du brukte på
    å svare, teller, fordi du sto.
  - **«Nei, jeg sitter»** innen fristen: `ended_at = round_ends_at`, årsak `completed`.
  - **Ikke svart innen fristen:** økta regnes som avsluttet ved `round_ends_at`, årsak
    `timeout`. Du får tiden du planla, ikke de 5 ekstra minuttene.
- **Lat lukking:** hver lesing av kontorstatus lukker først økter der
  `round_ends_at < nå − 5 min`. Vi trenger ingen cron-jobb.
- **Tid som teller:** `(ended_at ?? min(nå, round_ends_at)) − started_at`. Mens fristen
  løper, står timeren stille på rundens slutt, og boblen viser ⏰.
- **Dag og uke:** regnes i Europe/Oslo. En dag går fra midnatt til midnatt, en uke fra
  mandag 00:00 til søndag. En økt som krysser midnatt, deles på dagene.

## Live-oppdatering
- `GET /api/office` returnerer `{ now, employees: [{ id, name, figure, seat, session:
  { startedAt, roundEndsAt, roundMinutes } | null, todaySeconds, weekSeconds }],
  todayTotalSeconds }`.
- Klienten henter på nytt hvert 5. sekund og når vinduet får fokus. Den bruker
  serverens `now` for å rette opp avvik i klokka, og timerne tikker lokalt hvert sekund.
- Endringer (start, en runde til, satte meg) går via Server Actions, med optimistisk
  oppdatering av din egen status. Planen avgjør detaljene etter at vi har lest
  Next 16-dokumentasjonen i `node_modules/next/dist/docs/`.

## Varsler (tilpasset fra `pomodorotimer/lib/alerts.ts`)
- `warmUpAudio()` kalles når du klikker Start, så lyden kan spille når runden er ute.
- En firkantet 8-bit-«pling» laget med Web Audio, uten lydfil.
- Varselet heter «Står du fortsatt?» med teksten «Du har stått i 60 min 🎉 Én runde til?».
  Klikker du på det, kommer fanen i fokus.
- Nettleseren spør om tillatelse til varsler første gang du trykker Start.
- Er fanen lukket, kommer det ikke noe varsel, og da tar 5-minuttersregelen over.

## Struktur
- `lib/figure.ts`: type, paletter, tilfeldig figur, validering.
- `lib/sprite.ts`: ren funksjon som gjør figur + tilstand om til rektangler (portert fra
  skissen).
- `lib/sessions.ts`: øktreglene.
- `lib/time.ts`: grensene for dag og uke i Oslo-tid.
- `db/schema.ts`, `db/client.ts`: Drizzle og `@neondatabase/serverless`.
- `auth.ts`: oppsettet for Auth.js.
- Komponenter: `PixelPerson`, `OfficeRoom` (scene, rader, pynt, hund, himmel), `Bubble`,
  `MyStatus`, `Leaderboard`, `StillStandingDialog`, `admin/FigureBuilder`, `admin/SeatGrid`.

## Feilhåndtering
- Henting feiler: siste kjente tilstand vises, sammen med en diskret melding om at
  forbindelsen er borte. Timerne tikker videre.
- Dobbeltklikk eller to faner på Start: serveren returnerer økta som allerede er åpen, så det
  skjer ikke to ganger.
- «Satte meg» eller «En runde til» på en økt som allerede er lukket: serveren sender nåværende
  tilstand, og brukergrensesnittet oppdaterer seg.
- Lyd eller varsler støttes ikke eller er avslått: stille fallback, som i pomodorotimer.

## Testing
- **Vitest** (logikken ligger i `lib/`, som i pomodorotimer):
  - `sessions`: tid som teller, å sette seg tidlig, «én runde til» innenfor og utenfor
    fristen, timeout.
  - `time`: midnatt i Oslo, sommertid og vintertid (siste søndag i mars og oktober),
    ukegrenser.
  - `sprite`: deterministisk, og krone bare på leder.
  - `figure`: validering.
- **Manuelt i nettleser (Playwright)** mot utviklingsserveren:
  - Innlogging via dev-innloggingen.
  - Start og satte meg.
  - Dialogflyten med `DEV_FAST_TIME=1`, der minutter blir sekunder (bare i utvikling).
  - Figurbyggeren i admin.
  - Mobil-layout på 390px.

## Oppsett og drift
- Vercel-prosjekt, med Neon via Vercel-integrasjonen, som gir `DATABASE_URL`.
- Miljøvariabler: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
  `ADMIN_EMAILS=av@thebrave.no`.
- Google OAuth-klienten lager Andreas selv i Google Cloud Console, etter en oppskrift fra
  Claude.

## Åpne punkter
- Endelig navn og domene (arbeidstittel «Stå på!»).
