---
name: Vad svarar AI?
description: Fyra AI-tjänster svarar på riktiga kundfrågor medan företagaren tittar.
colors:
  salong: "#120a0d"
  rida: "#5c1528"
  sammet: "#1d1014"
  sammet-2: "#26151a"
  ljus: "#ffe2b8"
  text: "#f6eee8"
  dov: "#c2b0a9"
  svag: "#94817b"
  ramp: "#ffb547"
  fel: "#ff8f7a"
typography:
  display:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 11vw, 6rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 6.5vw, 2.6rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  kort: "16px"
  chip: "12px"
  piller: "9999px"
spacing:
  tat: "8px"
  grupp: "16px"
  sektion: "24px"
components:
  knapp-primar:
    backgroundColor: "{colors.ljus}"
    textColor: "{colors.salong}"
    rounded: "{rounded.piller}"
    padding: "0 36px"
    height: "56px"
  knapp-sekundar:
    textColor: "{colors.text}"
    rounded: "{rounded.piller}"
    padding: "8px 16px"
  falt-namn:
    backgroundColor: "{colors.sammet}"
    textColor: "{colors.text}"
    rounded: "{rounded.piller}"
    padding: "0 28px"
    height: "64px"
  falt-chip:
    backgroundColor: "{colors.sammet}"
    textColor: "{colors.text}"
    rounded: "{rounded.piller}"
    padding: "0 20px"
    height: "48px"
  kort:
    backgroundColor: "{colors.sammet}"
    rounded: "{rounded.kort}"
    padding: "20px"
  kalla:
    backgroundColor: "{colors.sammet-2}"
    textColor: "{colors.dov}"
    rounded: "{rounded.chip}"
    padding: "8px 14px 8px 10px"
---

# Design System: Vad svarar AI?

## Overview

**Creative North Star: "Svarsteatern"**

Besökaren sitter i en mörk salong. Ridån är oxblod och hänger i lodräta veck. Fyra AI-tjänster står på scenen och svarar på riktiga kundfrågor medan besökaren tittar. Spänningen ligger i om företagets namn sägs. När namnet sägs tänds det i rampljus. Allt annat på sidan är lågmält, så att det enda starka ljuset är det som betyder något.

Sidan är mörk för att den är en scen, inte för att verktyget är teknik. Ljuset är varmt som glödlampor, aldrig neon. Tätheten är låg i första vyn (en rubrik, ett fält, en knapp) och hög när svaren kommer, där texten får gott radavstånd för att gå att läsa på mobil.

**Key Characteristics:**
- Ridån är riktig WebGL (Silk), laddas efter första målningen och står still vid reducerad rörelse.
- Rampljuset (bärnsten) är reserverat för företagets namn och räknarens tal när det är större än noll.
- Strålkastarljuset (glödlampsvitt) visar vilken tjänst som talar.
- Samma typsnitt som kemero.se: Inter med optisk storlek, stora och täta rubriker i vikt 600 och lugn brödtext.

## Colors

En mörk, varm palett där två ljus gör allt arbete: glödlampsvitt för scenen och bärnsten för namnet.

### Primary
- **Rampljus** (ramp): företagets namn när det sägs i ett svar, pricken på fliken där namnet finns, gnistan och talet i räknaren när det är större än noll. Inget annat.

### Secondary
- **Glödlampsljus** (ljus): huvudknappen "Fråga AI", fokusringen, strålkastarljuset på kort som svarar och markören som pulserar i väntan.

### Neutral
- **Salong** (salong): marken bakom allt.
- **Ridå** (rida): tonen i Silk-tyget. Vecken ljusnar mot rosa i högdagrarna.
- **Sammet** (sammet): kort och fält.
- **Djup sammet** (sammet-2): vald flik och källchips.
- **Ljus text** (text): rubriker och starka ord. 16,1:1 mot sammet.
- **Dov text** (dov): brödtext i svaren och förklarande rader. 8,9:1 mot sammet.
- **Svag text** (svag): frågan i kursiv, metadata och etiketter. 4,7:1 mot djup sammet, lägsta tillåtna.
- **Fel** (fel): felmeddelanden och fältkanter vid fel.

### Named Rules
**Rampljusregeln.** Bärnsten betyder "namnet sägs här". Den används aldrig som dekor, på knappar eller på tal som är noll.

**Ett ljus i taget.** Glödlampsljus och rampljus får aldrig tävla på samma element.

## Typography

**Display Font:** Inter (Variable med optisk storlek, självhostad via @fontsource, samma som kemero.se)
**Body Font:** Inter (Variable, självhostad via @fontsource)

**Character:** Ett typsnitt för allt, som på kemero.se. Den optiska storleken gör rubrikerna täta och skarpa i stor grad och texten öppen och lättläst i långa svar. Reservtypsnittet Inter Fallback är Arial med Inters mått, så att texten inte hoppar när Inter laddas.

### Hierarchy
- **Display** (600, clamp(2.75rem, 11vw, 6rem), 1.02): startsidans rubrik, max 13 tecken breda rader, ord för ord in.
- **Headline** (600, clamp(1.6rem, 6.5vw, 2.6rem), 1.05): räknaren "kemero nämns i 4 av 8 svar".
- **Title** (600, 1.75rem, 1): tjänsternas namn i korten.
- **Body** (400, 1rem, 1.65): svaren. Rubriker i svaren sätts i 1.05rem och vikt 600.
- **Label** (400, 0.85rem): flikar, chips och metadata. Tal sätts med tabular-nums.

### Named Rules
**Tät rubrik, luftig text.** Rubriker har -0.03 till -0.035em spärrning och radavstånd under 1.05. Brödtext har aldrig mindre än 1.6 i radavstånd.

## Layout

Mobil först. Innehållet ligger i en kolumn med max 72rem bredd och 16px kant (24px från 640px). Första vyn är minst 100svh hög med rubriken och formuläret centrerade lodrätt. Under en körning ligger räknaren klistrad överst som en rundad remsa, 8px från kanten (12px från 640px). Korten ligger i en kolumn på mobil och två kolumner från 1024px, med 16px mellanrum.

Formulärets extrafält kommer fram först när namnet har minst två tecken. Bransch tar en hel rad på mobil, ort och hemsida delar nästa.

## Elevation & Depth

Djup kommer från ljus, inte från skuggor. Kort och fält är platta ytor med en 1px kant i glödlampsljus på 11 till 24 procents styrka. Den enda skuggan är glöden under huvudknappen. Kort som svarar får ett fast strålkastarljus uppifrån som tonas bort när svaret är klart. På skrivbordet följer dessutom ett ljus pekaren över korten.

### Shadow Vocabulary
- **Knappglöd** (`box-shadow: 0 10px 40px -12px rgb(255 226 184 / 0.6)`): bara på "Fråga AI".
- **Rampglöd** (`text-shadow: 0 0 18px rgb(255 181 71 / 0.55)`): på tänt namn och prick.

### Named Rules
**Ljus i stället för skugga.** Ett element lyfts genom att belysas, aldrig genom en mörk skugga.

## Shapes

Mjukt men inte runt. Kort har 16px hörn. Källchips har 12px. Fält, knappar, flikar och räknarremsan är piller, eftersom de är små kontroller man trycker på.

## Components

### Buttons
- **Shape:** piller (9999px), 56px hög.
- **Primary:** glödlampsljus med salongsfärgad text i vikt 600. Magnetisk på skrivbordet (React Bits Magnet), stilla vid reducerad rörelse.
- **Hover / Focus:** ljusnar till #fff0d9. Fokus är en 2px ring i glödlampsljus med 3px avstånd.
- **Secondary:** genomskinlig med 1px kant i glödlampsljus på 24 procent, för "Fråga om ett annat företag" och "Fråga igen".

### Chips
- **Källor i svarskortet:** djup sammet, 12px hörn, favicon 20px på en ljus platta (ljus text, 5px hörn), sidans titel i ljus text och domänen under i svag text. Tonar in en i taget med 70ms mellanrum.
- **Källor i sammanfattningen:** samma chip med domänen i ljus text och, i svag text, tjänsten som läste den eller antalet tjänster. Tonar in med 50ms mellanrum.
- **Kontrollera:** liten pillerflagga före ett påstående, 1px kant och text i glödlampsljus. Bara när tjänsterna säger emot varandra eller uppgiften kommer från en katalog.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** sammet.
- **Shadow Strategy:** ingen skugga, se Elevation & Depth.
- **Border:** 1px glödlampsljus på 11 procent.
- **Internal Padding:** 20px på mobil, 28px från 640px.

### Inputs / Fields
- **Style:** sammet på 80 till 85 procent med lätt oskärpa bakom, piller, 1px kant på 24 procent. Namnfältet är 64 till 72px högt med text i 1.35 till 1.5rem.
- **Focus:** kanten blir glödlampsljus. Markören är bärnsten.
- **Error:** kanten blir fel-färgen och meddelandet står under fältet.

### Svarskortet (signatur)
Ett kort per tjänst med tjänstens namn och modellnamn, två flikar ("Vem rekommenderas?" och "Om {företag}") och svaret som strömmar in. Fliken visar en pulserande prick medan svaret kommer och en bärnstensprick när namnet finns. Frågan står i kursiv ovanför svaret. Första gången namnet syns i en öppen flik tänds det med understreck i rampljus och en kort gnista (React Bits Click Spark, bara via kod). Under svaret står "{Tjänst} läste N källor" med källchipen.

### Sammanfattningen (signatur)
Kommer under svaren när alla åtta är klara och fylls i medan analysen strömmar.
- **Huvudmeningarna:** två meningar i Display och Headline (max 20 och 30 tecken breda) om vilka tjänster som känner till företaget och om någon rekommenderar det. Företagets namn tänds med rampljus som i svaren. Inga mätartavlor.
- **Rad per tjänst:** tjänstens namn, "Rekommenderar, plats N" i rampljus eller "Rekommenderar inte", och ett ordagrant citat ur svaret i kursiv. Citatet visas bara om koden hittar det i svaret, annars modellens omdöme.
- **Staplar:** en per företag som nämns, 8px hög på djup sammet. Företagets egen stapel är rampljus, konkurrenternas glödlampsljus på 70 procent. Staplarna växer från vänster när listan syns (1.1s, 90ms mellan raderna) och står i full längd vid reducerad rörelse.
- **Tre saker att göra:** numrerade 1 till 3 i vikt 600 och glödlampsljus, eftersom ordningen är den viktigaste först. Uppmaningen i Title-storlek (max 34 tecken bred) och skälet under i dov text.

## Do's and Don'ts

### Do:
- **Do** låt bärnsten betyda en sak: att namnet sägs.
- **Do** visa tjänsternas och modellernas namn i klartext, aldrig logotyper eller modell-ID:n.
- **Do** ladda WebGL och tunga komponenter efter första målningen och låt allt stå still vid reducerad rörelse.
- **Do** låt varje rörelse säga något: väntan, träff, källa eller resultat.

### Don't:
- **Don't** använd gradienttext, ikonplattor eller etiketter ovanför rubriker.
- **Don't** lägg skuggor under kort eller fält.
- **Don't** använd neonfärger eller kall blåsvart bakgrund. Salongen är varm.
- **Don't** låt något annat än företagets namn glöda.
