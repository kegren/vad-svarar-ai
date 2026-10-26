---
name: Vad svarar AI?
description: Fyra AI-tjänster svarar på riktiga kundfrågor i direktsändning medan företagaren lyssnar.
colors:
  emalj: "#eee8dc"
  glas: "#f7f2e7"
  glas-2: "#e6decf"
  bakelit: "#1a1714"
  dov: "#544a42"
  svag: "#6e645a"
  vav: "#3a332d"
  vav-2: "#2e2823"
  vavtext: "#f3ece1"
  vavdov: "#c7bcae"
  sandning: "#c4301a"
  sandning-ljus: "#ff8a6e"
  fel: "#9e2a1a"
typography:
  display:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 10vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 5.5vw, 1.9rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.3
  micro:
    fontFamily: "Inter Variable, Inter Fallback, -apple-system, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  front: "20px"
  skala: "12px"
  lampa: "3px"
  piller: "9999px"
spacing:
  tat: "8px"
  grupp: "16px"
  sektion: "24px"
components:
  knapp-primar:
    backgroundColor: "{colors.bakelit}"
    textColor: "{colors.glas}"
    rounded: "{rounded.piller}"
    padding: "0 36px"
    height: "56px"
  knapp-sekundar:
    textColor: "{colors.bakelit}"
    rounded: "{rounded.piller}"
    padding: "8px 16px"
  falt-namn:
    backgroundColor: "{colors.glas}"
    textColor: "{colors.bakelit}"
    rounded: "{rounded.piller}"
    padding: "0 28px"
    height: "64px"
  mottagare:
    backgroundColor: "{colors.glas}"
    rounded: "{rounded.front}"
    padding: "20px"
  skala:
    backgroundColor: "{colors.glas}"
    rounded: "{rounded.skala}"
    height: "84px"
  vav:
    backgroundColor: "{colors.vav}"
    textColor: "{colors.vavtext}"
    padding: "20px"
  kalla:
    backgroundColor: "{colors.vav-2}"
    textColor: "{colors.vavdov}"
    rounded: "{rounded.skala}"
    padding: "8px 14px 8px 10px"
---

# Design System: Vad svarar AI?

## Overview

**Creative North Star: "Direktsändningen"**

Sidan är lokalradions inringningsprogram. Kunderna ringer in sin fråga och fyra AI-tjänster svarar i direktsändning. Besökaren ställer in mottagaren på en station i taget och läser svaret som textas fram i högtalarväven. När företagets namn sägs tänds sändningslampan.

Fronten är ljus, varm och emaljerad. Det mörka finns bara i väven där svaren står, så att ögat hamnar där texten kommer. Sändningsrött är den enda kulören och betyder alltid att namnet sägs eller att sändningen pågår.

Startsidan är aldrig tom. Ett riktigt exempel (kemero, webbyrå i Västerås) spelas upp i mottagaren innan besökaren frågar själv. Uppspelningen läser en sparad körning och gör inga anrop.

**Key Characteristics:**
- En mottagare i stället för åtta kort, så att sidan inte blir lång på mobil. Väven har fast höjd och rullar inuti.
- Frekvensskalan med fyra stationer och en röd nål visar vilken tjänst man lyssnar på. Nålen svänger själv till första stationen som säger namnet, tills besökaren väljer själv.
- Samma typsnitt som kemero.se: Inter med optisk storlek, täta rubriker i vikt 600 och lugn brödtext.
- Inga kort, ingen gradienttext, inga ikonplattor och inga skuggor.

## Colors

En ljus och varm palett av emalj, glas och bakelit med en mörk väv och en enda röd.

### Primary
- **Sändningsrött** (sandning): företagets namn i svaren och i sammanfattningen, nålen, stationens prick när namnet finns och den egna stapeln. 4,55:1 mot emalj.
- **Ljust sändningsrött** (sandning-ljus): samma roll inne i väven och i sändningslampan. 5,4:1 mot väv.

### Neutral
- **Emalj** (emalj): marken bakom allt.
- **Glas** (glas): mottagarens front, skalan och fälten.
- **Mörkt glas** (glas-2): staplarnas spår och vald knapp i frågeväljaren.
- **Bakelit** (bakelit): text, huvudknappen, mottagarens kant och fokusringen. 14,6:1 mot emalj.
- **Dov text** (dov): förklarande text. 7,1:1 mot emalj.
- **Svag text** (svag): metadata, tidsrader och etiketter. 4,7:1 mot emalj, lägsta tillåtna.
- **Väv** (vav) och **djup väv** (vav-2): ytan där svaren textas och källchipen i den.
- **Vävtext** (vavtext) och **dov vävtext** (vavdov): svarets text och dess metadata. 10,6:1 och 6,6:1 mot väv.
- **Fel** (fel): felmeddelanden och fältkanter vid fel.

### Named Rules
**Sändningsregeln.** Rött betyder "namnet sägs här" eller "sändningen pågår". Det används aldrig som dekor, på knappar eller på tal. Räknaren står i bakelit.

**Mörkt bara där svaren står.** Väven är den enda mörka ytan. Sammanfattningen och läsbarhetskontrollen ligger på emaljen.

## Typography

**Display Font:** Inter (Variable med optisk storlek, självhostad via @fontsource, samma som kemero.se)
**Body Font:** Inter (Variable, självhostad via @fontsource)

**Character:** Ett typsnitt för allt. Den optiska storleken gör rubrikerna täta i stor grad och texten öppen i långa svar. Reservtypsnittet Inter Fallback är Arial med Inters mått, så att texten inte hoppar när Inter laddas.

### Hierarchy
- **Display** (600, clamp(2.75rem, 10vw, 4.5rem), 1.02): startsidans rubrik, max 13 tecken breda rader, ord för ord in.
- **Headline** (600, clamp(1.35rem, 5.5vw, 1.9rem), 1.08): räknaren "kemero nämns i 4 av 8 svar". Sammanfattningens rubriker står i 1.6rem och 2rem från 640px.
- **Title** (600, 1.15rem): knappen "Fråga AI", kontrollernas rubriker och de tre sakerna att göra.
- **Body** (400, 1.05rem, 1.65): svaren i väven. Text på emaljen står i 0.95 till 1rem.
- **Label** (400, 0.8rem): stationernas namn, källchip och exemplets undertext.
- **Micro** (500, 0.75rem): flaggan Kontrollera och små detaljer. Tal sätts med tabular-nums.

### Named Rules
**Tät rubrik, luftig text.** Rubriker har -0.03 till -0.035em spärrning och radavstånd under 1.1. Brödtext har aldrig mindre än 1.6 i radavstånd.

## Layout

Mobil först. Innehållet ligger i en kolumn med 16px kant (24px från 640px). På mobil kommer rubriken, fältet och knappen först och mottagaren med exemplet direkt under. På skrivbord står rubrik och formulär till vänster och mottagaren till höger på samma horisont, med högst 34rem för mottagaren.

Under en körning byts exemplet mot besökarens egen mottagare i en kolumn på max 56rem. Sammanfattningen kommer under när alla åtta svar är klara. Väven är 24rem hög på mobil och 26rem från 640px, så sidan blir aldrig längre för att ett svar är långt.

## Elevation & Depth

Djup kommer från material, inte från skuggor. Mottagaren har en 1.5px kant i bakelit. Skalan och fälten har tunna linjer i bakelit på 14 eller 32 procent. Väven har ett fint prickmönster som ger tyg utan att störa texten. Den enda glöden är sändningslampan.

### Shadow Vocabulary
- **Lampglöd** (`box-shadow: 0 0 0 3px rgb(232 64 42 / 0.18), 0 0 14px rgb(232 64 42 / 0.6)`): bara på sändningslampan bredvid "Vad svarar AI?" i toppen. Den lyser och pulserar långsamt när någon mottagare på sidan sänder (`html:has([data-sander="true"])`), annars är den bakelit på 20 procent.

### Named Rules
**Linje i stället för skugga.** Ett element avgränsas med en linje eller ett material, aldrig med en mörk skugga.

## Shapes

Mottagaren har 20px hörn som en radiofront. Skalan och källchipen har 12px. Fält, knappar och frågeväljaren är piller. Lampan och nålen är runda.

## Components

### Buttons
- **Primary:** bakelit med glastext i vikt 600, piller, 56px hög. Ljusnar till #2e2a26 vid hover och trycks ihop till 98 procent.
- **Secondary:** genomskinlig med en linje i bakelit på 32 procent, för "Fråga om ett annat företag". I väven används vävtext och vävlinje, för "Fråga igen".
- **Focus:** 2px ring i bakelit med 3px avstånd. I väven är ringen vävtext.

### Inputs / Fields
- **Style:** glas, piller, linje i bakelit på 32 procent. Namnfältet är 64 till 72px högt med text i 1.35 till 1.5rem.
- **Focus:** kanten blir bakelit och pillerformen står kvar. Markören är sändningsröd.
- **Error:** kanten blir fel-färgen. Meddelandet står under fältet.

### Mottagaren (signatur)
Används både för exemplet och för besökarens egen körning.
- **Huvudet:** räknaren till vänster och status till höger ("I sändning · 3 av 8", "Klart", "Spelas upp" eller "Spela igen"). Status bryts under räknaren när raden inte räcker. Lampan sitter i sidans topp, inte här.
- **Frekvensskalan:** glas med streck var 12:e pixel, fyra stationer (14, 38, 62 och 86 procent) och en röd nål som glider dit (0.7s). Skalan är en tablist som styrs med piltangenterna. Under varje station sitter en prick: röd när namnet finns, pulserande medan svaret kommer, svag när den väntar.
- **Frågeväljaren:** två piller, "Vem rekommenderas?" och "Om {företag}", med en röd prick när namnet finns i det svaret.
- **Väven:** en tabpanel med frågan i kursiv och svaret som textas fram. Den följer texten medan den strömmar. När ett svar blir klart visar den första stället där namnet sägs en tredjedel ner, annars början. Samma sak gäller när besökaren byter till ett klart svar. Överkanten tonas ut med en mask. Första gången namnet syns i ett öppet svar tänds det i ljust sändningsrött med understreck och en kort gnista (React Bits Click Spark, bara via kod). Under svaret står "{Tjänst} läste N källor" med källchip i en kolumn på mobil och två från 640px.

### Exemplet
En sparad körning spelas upp 18 tecken åt gången var 70:e ms. Tjänsterna börjar lite efter varandra som i en riktig körning. Vid reducerad rörelse står hela texten direkt. Raden under säger att det är en riktig körning och från vilket datum.

### Sammanfattningen (signatur)
Kommer under mottagaren när alla åtta svar är klara och fylls i medan analysen strömmar.
- **Domslutet:** på glas med 1.5px kant i bakelit, som mottagarens front. Två meningar om vilka tjänster som känner till företaget och om någon rekommenderar det. Namnet tänds i sändningsrött som i svaren.
- **Rad per tjänst:** i domslutet. Raden har samma prick som på skalan (röd när tjänsten rekommenderar företaget), tjänstens namn, "Rekommenderar, plats N" eller "Rekommenderar inte" och ett ordagrant citat i kursiv. Citatet visas bara om koden hittar det i svaret.
- **Staplar:** en per företag som nämns, 8px hög på mörkt glas. Den egna stapeln är sändningsröd och konkurrenternas bakelit på 70 procent. De växer fram från vänster när listan syns.
- **Källorna de läste:** chip med favicon på glasplatta, domän och vilka tjänster som läste sidan.
- **Vad de säger:** varje påstående har en tunn hänvisningslinje till en hängande källkolumn med domänen och tjänsterna. På mobil står källan under påståendet.
- **Kontrollera:** liten pillerflagga i bakelit före ett påstående när tjänsterna säger emot varandra eller uppgiften kommer från en katalog.
- **Tre saker att göra:** numrerade 1 till 3 i stor siffra, uppmaningen i vikt 600 och skälet under i dov text.

### Läsbarhetskontrollen (signatur)
Sektionen "Kan AI läsa din hemsida?".
- **Rad per kontroll:** en ring på 28px med ett tecken som ritas när listan syns: bock i bakelit för klarar, kryss i fel-färgen för klarar inte, streck för varning och bara ringen för okänt. Sändningsrött används inte här.
- **Länken till besiktningen:** under listan, i svag text med en tunn pil. Ingen knapp, ingen ram och ingen färg som sticker ut (PLAN.md avsnitt 0).

## Do's and Don'ts

### Do:
- **Do** låt rött betyda en sak: att namnet sägs eller att det sänds.
- **Do** visa tjänsternas och modellernas namn i klartext, aldrig logotyper eller modell-ID:n.
- **Do** låt exemplet spelas upp ur sparad data, aldrig med nya anrop.
- **Do** låt allt stå still och visas helt vid reducerad rörelse.

### Don't:
- **Don't** använd kort i rader, gradienttext, ikonplattor eller etiketter ovanför rubriker.
- **Don't** lägg skuggor under ytor. Lampan är den enda glöden.
- **Don't** gör fler ytor mörka än väven.
- **Don't** låt sidan växa med svarens längd. Väven rullar inuti.
