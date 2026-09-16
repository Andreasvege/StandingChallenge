// Fun facts about standing, shown on a poster on the office wall (idea 7 on the list in CLAUDE.md).
// Bilingual from the start: the poster picks the language the same way the rest of the UI does.
//
// House rule for this file: every fact traces to a peer-reviewed study, a systematic review or a
// health authority, and `source` says which one. No wellness-blog folklore, no inflated numbers.
// Where the evidence is weak or points the other way, the fact says so — a poster that oversells
// standing is worse than one that is honest about it.

export interface FunFact {
  id: string
  nb: string
  en: string
  /** Short human citation, with a URL when there is a stable one. */
  source: string
}

export const FUN_FACTS: FunFact[] = [
  {
    id: 'stillesitting',
    nb: 'Voksne i Norge sitter i snitt 9 timer i døgnet. Det er rundt 60% av tiden vi er våkne!',
    en: 'Adults in Norway sit an average of 9 hours a day. That\'s about 60% of their waking hours!',
    source:
      'Kan3-kartleggingen 2020–22, FHI/Helsedirektoratet (helsedirektoratet.no/rapporter/kartlegging-av-fysisk-aktivitet-blant-voksne-og-eldre-2020-22-kan3)',
  },
  {
    id: 'kalorier',
    nb: 'Å stå forbrenner \'bare\' 0,15 kcal mer i minuttet enn å sitte. Som er mindre enn mange rykter, men over 6 timer blir det ca. 54 kcal! Over fem dage rer det 270 kcal, som er 1/3 av en sjokoladeplate! Så det er jo noe?',
    en: 'Standing only burns 0.15 kcal per minute more than sitting. Which is less than many rumors, but over 6 hours that\'s about 54 kcal! Over five days that\'s 270 kcal, which is 1/3 of a chocolate bar! So it\'s something, right?',
    source:
      'Saeidifard et al., Eur J Prev Cardiol (2018), meta-analyse av 46 studier (pubmed.ncbi.nlm.nih.gov/29385357)',
  },
  {
    id: 'hev-senk',
    nb: 'Hev-senk-pult kutter sittingen med rundt 100 minutter i arbeidsdagen. Helseeffekten er egentlig ganske usikker. Men det må da være bra for oss?',
    en: 'Sit-stand desks cut workday sitting by about 100 minutes. The health effects actually are quite uncertain. But it must be good for us, right?',
    source:
      'Cochrane-oversikt, Shrestha et al. (2018) — lav kvalitet på dokumentasjonen (cochranelibrary.com, CD010912)',
  },
  {
    id: 'blodsukker',
    nb: 'Å veksle mellom å sitte og stå hver halvtime både øker og regulerer blodsukkeret bedre etter måltid.',
    en: 'Alternating sitting and standing every 30 minutes gives a modest improvement in post-meal glucose.',
    source: 'Thorp et al., Med Sci Sports Exerc (2014), 23 overvektige kontoransatte',
  },
  {
    id: 'gange',
    nb: 'Korte gåturer hvert 20. minutt senker blodsukkeret. To minutter med bare å stå gjør ikke det.',
    en: 'Short walk breaks every 20 minutes lowers blood sugar. Two minutes of just standing does not.',
    source: 'Bailey & Locke, J Sci Med Sport (2014) (pubmed.ncbi.nlm.nih.gov/24704421)',
  },
  {
    id: 'staa-lenge',
    nb: 'En gjennomgang av ståstudier råder til å ikke stå mer enn 40 minutter sammenhengende. Så kanskje du egentlig burde sette deg?',
    en: 'A review of standing studies advises against standing more than 40 minutes at a stretch. So maybe you should sit down after all?',
    source: 'Coenen et al., Gait & Posture 58 (2017), systematisk oversikt over laboratoriestudier',
  },
  {
    id: 'hjerte',
    nb: 'Å stå hele dagen er ikke nødvendigvis det beste: yrker med konstant ståing har mer hjertesykdom enn sittende. Så takk gud for disse stolene, eller hva?',
    en: 'Standing all day is no answer either: jobs with constant standing show more heart disease. So thank god for these chairs, right?',
    source:
      'Smith et al., Am J Epidemiol 187(1) (2018), 7320 arbeidstakere fulgt i 12 år (academic.oup.com/aje/article/187/1/27)',
  },
  {
    id: 'variasjon',
    nb: 'Arbeidstilsynet sier: kroppen vil ha variasjon. Å veksle mellom å sitte, stå og gå slår én fast stilling.',
    en: 'The Norwegian Labour Inspection Authority: alternating sitting, standing and walking beats one fixed posture.',
    source: 'Arbeidstilsynet, «Uheldige arbeidsstillinger» (arbeidstilsynet.no/arbeidsmiljo/ergonomi)',
  },
  {
    id: 'skjermhoyde',
    nb: 'Midten av skjermen bør ligge 15–30 grader under øyehøyde, også når du står ved pulten.',
    en: 'The middle of the screen should sit 15–30 degrees below eye level, also when you stand.',
    source: 'Arbeidstilsynet, «Arbeid ved dataskjerm» (arbeidstilsynet.no/arbeidsmiljo/ergonomi/arbeid-ved-dataskjerm)',
  },
  {
    id: 'underlag',
    nb: 'Myk matte eller såler har moderat støtte i forskningen for å dempe ubehag når du står lenge. Så RunwayFBU, pay up, vi vil ha matter!',
    en: 'A cushioned mat or insoles have moderate research support for easing discomfort when standing long. So RunwayFBU, pay up, we want mats!',
    source: 'Speed, Harris & Keegel, Applied Ergonomics 70 (2018), systematisk oversikt over 10 studier',
  },
  {
    id: 'rygg',
    nb: 'Hev-senk-pult ser ut til å dempe ryggplager! Litt. Effekten er reell, men liten. Men det er likevel noe!',
    en: 'Sit-stand desks seem to ease low back discomfort! A little. The effect is real, but small. Still, it\'s something!',
    source:
      'Agarwal, Steinmaus & Harris-Adamson, Ergonomics 61(4) (2018), meta-analyse (SMD −0,23)',
  },
  {
    id: 'produktivitet',
    nb: 'Ståpult gjør deg ikke målbart mer produktiv. Men den gjør deg heller ikke målbart mindre produktiv.',
    en: 'A standing desk does not make you measurably more productive. It does not make you measurably worse either.',
    source: 'Ojo, Bailey, Chater & Hewson, Int J Environ Res Public Health 15(3) (2018), systematisk oversikt',
  },
  {
    id: 'moter',
    nb: 'I et forsøk varte sittemøter 34% lenger enn ståmøter, uten at beslutningene ble bedre.',
    en: 'In one experiment seated meetings ran 34% longer than standing ones, with no better decisions.',
    source: 'Bluedorn, Turban & Love, J Appl Psychol 84 (1999), 111 grupper på fem personer',
  },
  {
    id: 'historie',
    nb: 'Hemingway, Virginia Woolf og Winston Churchill jobbet alle stående ved høye pulter. Om de hadde hev/senk pulter, er ikke dokumentert.',
    en: 'Hemingway, Virginia Woolf and Winston Churchill all worked standing at tall desks. Whether they had sit-stand desks is not documented.',
    source:
      'Plimpton, The Paris Review nr. 21 (1958); Quentin Bell-brev, pulten i Duke University Libraries; The Churchill Project, Hillsdale College',
  },
]

/**
 * The fact everyone sees today: picked from the day, so the whole office gets the same one
 * and it changes at midnight. `dayStart` is the Oslo midnight from lib/time.ts.
 */
export function factOfTheDay(dayStart: number, facts: FunFact[] = FUN_FACTS): FunFact {
  const day = Math.floor(dayStart / 86_400_000)
  return facts[((day % facts.length) + facts.length) % facts.length]
}

/** The next fact after this one — the poster cycles when you tap it. */
export function nextFact(current: FunFact, facts: FunFact[] = FUN_FACTS): FunFact {
  const i = facts.findIndex(f => f.id === current.id)
  return facts[(i + 1 + facts.length) % facts.length]
}
