---
layout: default
title: How Germany's energy market works
description: Where Germany's energy comes from, how the electricity market sets a price every quarter-hour, the laws that frame it, and how supply, demand and prices swing within a day, a week, a year and a decade. With 11 years of hourly data, maps, animations and an explorer.
date: 2026-10-17
tags: [energy, electricity-markets, data]
categories: [long-read]
read_time: 45 # the word count would include the inlined map SVGs
---
{%- assign media = '/assets/energy-article/media/' | relative_url -%}
<article class="da en" markdown="1" data-stations="off" data-brand="Germany's energy market" data-brand-sub="from the well to the socket · a long read" data-contact="https://www.linkedin.com/in/niklas-abraham-05983b247">

<p class="da-eyebrow">Blog · Long read · data, maps and animations</p>
<h1 class="da-title">How Germany's energy market works</h1>
<p class="da-lede">Where the energy comes from, how a price is found for every quarter-hour, which laws decide who pays what, and how supply, demand and price move within a day, a week, a year and a decade — told with eleven years of hourly data.</p>
<p class="da-meta">Niklas Abraham · 17 October 2026 · about 45 minutes · 5 animations, 3 derivations, 4 maps, 19 data figures, 1 explorer</p>

<div class="da-note" markdown="1">
**A note before you start.** I am not an energy economist; I wrote this to understand a market I pay into every month. The time series are my own analysis of public data from [Energy-Charts](https://www.energy-charts.info) (Fraunhofer ISE, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), from ENTSO-E, EEX and the transmission operators), aggregated and plotted by me; figures from reports are quoted with their source. If you find a mistake, [message me on LinkedIn](https://www.linkedin.com/in/niklas-abraham-05983b247) and I will fix it. Nothing here is investment, tax or energy-procurement advice; the data run to 16 October 2026.
</div>

**The question.** Germany burns oil in its cars, gas in its boilers and factories, and makes about three fifths of its public electricity from wind, sun, water and biomass. Electricity is only a fifth of final energy, but it is where the energy transition happens first, where prices are set every quarter-hour, and where the swings are largest. So this long read starts with the whole energy system and then spends most of its time on electricity: how the market works, who regulates it, and what eleven years of hourly data say about how it moves.

1. **Where the energy comes from.** Primary energy, imports of gas and oil, the electricity mix and where in the country it is produced.
2. **How the electricity market works.** The merit order, the sequence of markets from futures to balancing, Europe's coupled bidding zones, frequency control and redispatch.
3. **How it moves.** Fluctuations within a day, within a quarter-hour, a week, a month, a year and a decade — with an explorer for any day since 2015.
4. **The rules.** The laws behind the market, how renewables are paid, and what a household's 37 cents per kWh consist of.
5. **Where it is heading.** Targets for 2030 and the open problems.

<nav class="da-toc" markdown="0">
<span class="lbl">Contents</span>
<ol>
<li><a href="#primary">The whole energy system</a></li>
<li><a href="#gas-oil">Gas and oil: almost all imported</a></li>
<li><a href="#mix">The electricity mix, 2015 to 2025</a></li>
<li><a href="#capacity">Capacity: what is installed</a></li>
<li><a href="#where">Where the power is made</a></li>
<li><a href="#merit">The merit order</a></li>
<li><a href="#timeline">From futures to balancing</a></li>
<li><a href="#europe">One market across Europe</a></li>
<li><a href="#frequency">50 hertz: keeping the grid in balance</a></li>
<li><a href="#redispatch">Redispatch: one price, one country, too few lines</a></li>
<li><a href="#explorer">Explore any day since 2015</a></li>
<li><a href="#day">Within a day</a></li>
<li><a href="#quarter">Within an hour: the quarter-hour</a></li>
<li><a href="#week">Within a week</a></li>
<li><a href="#weeks">Within a month: weather</a></li>
<li><a href="#year">Within a year</a></li>
<li><a href="#decade">Across the decade</a></li>
<li><a href="#negative">Negative prices and cannibalisation</a></li>
<li><a href="#laws">The laws</a></li>
<li><a href="#eeg">How renewables are paid</a></li>
<li><a href="#bill">What a household pays for</a></li>
<li><a href="#outlook">2030 and the open questions</a></li>
<li><a href="#sources">Sources</a></li>
</ol>
</nav>

<p class="da-part">Part I<strong>Where the energy comes from</strong></p>

<h2 id="primary"><span class="num">01</span>The whole energy system</h2>

Germany used 10,530 petajoules of primary energy in 2025, about 2,925 TWh, the lowest figure since 1990 ([AGEB 2026](#sources)). "Primary" means energy as it enters the economy: crude oil at the refinery gate, gas at the border, coal at the power plant, wind and sunlight counted by the electricity they produce.

{% include en-fig.html src="primary_energy_2025.webp" title="Primary energy consumption by source, 2025" caption="AG Energiebilanzen, Primärenergieverbrauch in Deutschland 2025 (August 2026), Table 1. Renewables include biomass and biofuels, which are about half of them. Nuclear is zero since April 2023." %}

Three facts frame everything after this.

- **Fossil fuels still supply about three quarters** of primary energy: oil 36.0 %, gas 26.6 %, lignite 7.1 %, hard coal 6.8 %. Oil is mostly transport, gas mostly heat and industry.
- **Renewables are 20.8 %** of primary energy but about **56 % of gross electricity consumption** ([AGEB 2026](#sources)). The energy transition is far ahead in electricity and far behind in heat and transport.
- **Germany imports nearly all its fossil energy.** 95.4 % of the gas consumed and almost all crude oil and hard coal come from abroad; only lignite is mined at home.

{: .da-bridge}
Before turning to electricity, it is worth seeing where the imported fuels come from, because gas still sets the electricity price in many hours.

<h2 id="gas-oil"><span class="num">02</span>Gas and oil: almost all imported</h2>

Until 2021 more than half of Germany's gas came from Russia. Russian pipeline deliveries stopped in summer 2022, and on 26 September 2022 the Nord Stream pipelines were blown up. The map shows the supply three years later.

{% include en-map.html file="map_gas.svg" title="Where Germany's gas came from in 2025" wide=true caption="Shares of the 1,031 TWh imported in 2025 by country of entry (Bundesnetzagentur gas supply figures, January 2026; SMARD, 'The gas market in 2025'). LNG terminal shares are of LNG landed in Germany (AGEB 2026). Much of the Dutch and Belgian volume is itself LNG regasified at Rotterdam and Zeebrugge. Pipeline routes are schematic." %}

- **Gas.** Norway delivered 44 % of imports, the Netherlands 24 % and Belgium 21 %. Germany's own LNG terminals at Wilhelmshaven, Brunsbüttel and Mukran (Rügen) landed 106 TWh, 10.3 % of imports, 94 % of it from the United States. Germany consumed 864 TWh, exported 221 TWh onwards (to Austria, Czechia, Switzerland) and produced 34 TWh itself.
- **Oil.** In 2025 Germany imported no Russian crude (2021: 34.4 % of crude imports). The largest suppliers were Norway (16.6 %), the United States (16.4 %), Kazakhstan (13.7 %) and the United Kingdom (11.4 %) ([AGEB 2026](#sources)).
- **Hard coal** comes mostly from Australia, the United States and Colombia; **lignite** is the only fossil fuel mined in Germany, in the Rhineland, Lusatia and around Leipzig.

That dependence came back into view in 2026. After the attack on Iran on 28 February 2026, shipping through the Strait of Hormuz, which carries about a fifth of the world's LNG, largely stopped. The Dutch TTF gas price, Europe's benchmark, rose from about 32 to over 55 EUR/MWh within days and by late September stood about 125 % above its pre-war level; German storage was at 57 % on 25 September 2026 ([Vattenfall, October 2026](#sources)). Germany buys little gas from the Gulf directly, but it buys on the same European market, so the price moved anyway — and with it, as Part II shows, the price of electricity.

{: .da-bridge}
From here on the subject is electricity: about 530 TWh a year, a fifth of final energy, but the part of the system that changes fastest.

<h2 id="mix"><span class="num">03</span>The electricity mix, 2015 to 2025</h2>

{% include en-fig.html src="generation_by_year.webp" title="Public net electricity generation by source, 2015–2025" wide=true caption="Energy-Charts public net generation (excludes industrial self-supply, about 10 % of total generation), summed from 15-minute data. Black line: load. Hatched: net commercial imports. Values at the right: 2025, in TWh." %}

In ten years the mix has turned over:

- **Nuclear** fell from 87 TWh (2015) to zero; the last three reactors — Isar 2, Emsland and Neckarwestheim 2 — shut down on 15 April 2023.
- **Lignite** fell from 140 to 67 TWh and **hard coal** from 106 to 27 TWh. Coal now makes about a fifth of public generation instead of more than two fifths.
- **Wind** grew from 79 to 131 TWh and **solar** from 35 to 70 TWh. Onshore wind is the largest single source; solar doubled since 2020.
- **Gas** stayed between 29 and 58 TWh: it is the flexible fuel that fills the gaps, not the bulk.
- **Germany became a net importer in 2023.** Through the 2010s it exported 18–60 TWh net a year; since the nuclear shutdown and with cheap power abroad it imports 12–28 TWh net. The AGEB counts 2025 as the third year in a row, at 19.5 TWh ([AGEB 2026](#sources)).

The renewable share of public net generation was 31 % in 2015, 47 % in 2020, 60 % in 2024 and 2025, and about 61 % from January to mid-October 2026. Counted against *load* (consumption) rather than generation, it was 55 % in 2025, because part of the load was covered by imports.

<h2 id="capacity"><span class="num">04</span>Capacity: what is installed</h2>

{% include en-fig.html src="capacity.webp" title="Installed capacity by source, 2002–2025, and the 2030 targets" caption="Energy-Charts installed net capacity (from the Marktstammdatenregister and Bundesnetzagentur), end of year. Solar in DC module rating. Batteries: power rating of large and home batteries. Dashed: the paths to the statutory 2030 targets (EEG 2023 § 4, WindSeeG § 1)." %}

Installed capacity tells a different story from energy, because wind and solar run only part of the time. At the end of 2025 Germany had **118 GW of solar** (DC) and **68 GW of onshore wind** against **35 GW of gas, 15 GW of hard coal and 15 GW of lignite**. A solar panel in Germany produces about 7–8 % of its rated power averaged over the year, an onshore turbine about 18 %, so 118 GW of solar delivered less energy (70 TWh) than 68 GW of onshore wind (105 TWh).

Two numbers to keep in mind: peak load is about 75 GW (75.6 GW on 27 November 2025, 17:00), and solar alone reached **58 GW** on 13 August 2026. On sunny days, solar can now supply more than the whole country consumes.

<h2 id="where"><span class="num">05</span>Where the power is made</h2>

{% include en-map.html file="map_renewables.svg" title="Wind in the north, solar in the south" wide=true caption="Left: onshore wind capacity per state, 31 December 2025 (FA Wind und Solar, Status des Windenergieausbaus an Land 2025, Table 5, from the Marktstammdatenregister). Right: solar capacity per state, 13 January 2026 (Marktstammdatenregister via strom-report). The city states Berlin, Hamburg and Bremen are too small to label (wind 0.0–0.2 GW, solar 0.2–0.5 GW)." %}

Wind sits in the flat, windy north: Lower Saxony alone has 14.0 GW, Schleswig-Holstein 9.6 GW, Brandenburg 9.5 GW, while Bavaria — the largest state — has 2.8 GW. Solar is the opposite: Bavaria has 31.5 GW, a quarter of the country, followed by Baden-Württemberg and North Rhine-Westphalia. Industry and population are concentrated in the west and south. The grid has to move power from north to south, and it cannot yet do so fully.

{% include en-map.html file="map_grid.svg" title="The grid: four operators, the north–south corridors, the coal regions" wide=true caption="The four transmission system operators (TSOs) and their control areas, shown by state; the real borders cut through Bavaria, Hesse, Lower Saxony and Baden-Württemberg. HVDC lines: end points approximate, commissioning dates from the Bundesnetzagentur and the TSOs (SuedOstLink 2027, SuedLink end of 2028). The offshore clusters are schematic." %}

Four companies run the extra-high-voltage grid, each in its own control area: **TenneT** (from the North Sea coast to Bavaria), **50Hertz** (the east and Hamburg), **Amprion** (the west) and **TransnetBW** (Baden-Württemberg). Below them, several hundred distribution system operators run the local grids, from city utilities to regional companies. The planned high-voltage direct-current lines — **SuedLink** (2 × 2 GW from Schleswig-Holstein to Bavaria and Baden-Württemberg), **SuedOstLink** (2 GW from Saxony-Anhalt to Bavaria), **A-Nord** and **Ultranet** — are the backbone that should carry northern wind south. They are late; the consequences are in [section 10](#redispatch).

{: .da-bridge}
With the physical system in place, the question is how it is coordinated: who decides which plant runs, every quarter-hour, and at what price.

<p class="da-part">Part II<strong>How the electricity market works</strong></p>

<h2 id="merit"><span class="num">06</span>The merit order</h2>

Electricity is traded like other commodities, with one twist: it must be produced the moment it is consumed. The central market is the **day-ahead auction**. Every day at noon, producers offer power for each quarter-hour of the next day, buyers bid for it, and an algorithm finds the price at which supply meets demand. **Every accepted seller gets the same price**, the price of the most expensive offer still needed (uniform pricing, "pay-as-cleared").

Producers bid roughly their **short-run marginal cost**: what it costs to produce one more MWh, ignoring the cost of building the plant. For wind and solar that is near zero. For thermal plants it is fuel plus carbon:

{% include en-concept.html id="f01_srmc" %}

Sorting all offers by cost gives the supply curve, the **merit order**. Where demand cuts it, the price is set:

{% include en-concept.html id="a01_merit_order" %}

The merit order explains most of what follows. When wind and solar are plentiful, demand is met by near-zero-cost plants and the price collapses; when they are scarce, gas or coal sets the price — and with it, the price of gas and carbon sets the price of electricity. The data show the curve directly. Plot every hour's price against the **residual load**, the load that wind and solar leave for everyone else:

$$L^{\text{res}}_t = L_t - W_t - S_t$$

{% include en-fig.html src="price_vs_residual.webp" title="The merit order, seen in the data: price against residual load" caption="Every hour of 2019 and 2025 (Energy-Charts). The binned median traces the effective supply curve. In 2019 the curve was flat, about 30–60 EUR/MWh across most residual loads, because coal and gas were cheap. In 2025 it is steeper and higher: gas and carbon cost more, so every GW of extra residual load costs more." %}

Why do German prices often sit near 90–100 EUR/MWh? Because at 2025 fuel and carbon prices, combined-cycle gas, hard coal and lignite all have a marginal cost in that range, as the formula card shows. Lignite, once the cheapest thermal fuel, has become one of the most expensive per MWh, because it emits the most carbon.

<h2 id="timeline"><span class="num">07</span>From futures to balancing</h2>

The day-ahead auction is one stage in a sequence that starts years before delivery and ends after it.

{% include en-concept.html id="a02_market_timeline" %}

- **Futures and forwards** (on the EEX in Leipzig or bilaterally, "OTC") let producers and retailers lock in prices months or years ahead. Most of the energy a household uses is bought this way, which is why retail prices react to the spot market with a lag.
- **Day-ahead auction**, D-1 at 12:00, run by power exchanges such as EPEX SPOT and Nord Pool and coupled across Europe in the Single Day-Ahead Coupling (SDAC). Since **1 October 2025** it sets a price for each of the 96 quarter-hours instead of 24 hours.
- **Intraday**: three intraday auctions (IDA1 at 15:00 on D-1, IDA2 and IDA3 later; Europe-wide since June 2024) and continuous trading, Europe-wide via SIDC and within Germany until five minutes before delivery. Here participants correct for forecast errors: a wind forecast that drops by 2 GW in the morning is bought back here.
- **Balancing**: whatever remains is balanced by the transmission operators with reserves bought in advance ([next sections](#frequency)).
- **Imbalance settlement**: every supplier, trader and producer belongs to a **balancing group** (Bilanzkreis) that must be in balance each quarter-hour. Deviations are charged at the imbalance price (reBAP), which can be far above the spot price. That penalty is what makes everyone forecast carefully.

<h2 id="europe"><span class="num">08</span>One market across Europe</h2>

Germany and Luxembourg form one **bidding zone**: one price for the whole area, no matter where in Germany a plant or consumer is. Until 30 September 2018 Austria was in the zone too; it was split off because flows to Austria overloaded the grid. Bidding zones are linked by interconnectors, and the day-ahead auction computes all European prices at once. In central western Europe it does so with a **flow-based** model of the grid (Core flow-based market coupling, since June 2022): power flows from cheap to expensive zones until the lines are full, and prices differ only where lines are congested.

{% include en-map.html file="map_europe.svg" title="Day-ahead prices across Europe and Germany's net flows, 2025" wide=true caption="Mean day-ahead price per bidding zone, 2025 (Energy-Charts; quarter-hours averaged to hours before averaging). Countries with several zones show the range of their zones; Italy shows the North zone. Arrows: net physical flow over the year between Germany and each neighbour, from cross-border flow measurements (Energy-Charts), in TWh." %}

The pattern follows the generation mix. Hydro-rich Norway and Sweden and nuclear France were cheap in 2025 (France 61 EUR/MWh); Germany (89) sat in the middle; Poland, Italy and southeastern Europe, which burn more coal and gas or import more, were dearer. Power flows accordingly: in 2025 Germany imported 20.0 TWh net from France, 7.7 from Denmark, 7.0 from Norway and 5.9 from the Netherlands, and exported 9.2 TWh to Poland, 7.6 to Austria and 5.3 to Czechia. Over the year the net physical import was 18 TWh, about 4 % of load.

Germany's single zone is contested. In 2025 a European review by the transmission operators examined splitting it into two to five zones; ACER, the EU regulators' agency, estimated the gains of a split at 450–540 million EUR a year. Germany informed the European Commission in late October 2025 that it would keep one zone ([ACER 2025; oenergetice.cz 2025](#sources)). Why that matters is the subject of [section 10](#redispatch).

<h2 id="frequency"><span class="num">09</span>50 hertz: keeping the grid in balance</h2>

Supply and demand must match every second, not just every quarter-hour. The signal is the grid frequency, 50 Hz across Continental Europe. If generation falls short, the spinning machines slow down and the frequency drops; if there is too much, it rises. The transmission operators hold three kinds of **balancing reserve**, bought in daily auctions on regelleistung.net:

{% include en-concept.html id="a03_frequency" %}

| Reserve | Activated | Full output within | What it does |
|---|---|---|---|
| FCR, frequency containment | automatically, by every unit sensing frequency | 30 s | stops the fall; shared across Continental Europe, dimensioned for losing 3,000 MW |
| aFRR, automatic frequency restoration | by each TSO's controller | 5 min | brings frequency back to 50 Hz and relieves FCR |
| mFRR, manual frequency restoration | by TSO call | 12.5 min | replaces aFRR for longer imbalances |

The frequency is never exactly 50 Hz. Real 1-second measurements show a jagged signal within ±50 mHz, and something surprising when averaged over many days:

{% include en-fig.html src="frequency_day.webp" title="Grid frequency: one day, and the shape of an average hour" caption="1-second frequency measured in Freiburg (Energy-Charts). Left: one day in 10-second means. Right: mean deviation from 50 Hz by second of the hour over 11 days in June 2025, smoothed over 10 s. The frequency drops at the full hour and the half hour and creeps up in between." %}

The sawtooth on the right is made by the market. Schedules change in steps at the full hour (and quarter-hours), while consumption changes smoothly. When many power plants ramp to a new schedule at the same moment, generation and load briefly diverge, and the frequency jumps. With 15-minute day-ahead products since October 2025 the steps get smaller, which is one of the reasons for the change.

<h2 id="redispatch"><span class="num">10</span>Redispatch: one price, one country, too few lines</h2>

The single bidding zone assumes power can flow freely within Germany. It cannot. On a windy day the market schedules cheap northern wind to serve southern demand, but the north–south lines are full. The transmission operators then intervene after the market has cleared: they **curtail** plants in front of the bottleneck and **start** plants behind it, and pay both for it. This is **redispatch**.

{% include en-concept.html id="a04_redispatch" %}

It is expensive. In 2025 congestion management cost about **3.1 billion EUR**: 1.18 billion for fossil redispatch, 1.36 billion for reserve power plants kept for grid security, 0.10 billion for countertrading, and 0.43 billion in compensation for curtailed renewable plants; 60 % of the curtailed energy came from renewables ([Bundesnetzagentur, via ZfK and BWE 2026](#sources)). The cost is passed on through network charges, which everyone pays. A split bidding zone would put a higher price in the south and a lower one in the north and let the market solve part of the problem; the German answer so far is to build lines.

{: .da-bridge}
That is the machinery. The rest of this text uses it to read eleven years of hourly data: how supply, demand and price move on every time scale.

<p class="da-part">Part III<strong>How it moves</strong></p>

<h2 id="explorer"><span class="num">11</span>Explore any day since 2015</h2>

Pick a date, a day, a week or four weeks, and see what was produced, what was consumed and what it cost. Hover for the values at any hour; the presets jump to the days discussed below.

<figure class="ee" markdown="0">
<header><span class="concept-kind">explorer</span><span class="concept-title">Generation, load and price, hourly, 2015 to October 2026</span></header>
<div data-energy-explorer data-base="{{ '/assets/energy-article/explorer/' | relative_url }}"></div>
<figcaption>Hourly means of Energy-Charts public net generation by source (stacked), load (black) and day-ahead price (red). Hatched grey on top: net imports. Times are German local time. Data from January 2015 to 16 October 2026; each year loads when you first look at it (about 400 KB).</figcaption>
</figure>

<h2 id="day"><span class="num">12</span>Within a day</h2>

The daily cycle has two drivers: people (demand rises at 6 in the morning, dips at lunch, peaks in the early evening) and the sun.

{% include en-fig.html src="day_by_season.webp" title="An average weekday in four months of 2025" wide=true caption="Weekday hourly means for January, April, July and October 2025 (Energy-Charts). Stacked areas: generation by source; black line: load; dashed red: day-ahead price (right axis). The gap between the stack and the load line is covered by net imports." %}

In January, wind and coal carry the day and the price has two humps, morning and evening, following demand. In April and July solar dominates from 9 to 17 h, coal and gas plants throttle down, and the price falls to 25–45 EUR/MWh at midday before climbing to 140–150 EUR/MWh after sunset. The result is the **duck curve**: residual load (the duck's back) sags at noon and rises steeply in the evening.

{% include en-concept.html id="a05_duck" %}

The shape has changed fast. Normalising each year's hourly prices by the yearly mean makes the years comparable:

{% include en-fig.html src="price_by_hour_years.webp" title="The daily price shape, 2015 to 2025" caption="Mean day-ahead price by hour of the day divided by the year's mean price (Energy-Charts). In 2015 the midday hours were close to the average; in 2025 the 13:00 hour paid 52 % of the average and the 19:00 hour 152 %." %}

In 2015 the cheapest hours were at night, when demand was low. Today they are at noon. The average spread between a day's most and least expensive hour was **124 EUR/MWh in 2025, against 30 in 2019**. That spread is the business case for batteries, which buy at noon and sell in the evening; installed battery power reached 17 GW (26 GWh) at the end of 2025, most of it home storage ([Energy-Charts](#sources)).

<h2 id="quarter"><span class="num">13</span>Within an hour: the quarter-hour</h2>

Since 1 October 2025 the day-ahead auction prices quarter-hours. Within each hour the price now follows the ramp of the sun.

{% include en-fig.html src="quarter_hours.webp" title="Prices within the hour since the switch to 15-minute products" caption="Left: mean day-ahead price by time of day divided by the period mean, for hourly products (Oct 2024–Sep 2025) and 15-minute products (Oct 2025–Oct 2026). Right: price of each quarter-hour relative to its hour's mean, averaged over the year since October 2025." %}

Between 9 and 12 h, while solar output rises, the first quarter-hour of each hour is on average about 15 EUR/MWh above the hour's mean and the last about 14 below. Between 16 and 19 h, as solar fades, the pattern reverses: the last quarter-hour is 20 EUR/MWh dearer than the hour's mean. With hourly products, a plant or a battery could not see this; now it is paid for following it.

<h2 id="week"><span class="num">14</span>Within a week</h2>

{% include en-fig.html src="week_profile.webp" title="The average week, 2025" caption="Hourly means by hour of the week, 2025 (Energy-Charts). Black: load (left axis); dashed red: price (right axis); shaded: wind plus solar." %}

Factories and offices make the week. Average load was 55.8 GW on weekdays and 45.4 GW on Sundays, 19 % less. Wind and sun do not know the day of the week, so on weekends the same renewable output meets lower demand: Sunday prices between 12 and 15 h averaged 18 EUR/MWh in 2025, and most negative prices fall on weekends and public holidays.

<h2 id="weeks"><span class="num">15</span>Within a month: weather</h2>

On the scale of days to weeks, weather dominates. A high-pressure system in winter can bring days of fog and calm — the **Dunkelflaute**, "dark doldrums" — when wind and solar together produce almost nothing. November and December 2024 had two textbook cases.

{% include en-fig.html src="dunkelflaute_2024.webp" title="Two Dunkelflauten, November and December 2024" wide=true caption="Hourly wind and solar generation, load and day-ahead price from 28 October to 16 December 2024 (Energy-Charts). Shaded: the calm spells of 2–8 November and 10–13 December." %}

From 2 to 8 November 2024, wind output stayed below a few GW for days; the price reached 820 EUR/MWh on 6 November at 17:00. On 12 December 2024 at 17:00 it reached **936 EUR/MWh**, the highest hourly price of the decade. Between the calms, storms pushed wind above 40 GW and prices toward zero. The same week can contain both extremes.

{% include en-fig.html src="variability.webp" title="How variable wind and solar are, 2025" caption="Left: distribution of hourly wind output (onshore plus offshore) in 2025. Right: daily wind plus solar generation as a share of load (Energy-Charts)." %}

Wind output in 2025 averaged 15 GW but was below 5 GW in 18 % of all hours and above 40 GW in only 207 hours; its maximum was 51 GW on 26 October 2025. Day by day, wind plus solar covered between **7 % of load (8 November 2025) and 98 % (26 October 2025)**. Any system built on these sources needs something for the low end: storage, imports, flexible demand, or plants that run a few hundred hours a year.

<h2 id="year"><span class="num">16</span>Within a year</h2>

{% include en-fig.html src="months_2025.webp" title="Monthly generation by source, 2025" caption="Monthly sums, 2025 (Energy-Charts). Black: load." %}

Solar and wind are seasonal complements: solar produced 8–10 TWh a month from April to August and under 2 TWh in December and January, while wind is strongest from October to March. Demand is higher in winter (58.6 GW average in December–February against 48.8 GW in June–August, 2025) because of lighting, heating and heat pumps. Coal and gas fill the winter gap. The heat map shows the year's price at a glance:

{% include en-fig.html src="price_heatmap.webp" title="Every hour of three years" wide=true caption="Day-ahead price by hour of the day (vertical) and day of the year (horizontal), 2019, 2022 and 2025 (Energy-Charts). White is zero, blue negative." %}

In 2019 the year is a uniform 30–50 EUR/MWh. In 2022 it is dark from spring to autumn, the gas crisis. In 2025 a pale window opens in the middle of every spring and summer day: solar hours at or below zero, framed by expensive mornings and evenings.

<h2 id="decade"><span class="num">17</span>Across the decade</h2>

{% include en-fig.html src="monthly_price.webp" title="Monthly and yearly day-ahead prices, January 2015 to October 2026" wide=true caption="Monthly mean (step) and yearly mean (horizontal bars, labelled) of the day-ahead price, Germany(-Austria)-Luxembourg (Energy-Charts). 2026: January to 16 October." %}

From 2015 to 2020 the price averaged 29–44 EUR/MWh. In autumn 2021 European gas prices began to climb; after Russia cut deliveries in 2022 the monthly average peaked at **465 EUR/MWh in August 2022** and the year averaged 235. Prices fell back to 95 (2023), 79 (2024) and 89 (2025) — still two to three times the level of the 2010s, because gas stayed more expensive than before and the carbon price rose. 2026 so far averages **111 EUR/MWh**. After a mild spring (79 in April) the monthly mean climbed with the gas price that followed the Iran war and the closure of Hormuz, to 145 in September and 163 in the first half of October.

The merit order explains why one fuel moves the whole price: in most hours a gas plant is the marginal producer, so the gas price is passed through to every MWh, including wind and solar.

<h2 id="negative"><span class="num">18</span>Negative prices and cannibalisation</h2>

A negative price means producers pay to deliver. It happens when inflexible generation — must-run combined heat and power plants, plants providing grid services, and, until recently, renewables paid per MWh regardless of price — exceeds demand plus export capacity.

{% include en-fig.html src="negative_hours.webp" title="Hours with a negative day-ahead price" caption="Left: hours with a negative hourly price per year (Energy-Charts; since October 2025 the hourly mean of the four quarter-hours). 2026: until 16 October. Right: in which hours of the day the 576 negative hours of 2025 fell." %}

Negative hours rose from about 100–300 a year before 2023 to **457 in 2024 and 576 in 2025**; by mid-October 2026 there were 471. Almost all of them lie between 10 and 17 h, in April to September. The lowest price allowed in the auction, −500 EUR/MWh, was reached on 2 July 2023, and on **1 May 2026** (a holiday) the 13:00 hour averaged −499 EUR/MWh. On 25 May 2026 at 13:00, wind and solar exceeded the entire German load by 15.6 GW.

For solar, this is a problem of its own success. All panels produce at the same time, so the more there are, the lower the price they produce into. This is called **cannibalisation**, and it is measured by the capture rate:

{% include en-concept.html id="f03_capture" %}

{% include en-fig.html src="capture_rates.webp" title="Capture rates of solar and wind, 2015–2025" caption="Output-weighted average price divided by the plain average price, per year (Energy-Charts, hourly)." %}

In 2018 solar still earned 99 % of the average price. In 2025 it earned **52 %**: 46 EUR/MWh against a base price of 89, and in June 2025 only about 20 EUR/MWh against 64. Offshore wind, which blows more evenly and at night, kept 96 %. This is the clearest market signal there is: the next GW of solar is worth less than the last, and the next GW of storage or flexible demand is worth more.

{% include en-fig.html src="duration_curves.webp" title="Residual load duration curves, 2015, 2020, 2025" caption="Each year's hourly residual load (load minus wind and solar) sorted from the highest to the lowest hour (Energy-Charts). Dashed: the load itself in 2025." %}

The duration curve summarises the decade. The peak of residual load barely moved (75 GW in 2015, 68 GW in 2025): on a calm winter evening almost the whole demand must still come from controllable plants or imports. But the curve sank everywhere else, and in 2025 it dipped below zero. Germany needs about the same amount of firm capacity as ten years ago, running for far fewer hours — which is why the government is now paying for new gas plants ([section 22](#outlook)).

{: .da-bridge}
Who pays for all this, and under which rules, is decided by a dense body of law.

<p class="da-part">Part IV<strong>The rules</strong></p>

<h2 id="laws"><span class="num">19</span>The laws</h2>

The German electricity market rests on a handful of federal laws and a growing layer of EU regulation.

| Law | Since | What it governs |
|---|---|---|
| **Energiewirtschaftsgesetz (EnWG)** | 1998, reformed 2005 and often since | The market's constitution: liberalisation, unbundling of grid and supply, regulation of network charges by the Bundesnetzagentur, balancing groups, redispatch (§ 13), controllable devices such as heat pumps and wallboxes with lower network charges (§ 14a, 2024), dynamic tariffs every supplier must offer (§ 41a, 2025), energy sharing (§ 42c, 2026) |
| **Erneuerbare-Energien-Gesetz (EEG)** | 2000, now EEG 2023 | Support for renewables: feed-in tariffs, since 2014 direct marketing with a market premium, since 2017 auctions; targets of 80 % renewable electricity and 215 GW solar, 115 GW onshore wind by 2030 (§§ 1, 4) |
| **Windenergie-auf-See-Gesetz (WindSeeG)** | 2017 | Offshore wind: 30 GW by 2030, 40 GW by 2035, 70 GW by 2045 |
| **Atomgesetz (AtG)** | 1959; phase-out 2002, 2011 | Nuclear exit, completed on 15 April 2023 |
| **Kohleverstromungsbeendigungsgesetz (KVBG)** | 2020 | Coal exit by 2038 at the latest, with compensation for plant owners; RWE agreed to end lignite in the Rhineland by 2030 |
| **Kraft-Wärme-Kopplungsgesetz (KWKG)** | 2002 | Support for combined heat and power, financed by the CHP levy |
| **EU Emissions Trading (ETS)**, and the national **BEHG** | 2005; 2021 | A cap and price for carbon from power plants and industry (about 74 EUR/t in 2025), and a national carbon price for heating and transport fuels (55–65 EUR/t corridor in 2026) |
| **Stromsteuergesetz** | 1999 | Electricity tax: 2.05 ct/kWh for households; since 2026 the EU minimum of 0.05 ct/kWh for manufacturing and agriculture |
| **Messstellenbetriebsgesetz (MsbG)** | 2016, relaunched 2023 | Smart meter rollout, the precondition for time-variable tariffs |
| **Strom-Versorgungssicherheits- und Kapazitätengesetz (StromVKG)** | July 2026 | Tenders for new controllable capacity, mostly gas plants that must later switch to hydrogen ([section 22](#outlook)) |
| **EU Electricity Market Regulation 2019/943 and the 2024 market design reform** | 2019, 2024 | Market coupling, bidding zones, balancing rules; two-sided contracts for difference for new publicly supported plants |

The **Bundesnetzagentur** in Bonn regulates grids and monitors the market, the **Bundeskartellamt** watches for market power, and **ACER** coordinates the national regulators at EU level.

<h2 id="eeg"><span class="num">20</span>How renewables are paid</h2>

Most new wind and solar plants above 100 kW sell their power on the market through a direct marketer and receive a **sliding market premium** on top, sized in an auction:

{% include en-concept.html id="f02_premium" %}

Two changes made in 2025 respond directly to the negative-price problem of [section 18](#negative). The **Solarspitzengesetz**, in force since 25 February 2025, removes the premium for new plants in every quarter-hour with a negative price (the lost periods are added to the end of the 20-year support) and caps the feed-in of new small rooftop systems without a smart meter. The cost of the premiums, which used to be paid by consumers as the EEG surcharge, has been paid from the federal budget since July 2022; the surcharge is zero.

<h2 id="bill"><span class="num">21</span>What a household pays for</h2>

{% include en-fig.html src="household_price.webp" title="The household electricity price, 2026" caption="BDEW Strompreisanalyse, August 2026: average price for a household using 3,500 kWh a year, including the standing charge. 'Procurement & retail' includes the supplier's margin; network charges include metering." %}

An average household paid **37.0 ct/kWh** in 2026, down from 39.3 ct in 2025 ([BDEW 2026; AGEB 2026](#sources)). Only **15.2 ct** is energy and the supplier's costs. **9.2 ct** are network charges, 1.7 ct lower than in 2025 because the federal government now subsidises the transmission network charges. **12.6 ct** are taxes, levies and surcharges: VAT (5.9), electricity tax (2.05), the concession fee paid to municipalities for using their streets (1.67), the § 19 surcharge that finances network-charge discounts for large consumers (1.56), the offshore grid levy (0.94) and the CHP levy (0.45). Industry pays much less: 17.2 ct/kWh on average in 2026 for small and medium industrial customers, because most levies are reduced and the electricity tax is at the EU minimum.

The wholesale swings of Part III reach households slowly, because suppliers buy ahead on the futures market. Households with a smart meter and a dynamic tariff can now pass the hourly price through — and charge an electric car at noon on a Sunday for less than the network charges alone.

<p class="da-part">Part V<strong>Where it is heading</strong></p>

<h2 id="outlook"><span class="num">22</span>2030 and the open questions</h2>

| | End of 2025 | Target 2030 | Source of target |
|---|---|---|---|
| Renewable share of gross electricity consumption | about 56 % | 80 % | EEG § 1 |
| Solar | 118 GW (DC) | 215 GW | EEG § 4 |
| Onshore wind | 68 GW | 115 GW | EEG § 4 |
| Offshore wind | 9.7 GW | 30 GW | WindSeeG § 1 |
| Coal | 30 GW | exit by 2038 at the latest | KVBG |
| Climate neutrality | | 2045 | Climate Protection Act |

Solar is roughly on its path; onshore wind is behind, but approvals hit a record 20.8 GW in 2025 ([FA Wind und Solar 2026](#sources)); offshore wind is far behind. The harder problems are not the volumes but the gaps between them:

- **Firm capacity for the Dunkelflaute.** Section 18 showed that residual load still peaks near 70 GW. The **StromVKG**, passed by the Bundestag on 9 July and the Bundesrat on 10 July 2026, tenders new controllable capacity — 4.5 GW each in auctions scheduled for 8 September and 29 December 2026 and 2 GW in May 2027, subject to EU state-aid approval ([BDEW 2026](#sources)). The plants will burn natural gas at first and are meant to switch to hydrogen.
- **The grid.** SuedOstLink is due in 2027 and SuedLink at the end of 2028. Until then, redispatch costs of around 3 billion EUR a year continue.
- **Flexibility.** Batteries, heat pumps and electric cars that respond to price, enabled by smart meters and dynamic tariffs, are the cheapest answer to the duck curve. The quarter-hour market and the 124 EUR/MWh daily spread already pay for them.
- **Gas dependence.** As long as gas sets the price in most hours, a war in the Gulf moves the price of a kWh in Bavaria. 2022 and 2026 showed that twice in five years.

Germany's electricity system has changed more in the last decade than in the fifty years before. What has not changed is the logic of the market at its centre: one price per quarter-hour, set by the most expensive plant still needed. Everything else — negative prices, Dunkelflaute spikes, the value of a battery, the cost of a missing line — follows from it.

<h2 id="sources"><span class="num">23</span>Sources</h2>

<div class="da-note" markdown="1">
**Data.** All time series are from the [Energy-Charts API](https://api.energy-charts.info) of Fraunhofer ISE, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); I aggregated, combined and plotted them, and the figures and explorer data are my processing, not Energy-Charts' originals: public net generation per source and load (15-minute, 2015 to 16 October 2026), day-ahead prices (DE-AT-LU until September 2018, DE-LU since), cross-border physical flows, installed capacity, 1-second grid frequency, and the 2025 prices of 32 European bidding zones. The scripts that download, process and plot them are part of this site's source (`bin/energy_article/`). Maps are drawn with my map kit (Natural Earth, public domain).

**Reports and articles**

- AG Energiebilanzen, [Primärenergieverbrauch in Deutschland 2025, Jahresbericht](https://ag-energiebilanzen.de/wp-content/uploads/AGEB_Jahresbericht2025_20260828_dt.pdf), August 2026.
- Bundesnetzagentur, [Gas supply figures for 2025](https://www.bundesnetzagentur.de/SharedDocs/Pressemitteilungen/EN/2026/20260112_GAS.html), January 2026; SMARD, [The gas market in 2025](https://www.smard.de/page/en/topic-article/5892/219670/the-gas-market-in-2025).
- BDEW, [Strompreisanalyse August 2026](https://www.bdew.de/media/documents/BDEW_Strompreisanalyse_082026.pdf); BDEW, [StromVKG beschlossen](https://www.bdew.de/energie/strom-vkg-beschlossen-versorgungssicherheit/), July 2026.
- FA Wind und Solar / Deutsche WindGuard, [Status des Windenergieausbaus an Land 2025](https://www.fachagentur-wind-solar.de/fileadmin/Veroeffentlichungen/Wind/Analysen/FA_Wind_Solar_Status_des_Windenergieausbaus_an_Land_Jahr_2025.pdf), January 2026.
- Solar capacity per state from the Marktstammdatenregister via [strom-report.com](https://strom-report.com/photovoltaik/), 13 January 2026.
- Congestion management costs 2025: Bundesnetzagentur figures as reported by [ZfK](https://www.zfk.de/energie/strom/redispatch-2025-pv-abregelung-verteilnetz) and [BWE, Faktencheck Redispatch](https://www.wind-energie.de/fileadmin/redaktion/dokumente/publikationen-oeffentlich/themen/04-politische-arbeit/01-gesetzgebung/20260421_Faktencheck_Redispatch.pdf), 2026.
- EPEX SPOT, [15-minute products live in the day-ahead markets](https://www.epexspot.com/en/news/15-minute-products-live-epex-spot-day-ahead-markets), October 2025.
- ACER, [Bidding zone study underestimates benefits](https://www.acer.europa.eu/news/electricity-system-operators-bidding-zone-study-significantly-underestimates-benefits-reshaping-europes-bidding-zones), 2025; [oenergetice.cz on Germany keeping one zone](https://oenergetice.cz/en/germany/germany-will-officially-reject-a-split-of-its-bidding-zone-by-the-end-of-october), 2025.
- Vattenfall, [Iran-Konflikt und Energiepreise](https://www.vattenfall.de/geschaeftskunden/ves/magazin/energie/irankonflikt-energiepreise), updated 1 October 2026.
- Amprion, [Balancing capacity in Germany](https://www.amprion.net/Energy-Market/Market-Platform/Control-Energy/) (reserve products).
- EUA price 2025: [GMK Center](https://gmk.center/en/news/european-carbon-prices-hit-two-year-high-in-december/), December 2025. Solarspitzengesetz: [co2online](https://www.co2online.de/modernisieren-und-bauen/photovoltaik/solarspitzengesetz/).
</div>

The animations were drafted with a concept-visualisation pipeline adapted from [Get It.](https://github.com/beltromatti/get-it) and checked frame by frame; their numbers are illustrative unless the caption says otherwise.

</article>
<script defer src="{{ '/assets/js/concepts.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/da-guide.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/energy-explorer.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
