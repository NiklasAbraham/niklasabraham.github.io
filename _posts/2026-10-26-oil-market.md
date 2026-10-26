---
layout: default
title: The crack writes the story. How the world oil market works, from the well to the pump, in the year of the Hormuz war
description: The whole oil market in one long read, told the way an engineer would draw it. What crude is, why a column sorts it by boiling point and what a refinery does with it, how a Saudi giant, a North Sea platform and a shale well differ, why the crack spread matters more than the price, who pumps and who burns, how oil moves through eight chokepoints, the world's pipelines and the attacks on them, what a supertanker costs per barrel, sanctions and the dark fleet, how Brent and WTI are set and why the gap between them is the price of a voyage, the futures curve, and the 2026 Iran war that closed the Strait of Hormuz. Twenty-five interactive charts and maps, with moving tankers and a world pipeline map, six drawings, EIA data to 20 October 2026, and a source for every claim.
date: 2026-10-26
tags: [oil, energy, markets, geopolitics, data, engineering]
image: /assets/blog-thumbs/oil-market.webp
categories: [long-read]
read_time: 75 # the word count does not include the interactive figures
---
<article class="da oil" markdown="1" data-stations="off" data-brand="The oil market" data-brand-sub="crude, cracks and conflict · a long read" data-contact="https://www.linkedin.com/in/niklas-abraham-05983b247">

<p class="da-eyebrow">Blog · Long read · 19 interactive figures, 4 drawings · every claim sourced</p>
<h1 class="da-title">The crack writes the story</h1>
<p class="da-lede">In September 2026, buying three barrels of American crude and selling two barrels of gasoline and one of diesel in New York Harbor earned $68 per barrel of crude, more than in any month since the price series began twenty years ago. In the week before the war, in February, the same trade earned $29. The price of oil makes the headlines; the gap between what crude costs and what fuels sell for decides what refineries run, where tankers sail and what a litre costs at the pump. This is the whole oil market, from the molecule to the pump, drawn the way an engineer would draw it and told through the year the Strait of Hormuz closed.</p>
<p class="da-meta">Written by an AI, published by Niklas Abraham · 26 October 2026 · about 55 minutes · price data to 20 October 2026, news to 26 October · 19 interactive figures and 4 drawings</p>

<div class="da-note ai-note" markdown="1">
**This article was written by an AI.** I saw a short video by *Crude & Conflict* {% include oil-ref.html k="reel" %} that explained the crack spread with engineering drawings of barrels, a distillation column and tankers, and I wanted to understand the entire oil market in that way. So I asked Claude (an AI model from Anthropic) to research, write and code this article to help me learn more. The price, stock and production series are downloaded from the US Energy Information Administration and plotted by script; every other number is quoted from an agency report, a company document or a news report and carries a tag such as {% include oil-ref.html k="iea-mar" %} that leads to the [reference list](#sources). Many 2026 numbers come from paywalled or blocked pages (Reuters, Bloomberg, Argus, the IEA's October report); where only a search summary was seen the list says "snippet", and the number is "as reported". Different trackers disagree about 2026 tanker flows by several million barrels a day, and the text says so where it matters. The drawings are schematic. The prose may contain mistakes, so check what you rely on at its source. If you find an error, [message me on LinkedIn](https://www.linkedin.com/in/niklas-abraham-05983b247). Nothing here is investment or trading advice.
</div>

**The question.** Oil is the largest traded commodity on earth, about 100 million barrels a day, and almost everyone meets it only as one number: the price of a barrel. That number hides three markets stacked on top of each other. There is a market for crude, which nobody uses as it comes out of the ground. There is a market for refining, which turns crude into fuels and earns the difference. And there is a market for moving oil, by pipe and by ship, which in 2026 became the most expensive part of the whole chain. The useful questions are physical ones. What is in a barrel? What does a refinery do to it? Who pumps it, who burns it, which way does it travel and through which narrow straits? How do two grades on opposite sides of the Atlantic come to set the price of all the others? And what happened when the narrowest strait of all was closed?

The article has five parts, and every figure in it can be played with.

1. **The molecule and the machine.** What crude is, why a column sorts it by boiling point, what a refinery does to it, and the crack spread.
2. **Pumps and burners.** Who produces oil, who uses it, how a Saudi giant, a North Sea platform and a shale well get it out of the rock, what a barrel costs to produce, and the spare capacity that was meant to protect the market.
3. **Moving it.** Sea lanes and chokepoints, supertankers and the price of a voyage, the sanctioned dark fleet, the world's pipelines and the attacks on them, and the tank farm in Oklahoma that sets the American price.
4. **The price.** The benchmarks, the futures curve, and why Brent minus WTI is the price of crossing the Atlantic.
5. **2026.** The Hormuz war month by month, the diesel crisis it caused, the stocks that were drawn, and what a litre costs.

<nav class="da-toc" markdown="0">
<span class="lbl">Contents</span>
<ol>
<li><a href="#crack">The most important number is not the price</a></li>
<li><a href="#crude">What crude oil is</a></li>
<li><a href="#column">Why each product leaves at its own height</a></li>
<li><a href="#refinery">Inside a refinery</a></li>
<li><a href="#spread">The crack spread</a></li>
<li><a href="#pump">Who pumps</a></li>
<li><a href="#burn">Who burns</a></li>
<li><a href="#upstream">Three ways out of the ground</a></li>
<li><a href="#cost">What a barrel costs</a></li>
<li><a href="#opec">OPEC+ and the spare barrels</a></li>
<li><a href="#lanes">Sea lanes and chokepoints</a></li>
<li><a href="#tanker">The tanker and the price of a voyage</a></li>
<li><a href="#sanctions">Sanctions and the dark fleet</a></li>
<li><a href="#pipelines">The pipelines of the world</a></li>
<li><a href="#cushing">Pipes, hubs and the tank in Oklahoma</a></li>
<li><a href="#benchmarks">Brent, WTI and Dubai</a></li>
<li><a href="#curve">The curve: contango and backwardation</a></li>
<li><a href="#gap">Brent minus WTI is a voyage</a></li>
<li><a href="#history">Forty years of the price</a></li>
<li><a href="#war">2026: the strait closes</a></li>
<li><a href="#diesel">The diesel crisis</a></li>
<li><a href="#stocks">The tanks run down</a></li>
<li><a href="#litre">What a litre costs</a></li>
<li><a href="#limits">What this article cannot tell you</a></li>
<li><a href="#sources">Sources</a></li>
</ol>
</nav>

<p class="da-part">Part I<strong>The molecule and the machine</strong></p>

<h2 id="crack"><span class="num">01</span>The most important number is not the price</h2>

Start with the claim the reel makes in its first second: oil's most important number isn't the price, it's the crack {% include oil-ref.html k="reel" %}. A barrel of crude is worth nothing to a driver, a pilot or a farmer. It is worth only what can be made from it, and what can be made from it depends on a machine: the refinery. The refinery buys crude, boils it, splits it by boiling point and cracks the heavy molecules into lighter, more valuable ones. What it earns per barrel is the **crack spread**: what the products sell for minus what the crude cost.

The barrel in the first figure is the American average. In 2023 US refineries turned each 42-gallon barrel of crude into 19.6 gallons of gasoline, 12.5 of diesel and heating oil, 4.4 of jet fuel and a tail of coke, gases, asphalt, lubricants and fuel oil, 44.65 gallons in all {% include oil-ref.html k="eia-yields" %}. The output is larger than the input because the products are less dense than the crude: mass is conserved, volume grows. This "processing gain" was 5.9 per cent in 2025 {% include oil-ref.html k="eia-yieldseries" %}.

{% include oil.html kind="barrel" title="One barrel, <em>cracked open</em>" caption="What US refineries made from one 42-gallon barrel (159 litres) of crude in 2023, in gallons: the stack is taller than the barrel because the products are lighter than the crude. Data: EIA, refining inputs and outputs." %}

A refinery that sells $150 of products for every $100 of crude does not care much whether crude costs $70 or $110, as long as the gap holds. Everyone downstream of it does care, because the gap is part of every litre they buy. In 2026 that gap, not the crude price, reached a record, and it explains why diesel cost more in Germany in September than at any time before, why European refineries lost money in October while American ones made record margins, and why the price of a barrel of Brent and a barrel of WTI drifted $25 apart.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **A barrel of crude is worth only what can be made from it.** The margin between products and crude, the crack, is what reaches the pump → when the crack moves, fuel prices move even if crude does not.
- **In 2026 that margin, not crude, set the record.** → The shock is best read as a refining shock: watch the crack, not only the barrel.

</div>

{: .da-bridge}
To see why the gap exists at all, start with what crude is: not one substance but a mixture, different in every field.

<h2 id="crude"><span class="num">02</span>What crude oil is</h2>

Crude oil is a mixture of hydrocarbons, from methane with one carbon atom to asphaltenes with hundreds, with sulphur, nitrogen, nickel and vanadium bound into the heavy end. Two numbers describe a grade well enough to trade it. **API gravity** measures density on an inverted scale,

$$\text{°API} = \frac{141.5}{\text{SG}_{60\,\text{°F}}} - 131.5,$$

so water is 10 °API, a light crude 35 to 45 and a heavy crude below 22. **Sulphur** in weight per cent splits "sweet" (under about 0.5 per cent) from "sour". Brent Blend is about 38 °API with 0.4 per cent sulphur, WTI about 40 with 0.2, Arab Light 33 with 2.0, Mexico's Maya 22 with 3.3, and Western Canadian Select about 20 to 21 with 3.4 to 3.7 {% include oil-ref.html k="wiki-grades" %}.

What a refiner really wants to know is the **assay**: how much of the crude boils off in each temperature range when it is distilled in the laboratory. Those ranges are the products. TotalEnergies publishes assays for the grades it trades, and they show the pattern every refiner knows {% include oil-ref.html k="total-assay" %}. A light sweet crude such as Brent or Murban is about 35 to 40 per cent naphtha and kerosene, 26 to 28 per cent gasoil and only 10 to 14 per cent vacuum residue, the part that boils above 550 °C. A heavy sour crude such as a Canadian synthetic bitumen blend is half as rich in the light cuts and carries about 28 per cent vacuum residue at 3 per cent sulphur.

{% include oil.html kind="assay" title="Six crudes, <em>six different barrels</em>" caption="Straight-run yields by boiling range in weight per cent, from TotalEnergies assays (true boiling point distillation; gas and LPG are the remainder to 100). Light grades sit at the top, heavy ones at the bottom. Hover a segment for its value." %}

One row in the figure matters more than the others: the gasoil cut, the raw material of diesel. It is 23 to 29 per cent for almost every grade, light or heavy (Nigeria's Bonny Light, at 36 per cent, is the exception). No crude comes out of the ground as mostly diesel. Most of the diesel in the world has to be **made**, by cracking the heavier vacuum gasoil and residue. That is the engineering behind the reel's line that "crude gets priced by the diesel inside it": a grade is worth what its middle distillates plus the diesel a complex refinery can crack out of its heavy end are worth.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Every crude is a different mixture.** Light sweet grades carry more naphtha and kerosene, heavy sour ones more residue and sulphur → refiners pay for the products inside a grade, not for "oil".
- **Gasoil is 23 to 29 per cent of almost every grade.** → No crude is mostly diesel; most diesel has to be made by cracking heavier oil.

</div>

{: .da-bridge}
Before the machine, the physics it uses: why the molecules of a crude can be sorted by heat at all.

<h2 id="column"><span class="num">03</span>Why each product leaves at its own height</h2>

The hydrocarbons in crude hold together in the liquid only through weak attractions between neighbouring molecules, and those grow with the surface a molecule offers. Each extra CH₂ group adds about the same surface, so the boiling point climbs steadily with size: methane boils at −161.5 °C, hexane at 69, hexadecane (C16, a typical diesel molecule) at 287, and a C40 wax at about 522 °C {% include oil-ref.html k="nist" %} {% include oil-ref.html k="wiki-alkane" %} {% include oil-ref.html k="d2887" %}. Shape matters as well: a branched molecule is more compact and boils lower, a flat ring packs better and boils higher. Iso-octane, with eight carbons, boils with heptane; naphthalene, with ten, boils with the chains of twelve and thirteen {% include oil-ref.html k="psu" %}. A product cut is therefore defined by its boiling range, not by a carbon count, and the carbon ranges in the table overlap.

{% include oil.html kind="boil" title="Size sets <em>the boiling point</em>" caption="Normal boiling points of the straight-chain alkanes C1 to C40 (NIST WebBook, CRC Handbook values via Wikipedia, ASTM D2887 calibration table), with rings and branched molecules as triangles, and the boiling ranges of the product cuts (TotalEnergies assay cut points). The red band is where thermal cracking begins (OSHA, Penn State). The vacuum curve is my Clausius–Clapeyron estimate at 50 mmHg, fitted to measured reduced-pressure boiling points; approximate." %}

| Cut | Boiling range | Carbon atoms (straight chains) | Goes to |
|---|---|---|---|
| Gas and LPG | below 15 °C | C1–C4 | refinery fuel, LPG, petrochemicals |
| Light naphtha | 15–80 °C | C5–C6 | gasoline blending, steam crackers |
| Heavy naphtha | 80–150 °C | C7–C9 | the reformer: high-octane gasoline and hydrogen |
| Kerosene | 150–230 °C | C10–C12 | jet fuel |
| Gasoil | 230–375 °C | C13–C22 | diesel and heating oil, after desulphurisation |
| Vacuum gasoil | 375–565 °C | C23–C44 | cracker feed, lubricants |
| Vacuum residue | above 565 °C | C45 and up | asphalt, coker, fuel oil |

The cut points are those of the TotalEnergies assays {% include oil-ref.html k="total-assay" %}; other refiners place them tens of degrees apart, because a cut point is a choice: a refinery short of diesel cuts its kerosene narrower and its gasoil wider {% include oil-ref.html k="psu" %}.

A laboratory measures a crude's whole distribution in a **true boiling point** (TBP) distillation: it boils off the crude in a column of many plates and weighs what has come over at each temperature. The curve says, for every temperature, how much of the crude boils below it. Brent has 59 per cent of its weight off by 350 °C; Angola's heavy Dalia only 36 per cent; Canadian WCS, measured by gas chromatography rather than by a still, about 30 per cent {% include oil-ref.html k="total-assay" %} {% include oil-ref.html k="equinor-assay" %} {% include oil-ref.html k="crudemonitor" %}.

{% include oil.html kind="tbp" title="How much <em>boils off</em>" caption="True boiling point curves: cumulative weight per cent distilled against temperature, from TotalEnergies assays (Brent 2006, Oman 2020, Dalia 2015) and Equinor (Grane 2026); WCS is a simulated distillation by gas chromatography (crudemonitor.ca, sample of 1 September 2026), dashed because it is not a physical TBP. The assay sheets start at 80 °C. Pick a cut to read each crude's share of it." %}

A refinery cannot boil off one product at a time like a laboratory still; it has to sort a continuous stream. One boiling is not enough for that. If a 50/50 liquid of heptane and octane is boiled, its vapour is richer in the lighter heptane, because heptane has the higher vapour pressure (Raoult's law), but only 69 per cent heptane. Condense that vapour and boil it again, and it is 83 per cent; after five such stages, 98 per cent. Each stage also boils a little cooler, from 110 to 99 °C, because a lighter mixture boils at a lower temperature (my calculation with NIST's Antoine constants) {% include oil-ref.html k="nist" %}.

{% include oil.html kind="stages" title="One tray is <em>one small still</em>" caption="Vapour composition after each equilibrium stage for two mixtures of straight-chain alkanes, starting from 50/50 liquid at 1.013 bar and total reflux: ideal Raoult's law with NIST Antoine constants (my calculation). Each stage both purifies the vapour and runs cooler." %}

A distillation column is that staircase built vertically. Hot crude, partly vaporised in the furnace, enters near the bottom; the vapour rises through 35 to 50 trays, 60 to 75 centimetres apart, and on each tray it bubbles through a layer of liquid flowing down from the tray above {% include oil-ref.html k="jechura" %}. The heaviest part of the vapour condenses into the liquid, and the heat it releases boils the lightest part of the liquid up into the vapour. So the vapour gets lighter and the column cooler with every tray: in a worked example from a patent, the overhead vapour leaves at about 104 °C, the kerosene draw at 205, diesel at 262, atmospheric gasoil at 322 and the residue at 341 °C (as reported) {% include oil-ref.html k="col-patent" %}. There is no heater at the bottom; all the heat comes in with the feed and is taken out at the top by the condenser and in the middle by **pumparounds**, loops that draw liquid off, cool it against incoming crude and return it {% include oil-ref.html k="jechura" %}.

A product is drawn off where it collects. Below that height the trays are too hot for it to stay liquid, above it they are cool enough that it condenses and runs back down, so it accumulates in the liquid on the trays around the height where the temperature sits in its boiling range. A pipe there takes it out. Small **side strippers** beside the column blow steam through each side stream to send its lightest tail back; at the top, a condenser and a drum separate gas, naphtha and sour water and return part of the naphtha as reflux. Real trays reach only 50 to 60 per cent of a perfect equilibrium stage, so the 35 to 50 trays of a crude column are worth 20 to 30 of the steps in the figure above {% include oil-ref.html k="jechura" %}. The largest single crude column in the world, at the Dangote refinery in Nigeria, weighs about 2,000 tonnes {% include oil-ref.html k="dangote-col" %}.

{% include oil-anat.html name="column" title="The column, <em>cut open</em>" h=1480 caption="Pick a product to see where it is drawn, its boiling range and its share of a light and a heavy crude; the panel below magnifies one bubble-cap tray. Sources and approximations are in the drawing’s own caption." %}

The bottom of the column has one limit: heat. Above about 350 to 370 °C the long molecules begin to break apart in the furnace tubes, so the furnace stops there and about half the crude stays liquid as **atmospheric residue** {% include oil-ref.html k="osha" %} {% include oil-ref.html k="psu" %}. To split it further the residue goes to a second column under vacuum. Lowering the pressure lowers every boiling point: a wax that boils at 500 °C at atmospheric pressure boils at roughly 350 to 400 °C at 50 mmHg, a fifteenth of an atmosphere (my Clausius–Clapeyron estimate, checked against measured boiling points of C22 and C36 wax) {% include oil-ref.html k="wiki-alkane" %}. Under vacuum the heavy gasoil boils off below the cracking temperature. What is left is vacuum residue, the asphalt end of the barrel.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Bigger molecules boil higher, and a column sorts by boiling point.** Each tray is a small still: the vapour gets lighter and the column cooler on the way up → each product is drawn where the column sits in its boiling range.
- **Above about 350–370 °C the molecules start to crack.** → The heavy half of the barrel can only be split under vacuum, and turning it into fuel needs conversion units, not more distillation.

</div>

{: .da-bridge}
Sorting by boiling point gives a refinery its raw streams. Turning the heavy ones into diesel is what the rest of the refinery is for.

<h2 id="refinery"><span class="num">04</span>Inside a refinery</h2>

A refinery is three steps the reel calls *boil, split, crack*.

**Boil and split.** Crude is washed of salt, heated in a fired furnace to 343 to 371 °C and flashed into the bottom of the atmospheric distillation column; heating it further would start to crack it thermally in the furnace tubes, which a refiner avoids {% include oil-ref.html k="osha" %}. The vapour rises through 30 to 50 trays, cooling as it goes, and each fraction condenses at the height where the column is as cool as its boiling point: gas and LPG at the top, naphtha, kerosene, gasoil, and at the bottom the atmospheric residue. The residue is heated again, to about 400 °C, and distilled under vacuum, which lowers the boiling points enough to split off the vacuum gasoil without cracking it {% include oil-ref.html k="osha" %}.

**Crack.** The heavy streams then go to the conversion units, which break long molecules into short ones:

| Unit | Feed → product | Conditions (OSHA manual) |
|---|---|---|
| Fluid catalytic cracker (FCC) | vacuum gasoil → gasoline, LPG, light cycle oil | 482–538 °C, 0.7–2.1 bar, zeolite catalyst |
| Hydrocracker | heavy gasoil → jet and diesel | 69–138 bar of hydrogen |
| Delayed coker | vacuum residue → gas, naphtha, gasoil, petroleum coke | furnace 482–510 °C, drums for about 24 h |
| Reformer | naphtha → high-octane reformate, hydrogen | 3.4–69 bar |
| Hydrotreater | any stream → the same stream without sulphur | 316–427 °C, up to 69 bar |

The table is from the OSHA Technical Manual, converted from °F and psi {% include oil-ref.html k="osha" %}. How much conversion a refinery has is summarised in the **Nelson complexity index**: each unit's capacity relative to the crude unit, weighted by a cost factor (1 for distillation, 6 for an FCC or hydrocracker, 10 for alkylation) {% include oil-ref.html k="wiki-nelson" %}. A simple "hydroskimming" plant scores 2 to 3; the American average is about 9.5 and the European 6.5; India's Jamnagar complex, the largest refining site in the world at 1.4 million barrels a day, scores about 21 {% include oil-ref.html k="wiki-nelson" %}.

{% include oil-anat.html name="refinery" title="A crude distillation unit as a bench model" h=640 caption="Drawing A. Pick a crude and watch the sight glasses: the same column gives a light and a heavy crude very different barrels." %}

The US refining system changed in 2026, but not quite as the reel suggests. Refiners were paid to make diesel, yet the measurable shift in the American output went into **jet fuel**: between February and April 2026 the gasoline yield fell from 46.1 to 43.4 per cent and jet rose from 11.0 to 12.5 per cent, while distillate stayed at about 30 per cent {% include oil-ref.html k="eia-yieldseries" %}. The diesel yield is capped by hardware, hydrocracker and hydrotreater capacity, and cannot be raised by turning a valve; the kerosene cut can be widened. When a yield cannot respond, the price does the rationing. American refineries ran at 98.0 per cent of capacity in the last week of August 2026 {% include oil-ref.html k="eia-wpsr" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Distillation only sorts; conversion units change molecules.** FCC, hydrocracker and coker turn residue and gasoil into lighter fuels → how much diesel a refinery makes is set by its hardware.
- **In 2026 US refiners shifted to jet, not diesel.** → Yields move a few points at most within months; when they cannot move, prices do the rationing.

</div>

{: .da-bridge}
The refinery's income is the difference between its outputs and its input. That difference has a name and a formula.

<h2 id="spread"><span class="num">05</span>The crack spread</h2>

The benchmark the reel uses is the **3-2-1 crack**: three barrels of crude in, two of gasoline and one of diesel out, roughly the American yield ratio. Per barrel of crude,

$$c_{321} = \frac{2\,P_{\text{gasoline}} + P_{\text{diesel}}}{3} - P_{\text{crude}},$$

with product prices quoted in dollars a gallon and multiplied by 42. Using New York Harbor gasoline and diesel against WTI, I get **$28.78 for February 2026 and $68.22 for September**, the highest monthly value since the diesel series begins in June 2006 {% include oil-ref.html k="eia-spot" %}. Both numbers match the reel to the cent and the data site it cites {% include oil-ref.html k="globaloilshock" %}. The daily record was $81.86 on 25 September.

{% include oil-anat.html name="crack-balance" title="The 3-2-1 crack as a balance" h=640 caption="Drawing B. The 3-2-1 crack, month by month since 2006, as a balance of three crude barrels against two gasoline and one diesel barrel." %}

The record depends on which crude you subtract. Against Brent the September crack was only $50.91, because Brent traded $17 above WTI that month; the Gulf Coast version against WTI was $75.59. "Record crack" was an American statement in 2026, and the difference between the three lines in the next figure is itself one of this article's subjects.

{% include oil.html kind="crack" title="Twenty years of <em>the crack</em>" caption="Monthly crack spreads computed from EIA daily spot prices, June 2006 to 20 October 2026. The second view splits the gap: diesel minus crude against gasoline minus crude. The lettered markers are explained on hover." %}

The second view shows where the 2026 gap came from: diesel. Diesel minus WTI averaged $110.82 a barrel in September, against $40.54 in February; gasoline minus Brent fell below zero on 15 October ({% include oil-ref.html k="eia-spot" %}, my calculation). A refinery cannot make one without the other, so when diesel is scarce it runs harder, floods the market with the gasoline it does not need and sells that at a loss. That is the reel's "more diesel, dump the rest".

A refiner is naturally long the crack, so to lock in a margin it **sells** the crack: it buys crude futures and sells product futures in the 3:2:1 ratio. An airline, which is short jet fuel, buys it. The NYMEX lists the components, and ICE lists a European gasoil–Brent crack; on 23 October 2026 that one stood at about $88 a barrel, which matches the reel's "about $90 against Brent" ({% include oil-ref.html k="hellenic-gasoil" %}, own arithmetic: $1,477 a tonne ÷ 7.45 barrels a tonne − Brent near $110).

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **The 3-2-1 crack hit $68 in September 2026, against $29 before the war**, a monthly record since 2006 → refiners with access to crude earned more than at any time in twenty years.
- **Diesel drove it; gasoline fell below Brent.** → A refinery running for diesel floods the market with gasoline, so the two fuels can move in opposite directions.

</div>

{: .da-bridge}
Refining is the middle of the chain. Before it comes the oil itself: where it is pumped and where it is burned.

<p class="da-part">Part II<strong>Pumps and burners</strong></p>

<h2 id="pump"><span class="num">06</span>Who pumps</h2>

The world produced 100.6 million barrels a day of crude, condensate and natural gas liquids in 2025, by the Energy Institute's count {% include oil-ref.html k="ei-sr" %}. Agencies that add biofuels and the refinery processing gain get about 106 {% include oil-ref.html k="eia-steo" %}; the two series must not be mixed. The United States produced 21.1 million barrels a day by the wide definition, 13.66 of it crude, more than Saudi Arabia (11.4) and almost as much as Saudi Arabia and Russia (10.7) together {% include oil-ref.html k="ei-sr" %}. Then come Canada, Iran, Iraq, China, the UAE and Brazil.

{% include oil.html kind="producers" title="Who pumps, <em>who burns</em>" caption="Production (crude, condensate and NGLs) and consumption (total liquids) by country in 2025, in thousand barrels a day, from the Energy Institute Statistical Review 2026. Bubble area is proportional to volume; hover a bubble for both numbers." %}

The American number is the result of the shale revolution: horizontal wells, fractured in dozens of stages, in tight rock that used to be considered source rock rather than reservoir. US crude output went from about 5 million barrels a day in 2008 to over 13 million, and the export ban, in force since 1975, was lifted in December 2015. In April 2026, with the Gulf shut, the United States became a net crude exporter for the first time in more than fifty years and exported a weekly record of 6.44 million barrels a day {% include oil-ref.html k="iea-may" %}.

{% include oil.html kind="us" title="Shale <em>and exports</em>" caption="US crude field production and crude exports, weekly, 2004 to 16 October 2026, thousand barrels a day. Data: EIA Weekly Petroleum Status Report." %}

Shale has a property that shapes the whole market: it runs out quickly. A new well in the Midland basin starts at about 730 barrels a day and produces about 200 a year later, a decline of more than 70 per cent, and delivers about half of its first ten years' oil in its first two (an illustrative fit, see [three ways out of the ground](#upstream)) {% include oil-ref.html k="api-decline" %}. To hold production flat the industry must keep drilling. That makes shale the market's flexible supply, but a slow one: at $100 oil in October 2026 the US had 460 oil rigs, only 40 more than a year earlier (Baker Hughes, as reported), and the EIA expected US crude output to rise just 0.2 million barrels a day in 2026 {% include oil-ref.html k="eia-steo" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **The United States is the largest producer**, 21.1 million barrels a day by the wide definition, and became a net crude exporter in April 2026 → American barrels now cushion shocks elsewhere.
- **Shale grows only while it keeps drilling.** → It answers prices, but with a lag of months, and in 2026 rigs barely rose.

</div>

{: .da-bridge}
Production is concentrated in a few countries; consumption is spread across the world, and the two maps do not overlap.

<h2 id="burn"><span class="num">07</span>Who burns</h2>

The world used 106.5 million barrels a day of liquids in 2025 (103.0 excluding biofuels) {% include oil-ref.html k="ei-sr" %}. The United States used 20.6, China 17.4, the European Union 11.1, India 5.8. Per head the differences are enormous: an American uses about 22 barrels a year, a Saudi 38, a German 9, a Chinese 4.2 and an Indian 1.4, against a world average of 4.6 (EIA data, the research note's calculation).

{% include oil.html kind="demand" title="What the barrels <em>become</em>" caption="World oil demand by product in 2025 (IEA Oil Market Report, February 2026) and barrels per person per year in 2024 (EIA international statistics)." %}

By product, diesel and gasoil (28.9 million barrels a day) lead gasoline (27.8), then LPG and ethane (15.2), jet fuel (7.7), naphtha (7.2) and fuel oil (6.3) {% include oil-ref.html k="iea-feb" %}. Petrochemical feedstocks, LPG, ethane and naphtha together, were set to supply more than half of the growth in 2026 before the war {% include oil-ref.html k="iea-feb" %}. Transport is the rest of the story, and it is where the long-term change shows: the global fleet of electric vehicles displaced about 1.7 million barrels a day in 2025, about 1 million of it in China, where gasoline demand stopped growing in 2025 {% include oil-ref.html k="iea-gevo" %}.

Diesel matters out of proportion to its volume. It moves trucks, trains, ships near shore, tractors, mining machines and back-up generators; there is no quick substitute, and demand for it hardly falls when the price rises. That is why a shortage of diesel, rather than of crude, is what turns an oil shock into an economic one.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Consumption is spread across the world; production is not.** An American uses about 22 barrels a year, an Indian 1.4 → demand growth comes from Asia, supply from a few exporters.
- **Diesel has no quick substitute.** → A diesel shortage, more than a crude shortage, turns an oil shock into an economic one.

</div>

{: .da-bridge}
Between the producers and the consumers sits a cost: what it takes to get a barrel out of the ground. That depends first on the rock.

<h2 id="upstream"><span class="num">08</span>Three ways out of the ground</h2>

Oil does not sit in underground lakes. It sits in the pores of rock, a few per cent to a third of the rock's volume, and it flows to a well only as fast as the rock lets it. That property, **permeability**, spans more orders of magnitude than any other number in this article, and it decides how a field is built, how fast its wells die and what its barrels cost. Three kinds of field supply most of the world's growth and most of its argument.

**The onshore giant.** Ghawar in eastern Saudi Arabia, discovered in 1948 and producing since 1951, is a fold of Jurassic limestone about 280 kilometres long, with the Arab-D reservoir 1.8 to 2.3 kilometres down, about 15 per cent porosity and a permeability of hundreds of millidarcies to several darcies {% include oil-ref.html k="geoexpro-ghawar" %}. Since 1965 seawater has been injected along the field's flanks, below the oil, so that the water pushes the oil up toward the producers on the crest and keeps the pressure from falling. Gas–oil separation plants next to the well groups strip out gas and water before the crude goes by pipe to Abqaiq. Modern wells are "maximum reservoir contact" wells with three or four horizontal branches: at Haradh 32 producers make 300,000 barrels a day, about 9,400 each {% include oil-ref.html k="mrc-haradh" %}. Ghawar peaked at 5.7 million barrels a day in 1981 and its sustainable capacity was 3.8 million in 2018 {% include oil-ref.html k="geoexpro-ghawar" %} {% include oil-ref.html k="worldoil-ghawar" %}. Aramco's fields deplete by 1 to 2 per cent a year.

**Offshore.** Johan Sverdrup, 160 kilometres west of Stavanger, is a sandstone 1,900 metres under the seabed in 115 metres of water, with a permeability of 5 to 30 darcies {% include oil-ref.html k="np-sverdrup" %}. Four steel-jacket platforms joined by bridges carry the drilling, process, riser and living quarters, power comes from shore by cable, and water injection holds the pressure. In 2020 nine wells made more than 430,000 barrels a day, about 48,000 each; the field held a plateau of 755,000 from 2023 to early 2025, and Equinor expects it to fall by more than 10 per cent in 2026 {% include oil-ref.html k="equinor-sverdrup" %} {% include oil-ref.html k="jpt-sverdrup" %}. It took nine years from discovery to first oil. In deeper water there is no platform on legs but a **floating production, storage and offloading vessel** (FPSO): wells on the seabed 1.5 to 2 kilometres down, flexible risers up to a ship that separates and stores the oil and hands it to shuttle tankers. Guyana's Stabroek block went from discovery in 2015 to first oil in 2019 and now runs several such ships of 120,000 to 250,000 barrels a day each {% include oil-ref.html k="exxon-guyana" %}.

**Shale.** In the Permian Basin of west Texas the oil sits in mudstone and siltstone with a permeability of 1 to 60 *nano*darcies, a million times tighter than Sverdrup. It does not flow to a well by itself. The well is drilled down about 2 to 3 kilometres, turned horizontal and run on through the layer for an average of 3,310 metres in 2025 {% include oil-ref.html k="eia-lateral" %}; then the horizontal section is fractured in 45 to 50 stages with water, sand and chemicals pumped at high pressure, so that the rock cracks and the sand props the cracks open {% include oil-ref.html k="usgs-frac" %}. A well costs about $7 million, roughly 40 per cent drilling and 60 per cent fracturing {% include oil-ref.html k="diamondback" %}, takes a week to drill and flows within a few months. Then it dies quickly: in Rystad's example a new well starts at 730 barrels a day and makes 200 after a year {% include oil-ref.html k="api-decline" %}. Published decline fits for the Midland Basin lose about 76 per cent in the first year {% include oil-ref.html k="ogj-arps" %}.

{% include oil-anat.html name="fields" title="Three fields, <em>cut open</em>" h=1240 caption="Pick a field for its rock, its wells, its decline and the cost of its barrel. Sources and approximations are in the drawing’s own caption." %}

The consequence is that a shale field is a treadmill. One good Ghawar well flows like 13 new Permian wells, a Sverdrup well like 66, and the Permian well loses most of its rate within a year. American wells that were producing at the end of 2023 fell from 11.0 to 6.7 million barrels a day during 2024; about 11,700 new horizontal wells filled the gap {% include oil-ref.html k="eia-legacy" %}. The IEA puts the first-year decline of tight oil, as a whole, above 35 per cent, against under 2 per cent for the onshore supergiants of the Middle East and about 10 per cent for deep offshore fields {% include oil-ref.html k="iea-decline" %}. That is why shale answers prices within months, and why it stops growing within months when prices fall.

{% include oil.html kind="wells" title="Wells that <em>run down</em>" caption="One Permian well modelled with an Arps hyperbolic curve through the published 730 → 200 barrels a day first year (b = 1.4; illustrative, not a measured well); wells needed for 100,000 barrels a day at the per-well rates in the text; and the output of four fields in the years the sources give (Ghawar: GeoExpro and the 2019 prospectus; Forties and Brent: Wikipedia; Sverdrup: Sodir, 2026 is January to August)." %}

What a barrel costs comes in four kinds, and they must not be mixed. **Lifting cost** is only the cost of running the wells: Aramco reported $3.51 per barrel of oil equivalent in 2025, plus $8.0 of upstream capital spending per barrel {% include oil-ref.html k="aramco-ar25" %}; Sverdrup runs below $2 {% include oil-ref.html k="equinor-sverdrup" %}; Petrobras's pre-salt fields about $4.2 to 4.5 (as reported) {% include oil-ref.html k="petrobras-20f" %}; a Permian operator about $5.91 {% include oil-ref.html k="diamondback" %}. **Capital cost per barrel** spreads the cost of building over the barrels a project will produce: about $6 to 7 for Sverdrup and about $13 of oil for a $7 million shale well that yields some 550,000 barrels (both my arithmetic on the sources). A **breakeven** adds royalties, taxes, transport and a return on capital: below $20 for Sverdrup, $25 to 35 for Guyana (as reported) {% include oil-ref.html k="oilnow-be" %}, $27 for new onshore Middle East projects and $68.57 WTI for a new well in the Midland Basin in March 2026 {% include oil-ref.html k="rystad" %} {% include oil-ref.html k="dallasfed" %}. The fourth kind, a state's fiscal breakeven, comes in the next section.

{% include oil.html kind="upcost" title="The cost of a barrel, <em>by field</em>" caption="Operating (lifting) cost and capital cost per barrel, and the breakeven: Aramco annual report 2025 with Rystad's new-project breakeven; Equinor's Johan Sverdrup figures; Petrobras pre-salt lifting cost with Guyana capital cost and breakevens (as reported); Diamondback's operating cost, a $7 million well over about 550,000 barrels, and the Dallas Fed's March 2026 new-well breakeven. Capital cost per barrel for Sverdrup and the shale well is my arithmetic. Hover a bar for the state's share." %}

The gap between building cost and breakeven is mostly the state. Saudi Arabia takes a royalty of 15 per cent of the value up to $70 Brent, 45 per cent of the part between $70 and $100 and 80 per cent above, plus 50 per cent income tax (as reported); Norway taxes the profit of a field at 78 per cent {% include oil-ref.html k="np-tax" %}; Guyana's share of Stabroek oil rose to 39.8 per cent in 2026 as the companies' cost recovery fell {% include oil-ref.html k="dpi-guyana" %}; a Texas well pays a private royalty of 20 to 25 per cent and a production tax of 4.6 per cent {% include oil-ref.html k="tx-tax" %}. Cheap rock does not make cheap oil for the buyer. It makes rich states.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Permeability decides everything.** Ghawar and Sverdrup flow like 13 and 66 new Permian wells per well → cheap barrels come from rare, porous rock; shale needs thousands of wells.
- **A shale well loses about three quarters of its rate in a year.** → Shale is a treadmill: fast to start, fast to fade, and expensive at the margin ($68.57 for a new Midland well).

</div>

{: .da-bridge}
Those are the costs of single kinds of field. The market price is set by the most expensive barrel the world still needs.

<h2 id="cost"><span class="num">09</span>What a barrel costs</h2>

The cost of a barrel varies by a factor of three. Rystad Energy's breakeven prices for new projects, the Brent price at which a project returns its cost of capital, were $27 a barrel for onshore Middle East fields, $37 offshore on the shelf, $43 in deep water, $45 for North American shale and $57 for oil sands in 2024 {% include oil-ref.html k="rystad" %}. American operators asked directly in March 2026 said they needed $66 WTI on average to drill a new well profitably, and $43 to keep existing wells running; the survey number has risen from $50 in 2019 as the best shale locations were drilled out {% include oil-ref.html k="dallasfed" %}.

{% include oil.html kind="cost" title="What a barrel <em>costs</em>" caption="Breakeven prices of new supply (Rystad Energy, 2024, full-cycle, Brent; Dallas Fed Energy Survey, March 2026, WTI) and the oil prices at which Gulf state budgets balance (IMF, May 2025, 2026 projection). Drag the price line." %}

States have a second breakeven: the price at which the government budget balances. The IMF put it for 2026 at $87 for Saudi Arabia, $79 for Iraq, $77 for Kuwait and $45 for the UAE, before the war {% include oil-ref.html k="imf" %}. A fiscal breakeven assumes the barrels can be sold. In 2026, with exports shut in, a high price did not balance anything: the IMF expected double-digit contractions in several Gulf economies.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Breakevens range from about $27 to $57 for new supply.** → The price is set by the most expensive barrel the world still needs, not by the cheapest.
- **Gulf state budgets need $45 to $87.** → A high price balances nothing if the barrels cannot be shipped, which is what 2026 showed.

</div>

{: .da-bridge}
The cheapest barrels in the world are also the ones that keep the market's insurance policy: spare capacity.

<h2 id="opec"><span class="num">10</span>OPEC+ and the spare barrels</h2>

OPEC was founded in 1960; since 2016 it has coordinated output with ten other producers led by Russia as OPEC+, which together supply about 40 per cent of the world's oil. The group sets production levels by country and has used three layers of cuts since 2022; the largest, a voluntary 2.2 million barrels a day by eight members, was unwound by September 2025, a year early {% include oil-ref.html k="worldoil-opec" %}. On 28 April 2026 the UAE announced that it was leaving OPEC and OPEC+ after 59 years, effective 1 May {% include oil-ref.html k="aj-uae" %}.

The cartel's power lies in **spare capacity**: production that can be started within weeks and held. In February 2026 the IEA estimated OPEC+'s effective spare capacity at 3.9 million barrels a day, and 3.0 of it, 77 per cent, sat in Saudi Arabia, the UAE, Iraq and Kuwait {% include oil-ref.html k="iea-mar" %}. Every one of those four ships its oil through the Strait of Hormuz.

{% include oil.html kind="spare" title="The cushion <em>behind the chokepoint</em>" caption="OPEC+ effective spare capacity in February 2026 (IEA Oil Market Report, March 2026) and the crude shut in by country, March to July 2026 average (EIA Short-Term Energy Outlook, October 2026). Red: exports pass the Strait of Hormuz." %}

This is the point on which 2026 turns. The market's insurance against a supply loss was stored in the one place a single event could reach. When the strait closed, the EIA counted OPEC's spare capacity as close to zero (0.02 million barrels a day) from the second quarter, and Middle East OPEC capacity itself as having fallen from 22.9 to 11.9 million barrels a day {% include oil-ref.html k="eia-steo" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **77 per cent of OPEC+'s spare capacity sat in four countries behind Hormuz.** → Spare capacity insures against a lost field, not a lost strait.
- **It fell to a record 0.32 million barrels a day in March 2026.** → When the strait closed, the market's cushion closed with it.

</div>

{: .da-bridge}
Which brings us to geography: the routes oil takes from the wells to the refineries, and the narrow places on them.

<p class="da-part">Part III<strong>Moving it</strong></p>

<h2 id="lanes"><span class="num">11</span>Sea lanes and chokepoints</h2>

About 44 million barrels a day of crude cross a border, and about 80 million barrels a day of crude and products move by sea, 76 per cent of world supply {% include oil-ref.html k="eia-choke" %} {% include oil-ref.html k="ei-sr" %}. The routes are few. The Middle East sends 19.1 million barrels a day of crude abroad, 86 per cent of it to Asia: 6.6 to China, 4.4 to Korea, Taiwan and the rest of Asia, 2.5 to India, 2.2 to Japan {% include oil-ref.html k="ei-sr" %}. Russia sends 79 per cent of its crude exports to China and India, Canada sends 88 per cent of its exports to the United States, and the United States sends 45 per cent of its crude exports to Europe (2025, Energy Institute data converted from tonnes) {% include oil-ref.html k="ei-sr" %}.

{% include oil.html kind="flows" title="Oil <em>on the move</em>" caption="The largest crude flows of 2025 on their usual sea lanes (Energy Institute inter-area trade, converted from tonnes; lanes schematic), and the eight chokepoints the EIA tracks with their flows of crude and products in the first half of 2025. The October 2026 view dims the routes through Hormuz and the Red Sea. Hover a route or a ring." %}

The tankers pass eight narrow places, which the EIA calls chokepoints {% include oil-ref.html k="eia-choke" %}. The Strait of Malacca carries 23.2 million barrels a day, the Strait of Hormuz 20.9, the Cape of Good Hope route 9.1, Suez and the SUMED pipeline 4.9, the Danish Straits 4.9, Bab el-Mandeb 4.2, the Turkish Straits 3.7 and the Panama Canal 2.3 (first half of 2025). Suez and Bab el-Mandeb were already carrying about half their 2023 volume, after the Houthi attacks on Red Sea shipping that began in November 2023 {% include oil-ref.html k="eia-choke" %}.

Hormuz is the one without an alternative. About 20 million barrels a day passed through it in 2024, a fifth of world consumption, 84 per cent of it bound for Asia {% include oil-ref.html k="eia-hormuz" %}. Only two pipelines bypass it: Saudi Arabia's East–West line from Abqaiq to Yanbu on the Red Sea, rated 5 million barrels a day and convertible to 7, and the UAE's line from Habshan to Fujairah, 1.5 to 1.8. Together they can move about 4.7 million barrels a day out of the Gulf, roughly a third of the crude that normally goes through the strait {% include oil-ref.html k="eia-choke" %}. Kuwait and Iraq's southern fields, Qatar and Bahrain have no bypass at all.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Three quarters of world oil supply moves by sea, through eight chokepoints.** → A disruption at one narrow place reaches every buyer.
- **Hormuz carried about 20 million barrels a day with bypasses for about 4.7.** → It is the one chokepoint that cannot be avoided, only waited out.

</div>

{: .da-bridge}
What carries all of this is a fleet of about 6,300 tankers above 25,000 tonnes {% include oil-ref.html k="safety4sea" %}, and in 2026 their price became the story.

<h2 id="tanker"><span class="num">12</span>The tanker and the price of a voyage</h2>

Tankers come in classes set by the ports and canals they must fit. The **VLCC** (very large crude carrier), about 330 metres long and 60 wide, draws 22 metres loaded and carries about 2 million barrels; it is the ship of the long hauls from the Gulf, West Africa, Brazil and the US Gulf to China. The **Suezmax** carries about 1 million barrels and is the largest that passes the Suez Canal loaded; the **Aframax**, 0.6 to 0.75 million, works the North Sea, the Baltic and the route from Houston to Rotterdam. Product tankers (LR2, LR1, MR) carry refined fuels.

Freight is quoted in two ways. The Baltic Exchange publishes **Worldscale** rates, a percentage of a "flat rate" in dollars per tonne set each year for every pair of ports, and the matching **time-charter equivalent**, what the voyage earns per day after fuel and port costs {% include oil-ref.html k="wiki-worldscale" %}. The benchmark for supertankers is TD3C, 270,000 tonnes from Ras Tanura to Ningbo. It paid $25,493 a day in July 2025 {% include oil-ref.html k="dcn-baltic" %} and **$1,412,594 a day** on about 15 October 2026, at Worldscale 1,318.75 {% include oil-ref.html k="cyprus-vlcc" %}, 55 times more.

{% include oil-anat.html name="vlcc" title="A VLCC on a stand: the price of a voyage per barrel" h=640 caption="Drawing C. Set the day rate of a supertanker and read the freight per barrel; at the October 2026 record it is a third of the price of the crude." %}

The drawing turns a day rate into dollars per barrel:

$$\text{freight per barrel} \approx \frac{\text{day rate} \times \text{days of hire}}{\text{barrels carried}} = \frac{\$1.3\text{ m} \times 50}{2\text{ m}} \approx \$32.5.$$

The agencies' own numbers bracket it. Poten put the rate at about $30,000 a day in January and $1.3 million in October, about $33 a barrel or 27 per cent of the delivered cost of the crude {% include oil-ref.html k="gulfnews-tanker" %}; the IEA put Gulf–Asia freight above $37 a barrel in mid-October, five times the pre-war level, and a VLCC cargo at $74 million against under $15 million {% include oil-ref.html k="iea-freight" %}. Two cautions. The index is partly notional: while Ras Tanura was shut, the Baltic panel priced TD3C off cargoes from Yanbu, and physical fixtures in September earned $530,000 to $603,000 a day while the index printed over $1 million {% include oil-ref.html k="fairway" %} {% include oil-ref.html k="xinde" %}. And war-risk insurance came on top: about 0.25 per cent of the hull's value per transit before the war, 1 per cent from early March, 3 to 10 per cent in July {% include oil-ref.html k="national-wr" %}, and 6 to 10 per cent per voyage in early October, up to $20 million for one VLCC trip, or roughly $4 a barrel {% include oil-ref.html k="caixin" %} {% include oil-ref.html k="warrisk-oct" %}.

Freight rose everywhere, not just in the Gulf, because the fleet is one pool. Ships stranded in the Gulf, ships sailing around Africa instead of through the Red Sea and ships carrying US crude to Asia instead of Gulf crude all take tonnage out of the pool. On the route from the US Gulf to Europe (TD25) an Aframax earned $23,600 a day in July 2025 and $308,200 in mid-October 2026 {% include oil-ref.html k="cyprus-vlcc" %}. Valero, the largest US refiner, said on 22 October that shipping a cargo of US crude to Asia now cost $30 to $35 a barrel against about $5 in 2025, and Asian buyers halved their orders for November loading {% include oil-ref.html k="oilprice-valero" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **A supertanker's day rate rose 55 times, to $1.4 million.** At about $33 a barrel, freight became a quarter of the delivered cost of Gulf crude → in 2026 moving oil cost as much as refining it.
- **The fleet is one pool.** → A shock on one route raises freight on every route, including from Houston to Rotterdam.

</div>

{: .da-bridge}
Not every tanker on the sea sails in the open market. Some carry oil that the West has sanctioned.

<h2 id="sanctions"><span class="num">13</span>Sanctions and the dark fleet</h2>

Part of the world's oil moves outside the rules of the rest. Since December 2022 the G7 and the EU have allowed Western shipping and insurance to carry Russian crude only if it is sold below a price cap. The EU and the UK lowered the cap to $47.60 in September 2025 and, under a rule that resets it every six months to 15 per cent below the average Urals price, to **$44.10** from 1 February 2026 {% include oil-ref.html k="ec-cap" %}; when the war lifted Urals, the EU froze the cap at that level in July (logistics research note, snippet). Russia's answer is a fleet of older tankers with opaque owners and insurers: in August 2026 Urals sold at about $66 a barrel, far above the cap, Russia exported 4.9 million barrels a day by sea, India took 2.0 million barrels a day and China 1.65, and 168 loaded shadow-fleet tankers left Russian ports, 92 per cent of them older than fifteen years {% include oil-ref.html k="kse" %}. S&P counts about 980 such tankers, close to a fifth of the world's tanker fleet (logistics research note, snippet).

Iran ran its own version. Its exports, almost all to independent refiners in China, reached 2.16 million barrels a day in February 2026, the most since 2018; after the US blockade returned in July no new Iranian cargo crossed the blockade line, and exports fell to 220,000 to 255,000 barrels a day in August {% include oil-ref.html k="iranintl" %}. Iran also sold its own compulsory "Hormuz insurance", paid in cryptocurrency, until the US Treasury designated the two firms behind it on 29 July {% include oil-ref.html k="treasury-hormuz" %}.

Sanctioned oil matters to everyone else for two reasons. It is cheaper, so the refiners that can buy it (in India, China and Turkey) have an edge over those that cannot. And it uses tankers: every ship in the dark fleet is a ship missing from the ordinary market, which is one more reason freight rose so far in 2026.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Russia sells far above the price cap with a fleet of about 980 old shadow tankers.** → The cap shapes who carries the oil more than what it costs.
- **Sanctioned crude is cheaper for the refiners that can buy it.** → India, China and Turkey gain an edge, and every dark tanker is missing from the ordinary market.

</div>

{: .da-bridge}
On land, oil moves by pipe.

<h2 id="pipelines"><span class="num">14</span>The pipelines of the world</h2>

A crude pipeline is a steel tube of 24 to 48 inches, welded from 12-metre joints with walls about a centimetre thick, buried a metre or two down and run at 80 to 100 bar {% include oil-ref.html k="alyeska" %} {% include oil-ref.html k="sdpuc-dapl" %}. Friction takes that pressure away along the line, so a pump station every 100 to 250 kilometres lifts it again; downhill the problem reverses and valves have to throttle the pressure gravity adds. The oil moves at walking to cycling pace, one to two and a half metres a second. On the Trans-Alaska Pipeline in 2024 it took 19.5 days to travel the 1,288 kilometres from Prudhoe Bay to Valdez, and the line holds 9.06 million barrels before the first one comes out at the other end {% include oil-ref.html k="alyeska" %}. That linefill is money lying in the ground.

Grades travel one behind the other in batches, with no wall between them; where two meet they mix, and the mixed zone is cut into the cheaper grade. "Pigs", plugs pushed by the oil, scrape wax off the wall every two weeks on the Alaska line, and instrumented pigs measure the wall thickness every three years. A polymer injected at a few parts per million damps the turbulence at the wall and lets the same pipe carry about a third more {% include oil-ref.html k="alyeska" %}. Waxy crude must be kept warm: the East African line from Uganda to Tanzania is insulated and electrically heated so the oil stays above 50 °C {% include oil-ref.html k="eacop" %}. A control room watches pressures and flows along the whole line, but a meter-based leak detector cannot see a leak smaller than its meters' error: on 197 American incidents in 2010 to 2012, the public found more leaks than the computers did {% include oil-ref.html k="kiefner" %}.

Over land a pipeline is the cheapest way to move oil, at roughly $3 to $5 a barrel per 1,000 kilometres: the Alaska tariff from 1 July 2026 is $5.92 a barrel {% include oil-ref.html k="taps-tariff" %}, Trans Mountain charges C$10.84 to 14.06 from Edmonton to Vancouver {% include oil-ref.html k="tm-tariff" %}, and rail costs two or three times a pipeline {% include oil-ref.html k="eia-rail" %} (the per-kilometre comparison is my arithmetic). A supertanker is cheaper still, under a dollar per 1,000 kilometres, which is why oil goes to sea as soon as it can.

{% include oil.html kind="pipes" title="The pipelines <em>of the world</em>" caption="Sixty-two major crude and product lines, drawn through the towns and stations Wikipedia gives coordinates for (schematic between them, not surveyed routes); line width by design capacity, the Alaska line by its 2025 flow. Dots are dated attacks, thefts, failures and political shutdowns from 2021 to October 2026, from operators, Reuters, Al Jazeera, Wikipedia and regional press (see the reference list). Pick a region." %}

**Russia and Europe.** Druzhba, "friendship", built from 1964, runs from the Volga to Belarus and splits there: the northern branch to Poland and Germany, the southern one through Ukraine to Slovakia, Hungary and Czechia. Germany and Poland stopped buying Russian crude through it in 2023; Germany's Schwedt refinery now runs on oil from Rostock and Gdańsk, and the Kazakh crude it still took through Druzhba, about 43,000 barrels a day in 2025, was stopped by Russia from 1 May 2026 {% include oil-ref.html k="bundestag-pck" %}. Southern Germany, Austria and, since April 2025, Czechia depend on the Transalpine line from Trieste, which carried 41.6 million tonnes in 2025, near its capacity {% include oil-ref.html k="wiki-tal" %}. The war put the pipes on the target list. Ukraine's drones went for pumping stations, which are point targets full of tanks and transformers and stop a whole line: in February 2026 a strike at Kaleykino in Tatarstan burned two 50,000-tonne tanks and Transneft cut intake by 250,000 barrels a day {% include oil-ref.html k="kaleykino" %}. A Russian strike on the Brody hub in western Ukraine on 27 January 2026 destroyed pumps and stopped Druzhba oil to Hungary and Slovakia until 23 April {% include oil-ref.html k="wiki-druzhba26" %}. The Caspian Pipeline Consortium, which carries most of Kazakhstan's exports to the Black Sea, lost a loading buoy to a sea drone in November 2025, had tankers hit through 2026 and in July stopped taking Kazakh crude for a time {% include oil-ref.html k="cpc-attacks" %}.

**The Middle East.** The 1,200-kilometre East–West line from Abqaiq to Yanbu was Saudi Arabia's way around Hormuz, rated at 5 million barrels a day and converted to 7 million in March 2026. It was hit on 9 April, on 25 July (claimed by the Houthis) and on 10–11 September by drones that Baghdad says were launched from Iraq, after which the whole line was shut until 22 September {% include oil-ref.html k="aj-ew" %} {% include oil-ref.html k="wiki-ew" %}; on 24 and 26 October the Houthis claimed new strikes on its pumping stations {% include oil-ref.html k="houthi-ew" %}. Iraq's Kirkuk–Ceyhan line to Türkiye, closed from March 2023 to September 2025 by an arbitration ruling, was restarted after the Hormuz closure and carried about 130,000 barrels a day in August {% include oil-ref.html k="shafaq-itp" %}.

**The Americas.** Canada sends almost all its exports south through Enbridge's Mainline, about 3 million barrels a day, and since May 2024 west through the expanded Trans Mountain line, 890,000 {% include oil-ref.html k="wiki-tmx" %}. The Permian's lines to Corpus Christi and Houston carry most of the American export barrel to the docks. The American incidents were failures, not attacks: Keystone spilled about 13,000 barrels in Kansas in December 2022 from a cracked weld and 3,500 in North Dakota in April 2025 {% include oil-ref.html k="wiki-keystone" %}.

**Africa.** The lines are fewer and the risk is theft and war: Nigeria's Trans Niger Pipeline had 460 illegal taps removed before its 2023 restart, Sudan's civil war cut South Sudan's export line in 2024, and the heated East African line was 92.7 per cent built in September 2026, with first oil at Tanga expected in 2027 {% include oil-ref.html k="eacop-tz" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Over land a pipeline is the cheapest way to move oil**, about $3 to $5 a barrel per 1,000 km, but a whole line stops when one pumping station burns → drones in 2025–26 went for exactly those stations.
- **Europe and the Gulf bypasses depend on a few lines.** → The East–West line, Druzhba, CPC and the Transalpine are single points of failure for whole regions.

</div>

{: .da-bridge}
Pipelines end at hubs, and one hub in the American network matters to the whole world.

<h2 id="cushing"><span class="num">15</span>Pipes, hubs and the tank in Oklahoma</h2>

Cushing, a small town in Oklahoma, is the delivery point of the NYMEX WTI futures contract: whoever holds a contract at expiry must take or deliver crude into a tank there. Pipelines from the Permian Basin in Texas, from the Midcontinent and from Canada meet at Cushing, and others run from it to the refineries and export docks of the Gulf Coast. Working storage at the hub is about 76 to 78 million barrels, out of a shell capacity of about 98 (EIA estimates, as summarised in the research note).

{% include oil-anat.html name="cushing-tank" title="A floating-roof tank at Cushing" h=640 caption="Drawing D. One floating-roof tank stands for the hub that sets the WTI price; its roof follows Cushing stocks week by week since 2004." %}

What happens at Cushing shows in the price. In April 2020, with demand collapsed by Covid and the tanks filling, nobody holding the expiring May contract could find storage, and WTI spot closed at **−$36.98** a barrel on 20 April {% include oil-ref.html k="eia-spot" %}. In 2026 the opposite: US crude was pulled to the coast for export, Cushing fell below 20 million barrels in June and to 18.6 million on 24 July, the lowest since 2014, and for a few days in June and July WTI traded above Brent {% include oil-ref.html k="foley" %}. A landlocked price is a local price. It is tied to the world only through the pipes to the coast and the ships beyond them.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **WTI is a landlocked price tied to tanks in Oklahoma.** → When the tanks are full it can fall below zero (April 2020); when they are empty it can rise above Brent (June–July 2026).
- **Its link to the world runs through pipes to the coast and ships beyond.** → Export capacity, not the global market alone, sets the American price.

</div>

{: .da-bridge}
That tie, coast to coast and ocean to ocean, is how the benchmarks are built.

<p class="da-part">Part IV<strong>The price</strong></p>

<h2 id="benchmarks"><span class="num">16</span>Brent, WTI and Dubai</h2>

Almost every barrel in the world is sold at a **differential** to one of three benchmarks: Brent for the Atlantic Basin, Africa and much of Asia; WTI for the Americas; Dubai and Oman for Middle East crude going to Asia. The benchmarks themselves are assessed by price reporting agencies, Platts and Argus, from the trades made in a short window at the end of each day, or settled on an exchange.

**Brent** began as one field in the East Shetland Basin. Its output has fallen so far that the original Brent field produced about 23,000 barrels a day in 2026 and scheduled no cargo at all in August {% include oil-ref.html k="baird-brent" %}. What is called Brent today is a basket. Platts' **Dated Brent**, the price of physical cargoes loading 10 days to a month ahead, is set each day by the cheapest of five North Sea grades (Brent, Forties, Oseberg, Ekofisk, Troll) and, since cargoes loading in June 2023, by **WTI Midland** from Texas {% include oil-ref.html k="eia-brent" %}. The five North Sea grades loaded about 470,000 barrels a day in September 2026 {% include oil-ref.html k="lse-northsea" %}; the same month the United States shipped 459,000 barrels a day of crude to the Netherlands alone {% include oil-ref.html k="cyprus-us" %}. Midland is assessed delivered to Rotterdam, and Platts converts that back to a North Sea basis by deducting freight. The reel's twist, "American crude delivered to Rotterdam can set the Brent price itself", is exactly this.

{% include oil.html kind="northsea" title="What <em>Brent</em> is" caption="The five North Sea grades of the Dated Brent basket with their September 2026 loading programmes and terminals, and the US crude that joined the basket in 2023 (WTI Midland, assessed delivered to Rotterdam). Positions approximate; loadings from Reuters loading programmes (snippet) and S&P Commodities at Sea." %}

**ICE Brent futures** are the paper layer on top: contracts for 1,000 barrels, cash-settled against an index or exchanged for physical cargoes, expiring at the end of the second month before delivery {% include oil-ref.html k="ice-brent" %}. "The oil price" in news reports is usually the front-month future, and in 2026 it and the physical price came apart. On 7 April Dated Brent reached an all-time high of $144.68 (Argus) while futures were near $109, a physical premium of $35.41, a record {% include oil-ref.html k="iea-may" %} {% include oil-ref.html k="fxnx" %}. The EIA's own Brent spot series, which this article plots, peaked at $138.21 that day {% include oil-ref.html k="eia-spot" %}. Whenever this article says "Brent spot" it means the EIA series.

**WTI** is the NYMEX contract delivered at Cushing. **Dubai** is a Platts assessment of Gulf crude for Asia, and in March 2026, when Asia lost its supply first, Dubai averaged $128.20, far above Dated Brent at $103.84 {% include oil-ref.html k="iea-apr" %}. On 31 July ADNOC announced that from 1 November 2026 the official prices of all Abu Dhabi grades (Murban, Das, Umm Lulu, Upper Zakum) will be set off prompt-month Platts Dubai plus a differential, instead of its own Murban futures contract on ICE Futures Abu Dhabi {% include oil-ref.html k="adnoc-dubai" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Brent is a basket of five North Sea grades plus Texan WTI Midland.** → American crude delivered to Rotterdam can set the price of oil sold far from America.
- **Physical and paper prices split in 2026**: Dated Brent hit $144.68 while futures traded near $109 → "the oil price" in the news is not what a refinery paid for a cargo.

</div>

{: .da-bridge}
A benchmark is not one price but a line of prices, one for each delivery month. Its shape tells you whether the market has too much oil or too little.

<h2 id="curve"><span class="num">17</span>The curve: contango and backwardation</h2>

The futures curve is the set of prices for delivery one, two, three and more months ahead. Whether it slopes up or down follows from an arbitrage. Someone who buys a barrel today at spot price $$S$$, stores it and sells it forward pays interest $$r$$ and storage $$u$$; someone who holds a barrel also has the "convenience" $$y$$ of having it when it is needed, which is large when oil is scarce. In equilibrium

$$F(T) = S\,e^{(r + u - y)\,T}.$$

When stocks are ample, $$y$$ is small, futures trade above spot and the curve slopes up: **contango**. The market pays you to store, tanks fill, and in the extreme (April 2020) storage runs out. When oil is scarce, $$y$$ is large, futures trade below spot and the curve slopes down: **backwardation**. Nobody stores, stocks are drawn, and the prompt barrel commands a premium.

{% include oil.html kind="curve" title="The shape of <em>scarcity</em>" caption="The futures curve from the cost-of-carry formula. The rings are market points: Brent futures settlements on 15 October 2026, $105.92 for December, $93.20 for June 2027 and $85.08 for December 2027 (CME settlement bulletin); WTI on 17 April 2020, three days before the negative price, rising steeply from a prompt $18 (EIA). Move the sliders to see how storage cost and convenience yield bend the curve." %}

The Brent curve has been in backwardation since the war began on 28 February, with one brief contango after the June truce {% include oil-ref.html k="tradingpedia" %}. In early October the front month was about $102 against $90 six months out and $83 twelve months out {% include oil-ref.html k="sa-curve" %}. The settlements of 15 October show the same shape: December Brent at $105.92, June 2027 at $93.20 and December 2027 at $85.08, a backwardation of $12.72 over six months and a front month 24.5 per cent above the contract a year later {% include oil-ref.html k="cme-curve" %}. The curve says the market expected the shortage to end; it does not say when.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **A curve slopes down (backwardation) when oil is scarce.** On 15 October the front month was 24.5 per cent above the contract a year later → the market paid for oil now and expected relief later.
- **Backwardation pays holders to sell from storage.** → It explains why stocks were drawn so hard; the curve says the shortage should end, not when.

</div>

{: .da-bridge}
The curve explains the price of time. The spread between the two big benchmarks explains the price of distance.

<h2 id="gap"><span class="num">18</span>Brent minus WTI is a voyage</h2>

For most of its history WTI traded within a few dollars of Brent. The two diverged when one of them could not reach the other. In 2011 to 2013 the shale boom filled Cushing before pipelines to the coast existed, and Brent spot traded up to $29.59 above WTI (23 September 2011); the gap closed as pipelines were built and the export ban was lifted in 2015 {% include oil-ref.html k="eia-spot" %}.

{% include oil.html kind="gap" title="Brent <em>over WTI</em>" caption="Brent minus WTI, spot, weekly means to 2024 and daily since 2025, with the usual $3–5 range shaded. Data: EIA via FRED." %}

Since US crude can be exported and Midland is part of the Brent basket, the gap has a simple floor and ceiling: a barrel at Cushing plus the cost of getting it to Rotterdam must be worth about what a North Sea barrel is worth there. Pipeline from Cushing or Midland to Houston costs about a dollar, the dock and losses a little more {% include oil-ref.html k="est-route" %}, and the rest is freight. In February 2026 that was about $4 a barrel for a Suezmax from the US Gulf to Europe and the spot gap was $6.38 {% include oil-ref.html k="iea-apr" %} {% include oil-ref.html k="eia-spot" %}. In mid-October freight was about $24 a barrel and the spot gap averaged **$24.99** for 1 to 20 October ({% include oil-ref.html k="iea-freight" %}, {% include oil-ref.html k="eia-spot" %}; the fit is my arithmetic, not a cited claim). The average hides a collapse at the end of the window: the gap was $30.21 on 14 October and $7.33 on 20 October, as WTI rose from $96 to $108 and Brent spot fell from $127 to $115 {% include oil-ref.html k="eia-spot" %}. The EIA series ends there; whether freight fell as fast is not yet in the data.

{% include oil.html kind="route" title="The gap is <em>the journey</em>" caption="Midland and Cushing to Houston by pipeline, Houston to Rotterdam by tanker. The stack adds pipeline, dock and freight to the WTI price; drag the freight to see the gap it implies. The dashed lines are the observed EIA spot gaps. Pipeline and dock costs are round estimates." %}

The reel's number, a futures gap near $14 on 6 October, is smaller than the spot gap: December Brent at $106.30 against December WTI at $92.45, $13.85 {% include oil-ref.html k="benzinga" %} {% include oil-ref.html k="vantage" %}. Futures for December price a voyage in December, when the market expected freight to have eased. Pipelines were not the bottleneck this time: traded spreads between Midland and Houston stayed under a dollar (benchmarks research note, snippet). What separated the two prices was the ocean.

The same arithmetic split the world's refiners. An American refinery bought WTI and sold diesel at Gulf Coast or New York prices; a European refinery bought crude at Brent plus freight. On 19 October the reel's "same diesel, two cracks" read about $100 against WTI and about $90 against Brent {% include oil-ref.html k="reel" %}. In Europe the freight-adjusted diesel crack fell from about $100 in early September to $57 in the first week of October {% include oil-ref.html k="iru" %}, and a standard Rotterdam refining margin was −$10.95 a barrel on 5 October {% include oil-ref.html k="indexbox" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Brent minus WTI is roughly the cost of shipping US crude to Europe.** It averaged $24.99 in early October 2026, against $6.38 in February → freight, not pipelines, separated the two prices.
- **When freight jumps, American refiners buy cheap crude.** → US refiners made record margins while European ones lost money on the same diesel.

</div>

{: .da-bridge}
With the machinery in place, the long history of the price reads differently.

<h2 id="history"><span class="num">19</span>Forty years of the price</h2>

{% include oil.html kind="prices" title="Forty years <em>of oil</em>" caption="Brent and WTI spot prices, weekly means 1986–2024 and daily since 2025, in dollars of the day (not adjusted for inflation). The lettered markers are explained on hover; the 2025–2026 view shows the war year in daily detail. Data: EIA via FRED." range="all" %}

The long chart is a series of shocks and gluts. Iraq's invasion of Kuwait in 1990, which took Brent spot from $15 in early July to $41 in late September; the Asian crisis of 1998, when Brent fell to $9.10; the climb to the all-time spot high of $143.95 on 3 July 2008 and the collapse that followed; OPEC's decision in November 2014 not to cut against shale, which halved the price; Covid and the negative WTI print in April 2020; Russia's invasion of Ukraine in 2022, with Brent spot at $133.18 on 8 March {% include oil-ref.html k="eia-spot" %}. 2026 is the first shock in which the physical price broke the 2008 record, and the first in which the supply lost was larger than any before it: the IEA called the 10.1 million barrel a day fall in March "the largest disruption in history" {% include oil-ref.html k="iea-apr" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **The price has been a run of shocks and gluts for forty years.** → Each spike was followed by a fall, often deep, as supply and demand adjusted.
- **2026 is the first shock in which the physical price beat the 2008 record**, and the largest supply loss ever recorded → the scale, not the direction, is new.

</div>

{: .da-bridge}
Here is that year, month by month.

<p class="da-part">Part V<strong>2026</strong></p>

<h2 id="war"><span class="num">20</span>2026: the strait closes</h2>

The year began with too much oil. In February the IEA expected supply to grow by 2.4 million barrels a day in 2026 and demand by only 0.85, and global stocks stood at 8.2 billion barrels, the highest since 2021 {% include oil-ref.html k="iea-feb" %}. Brent futures closed at $72.48 on 27 February {% include oil-ref.html k="wiki-chron" %}.

On **28 February** the United States and Israel struck Iran; Iran's supreme leader was killed, and the Revolutionary Guard warned that no ship would pass Hormuz {% include oil-ref.html k="wiki-war" %} {% include oil-ref.html k="iea-mar" %}. Tankers were hit off Oman the next day. In the first two weeks Gulf producers shut in more than 10 million barrels a day, Ras Tanura's refinery was struck, Qatar declared force majeure on LNG, and war-risk insurance quadrupled. On 11 March the 32 IEA members agreed to release 400 million barrels from emergency stocks, more than twice the two releases of 2022 combined {% include oil-ref.html k="iea-mar" %}.

{% include oil.html kind="hormuz" title="The strait and <em>its bypasses</em>" caption="The Persian Gulf with the Strait of Hormuz, the main export terminals and the three bypass pipelines (positions from Wikipedia geodata). Step through 2026: oil through the strait (IEA; Kpler for October), Gulf exports by all routes (IEA; The National citing Kpler for October), and what happened. Trackers disagree by several million barrels a day in some weeks; see the text." %}

The numbers through the year, mostly from the IEA's monthly reports:

- **March.** World supply fell by 10.1 million barrels a day in one month, to 97 million; OPEC+ spare capacity fell to 0.32 million, a record low, and Gulf exports by all routes fell by 15.8 million barrels a day to 8.7 million {% include oil-ref.html k="iea-apr" %}. Saudi Arabia pushed the East–West line to its full 7 million barrels a day, of which about 5 could be exported from Yanbu, most of it south through Bab el-Mandeb to Asia and some north to the SUMED pipeline to the Mediterranean {% include oil-ref.html k="fortune-ew" %} {% include oil-ref.html k="kpler-yanbu" %}.
- **April.** Oil through Hormuz was 2.7 million barrels a day, bypass exports 7.8 million, total Gulf exports 10.5 million, 14 million below February; Gulf output was 45 per cent below its pre-war level {% include oil-ref.html k="iea-may" %}. On 7 April Dated Brent set its all-time high of $144.68; that evening a two-week ceasefire was announced and on 8 April futures fell about $20. The United States blockaded Iranian ports from 13 April {% include oil-ref.html k="wiki-blockade" %}.
- **May–June.** Crude shut in peaked at 10.9 million barrels a day in May {% include oil-ref.html k="eia-steo" %}. The Islamabad Memorandum was signed on 17 June and both blockades were lifted {% include oil-ref.html k="wiki-blockade" %}; Gulf exports recovered to 16.1 million barrels a day in June and Brent spot fell to $68.53 on 2 July, below its pre-war level {% include oil-ref.html k="iea-jul" %} {% include oil-ref.html k="eia-spot" %}.
- **July–August.** The memorandum collapsed on 7–8 July after attacks on ships, the US blockade returned on 14 July and the Houthis declared a blockade of the Red Sea, the outlet of the Saudi bypass. Flows through Hormuz were 7.6 million barrels a day in August {% include oil-ref.html k="wiki-war" %} {% include oil-ref.html k="national-flows" %}, and Gulf exports by all routes about 13 million, nearly half the pre-war level (IEA, as reported) {% include oil-ref.html k="iea-sep" %}.
- **September.** Drones struck the East–West pipeline on 10–11 September and Yanbu loadings stopped until a partial restart on 22 September {% include oil-ref.html k="wiki-ew" %} {% include oil-ref.html k="eia-steo" %}. Brent spot reached $130.80 on 15 September.
- **October.** Kpler counted 11.6 million barrels a day leaving through Hormuz in the week to 13 October, about 14 million including ship-to-ship transfers in the Gulf of Oman, while IMF PortWatch counted only a handful of transits a day, 3.6 a day from 1 to 18 October against 78 a day in February {% include oil-ref.html k="aj-95" %} {% include oil-ref.html k="portwatch" %}: most tankers sailed with their transponders off {% include oil-ref.html k="aj-control" %} {% include oil-ref.html k="gcaptain-flows" %}. Non-Iranian Middle East exports were back at their pre-war level of about 24.5 million barrels a day, through the bypasses {% include oil-ref.html k="national-exports" %}; for the week to 18 October Kpler counted 24.6 million and Vortexa 18 {% include oil-ref.html k="gcaptain-flows" %}. Attacks did not stop: UKMTO counted 32 attacks on ships around Arabia in October by the 21st, twice September's 16 {% include oil-ref.html k="gcaptain-flows" %}, and on 24 and 26 October the Houthis claimed strikes on the East–West line's pumping stations, which Saudi Arabia has not confirmed {% include oil-ref.html k="houthi-ew" %}. Brent futures settled at $116.72 on 23 October.

{% include oil.html kind="war" title="The war year, <em>day by day</em>" caption="Daily spot prices of crude and products in 2026, dollars per barrel, to 20 October, with the numbered events of the text. The second view shows the gaps: diesel and gasoline cracks and Brent minus WTI. Data: EIA via FRED." view="all" %}

One thing the chart makes plain is that the crude price did not stay high. Brent spot averaged $117 in April, $85 in June and $84 in July, and $114 in September. What stayed high, and kept rising into the autumn, was diesel, and with it the gap between crude and products.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Gulf exports fell from about 24 to 8.7 million barrels a day in March and recovered only through bypasses and dark transits.** → Volumes returned before normal routes did.
- **Trackers disagree by millions of barrels a day.** → In 2026 even the size of the shock is an estimate; read single numbers as ranges.

</div>

{: .da-bridge}
Why diesel, of all the products, ran away from crude is the subject of the next section.

<h2 id="diesel"><span class="num">21</span>The diesel crisis</h2>

Four things removed diesel from the market at once.

1. **Gulf refineries.** The Gulf exported 3.3 million barrels a day of products in 2025, and in March more than 4 million barrels a day of the region's refining capacity was shut or at risk; Ras Tanura, Sitra in Bahrain and Ruwais in the UAE were struck in the first ten days of the war {% include oil-ref.html k="iea-mar" %}. The export refineries (Al-Zour, SATORP, SASREF) had about two weeks of tankage. Middle East refinery runs were about 7.3 million barrels a day in August against 9.9 million in February {% include oil-ref.html k="kpler-refining" %}.
2. **Russia.** Ukrainian drones reportedly struck Russian refineries at least 21 times in August alone; Russian and Middle East diesel exports were down 1.3 million barrels a day year on year in September {% include oil-ref.html k="iea-oct" %}.
3. **Closures.** Europe lost 478,000 barrels a day of refining capacity in 2025 and the United States 244,000, among them Grangemouth, Wesseling, LyondellBasell in Houston and Phillips 66 in Los Angeles {% include oil-ref.html k="ei-sr" %} {% include oil-ref.html k="eia-closures" %}.
4. **Hardware.** As the refinery section showed, the diesel yield cannot be raised much in a few months.

Diesel futures in New York crossed $100 a barrel over WTI for the first time on 17 August {% include oil-ref.html k="dieselnet" %}. The New York Harbor diesel spot price reached an all-time high of $5.365 a gallon on 16 September, and US retail diesel a record **$6.529 a gallon** in the week of 21 September, against $3.81 before the war {% include oil-ref.html k="eia-wpsr" %}. Gasoline went the other way: refiners running hard for diesel made too much of it, and New York gasoline fell below the price of Brent on 15 October {% include oil-ref.html k="eia-spot" %}. US retail gasoline peaked at $4.50 on 11 May, below its 2022 record {% include oil-ref.html k="eia-wpsr" %}.

{% include oil.html kind="war" title="Diesel against <em>gasoline</em>" caption="The gaps in 2026: diesel minus Brent, the 3-2-1 crack, gasoline minus Brent and Brent minus WTI, daily, dollars per barrel. Data: EIA via FRED, own calculation." view="cracks" %}

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **Four things hit diesel at once**: Gulf refineries, Russian refineries, closures in Europe and the US, and fixed hardware → supply lost from several sides, with no quick replacement.
- **US retail diesel reached a record $6.529 a gallon while gasoline stayed below its 2022 peak.** → The shortage was in molecules that need cracking, not in crude.

</div>

{: .da-bridge}
A shortage shows up first in the tanks, and the tanks were drawn harder in 2026 than ever before.

<h2 id="stocks"><span class="num">22</span>The tanks run down</h2>

Between the end of February and the end of September the world drew about 509 million barrels from its observed stocks {% include oil-ref.html k="iea-oct" %}. Governments released about 330 of the 426 million barrels pledged in March by mid-October, and on 2 October the G7 agreed to release up to 100 million more, diesel first {% include oil-ref.html k="globaloilshock" %} {% include oil-ref.html k="npr-g7" %}. The US Strategic Petroleum Reserve, which held 415 million barrels at the end of February, held 282.7 million on 16 October, its lowest level since 1982 {% include oil-ref.html k="eia-wpsr" %}. China, which had added about 111 million barrels to its crude stocks in 2025, drew 162 million barrels from its May peak by 19 October, acting as a second, uncoordinated strategic reserve {% include oil-ref.html k="boe-china" %}.

{% include oil.html kind="stocks" title="The tanks, <em>week by week</em>" caption="US stocks by week of the year, million barrels: 2026 against 2025, 2022 and the range of 2015–2024. Switch between distillate, Cushing, the Strategic Petroleum Reserve, commercial crude and gasoline. Data: EIA Weekly Petroleum Status Report, to 16 October 2026." %}

US distillate stocks fell to 100.8 million barrels on 22 May and stood at 104.3 million on 16 October, against 120.4 million on 20 February; on the East Coast they were 32 per cent below the five-year average in September {% include oil-ref.html k="eia-wpsr" %} {% include oil-ref.html k="eia-steo" %}. Low stocks are why the curve is backwardated and why the prompt barrel of diesel commands a premium.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **About 509 million barrels came out of the world's observed stocks in seven months.** The US SPR fell to its lowest level since 1982 → stocks, not new supply, bridged the gap.
- **China drew 162 million barrels from its own tanks.** → Strategic stocks worked, but they are finite; a long closure would have run them down.

</div>

{: .da-bridge}
All of this arrives, in the end, at a pump.

<h2 id="litre"><span class="num">23</span>What a litre costs</h2>

German diesel set an all-time record of €2.453 a litre on 16 September 2026, according to the ADAC daily average {% include oil-ref.html k="zdf-diesel" %}. On 1 October a temporary tax cut of 14.04 cents a litre on both fuels took effect until the end of the year, bringing the diesel energy tax down to the EU minimum of 33.00 cents {% include oil-ref.html k="kpmg-tax" %}. On 21 October diesel cost €2.255 and E10 €2.110 {% include oil-ref.html k="adac" %}.

{% include oil.html kind="pump" title="One litre, <em>taken apart</em>" caption="A litre of German diesel on 21 October 2026 and a US gallon on 19 October. Germany: VAT, energy tax (after the cut), CO₂ price at €65 a tonne, and the crude, refining and distribution shares estimated from Brent near $110 and the ICE gasoil price (research note, own calculation, an order of magnitude). United States: EIA's May 2026 shares applied to the October price, an illustration only." %}

Taken apart, the German litre is about 36 cents of VAT, 33 of energy tax, 17 of CO₂ price, about 62 of crude, about 50 of refining margin and about 28 of distribution, stocks, biofuel quota and retail. Before the war the refining spread on a litre of diesel was about 20 cents; now it is about as large as the crude itself (refining research note, own calculation from Brent, ICE gasoil and the exchange rate; the gasoil quote is for November delivery, so treat the split as an order of magnitude). Taxes are 38 per cent of the German price and 11 to 12 per cent of an American gallon {% include oil-ref.html k="eia-gasdiesel" %}, which is why the same crack added 64 per cent to US diesel since February and 33 per cent to the EU average {% include oil-ref.html k="iru" %}.

<div class="oil-take" markdown="1">
<p class="oil-take-h">Key takeaways</p>

- **In a German litre of diesel the refining margin was about as large as the crude.** → Drivers paid for the crack and freight more than for the barrel.
- **Taxes are 38 per cent of the German price and about 11 per cent of the American.** → The same crack raised US diesel by 64 per cent but EU diesel by 33; the 14-cent tax cut eased the price, not the cause.

</div>

{: .da-bridge}
That is the chain from the well to the pump. What the figures and numbers above cannot show deserves a list of its own.

<h2 id="limits"><span class="num">24</span>What this article cannot tell you</h2>

- **Two Brents.** The EIA's Brent spot series, plotted here, is a physical price close to Dated Brent; news reports usually quote ICE futures. They differed by up to $35 in 2026. Every Brent–WTI number in the text says which it is.
- **Flows in 2026 are uncertain.** Most tankers around the Gulf sailed dark from March, and Kpler and Vortexa disagreed by up to 6 million barrels a day of Gulf crude in a single week in October {% include oil-ref.html k="gcaptain-flows" %}. The Hormuz figure gives one tracker per month.
- **Paywalls.** The IEA's reports from June to October, Argus, Platts and most Reuters and Bloomberg copy could not be opened; numbers from them are search summaries ("snippet" in the list) and should be treated as reported, not verified.
- **Schematic drawings and lanes.** The isometric drawings and the sea lanes on the maps are schematic. The VLCC's 50 days and 2 million barrels are round numbers. The pipeline and dock costs in the Brent–WTI figure are my estimates.
- **The crack is a proxy.** The 3-2-1 assumes a fixed yield and ignores the cost of running the refinery, the value of by-products and the price of the crude a refinery actually buys. It measures the market's margin, not any refinery's profit.
- **A snapshot.** Prices are to 20 October 2026, news to 26 October. The war was not over when this was written; the market expected renewed US strikes after the US midterm elections of 3 November {% include oil-ref.html k="wiki-war" %}.

{: .da-bridge}
The sources behind every statement follow, with how much of each I saw.

<h2 id="sources"><span class="num">25</span>Sources</h2>

<div class="da-note" markdown="1">
**Data and software.** Spot prices are the EIA's, republished by the Federal Reserve Bank of St. Louis (FRED); weekly stocks, production, exports and retail prices are from the EIA's Weekly Petroleum Status Report; both are public domain. Country borders are Natural Earth (public domain). The figures are plain SVG computed in the browser (`assets/js/oil-explorer.js`); the isometric drawings are standalone pages made with the *anatomy* figure kit. The headline font is Barlow Condensed (SIL Open Font License), self-hosted like everything else on this site. The pipeline that builds the data is in `bin/oil_article/` in the site's repository. The look of the figures follows the reel by Crude & Conflict that prompted this article {% include oil-ref.html k="reel" %}.
</div>

The list is ordered by tag. "Data" marks a series that was downloaded and plotted; "primary" an agency, exchange or company document that was read; "opened" a secondary page that was read; "snippet" a number seen only in a search result; "estimate" a round number of my own.

{% include oil-refs.html %}

</article>

<script defer src="{{ '/assets/js/da-guide.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/oil-explorer.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
