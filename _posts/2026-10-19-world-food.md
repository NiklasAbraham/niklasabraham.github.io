---
layout: default
title: Where the world's food is grown, and where it goes
description: Where wheat, rice, soya, palm oil, coffee and 64 other foods are grown, how few countries grow most of them, how much of each crosses a border and who ships it to whom. An article with maps, a time machine, trade flows and a page for every country, built on FAO's production, trade and food-balance statistics.
date: 2026-10-19
tags: [food, agriculture, trade, data]
categories: [long-read]
read_time: 35 # the word count does not include the interactive figures
---
{%- assign data = '/assets/food-article/' | relative_url -%}
<article class="da fdp" markdown="1" data-stations="off" data-brand="World food" data-brand-sub="where it grows, where it goes · a long read" data-contact="https://www.linkedin.com/in/niklas-abraham-05983b247">

<p class="da-eyebrow">Blog · Long read · 69 foods, 16 interactive figures</p>
<h1 class="da-title">Where the world's food is grown, and where it goes</h1>
<p class="da-lede">Almost everything a person eats was grown somewhere, and for a surprising number of foods that somewhere is one or two countries. This is a guided tour of the planet's harvest: where 69 foods grow, how concentrated each one is, how much of it ever crosses a border, and who ships it to whom, from Brazilian soya to Chinese crushers and from Russian wheat to Egyptian bread.</p>
<p class="da-meta">Written by an AI, published by Niklas Abraham · 19 October 2026 · about 35 minutes · production and trade 2023, history since 1961 · 16 interactive figures</p>

<div class="da-note ai-note" markdown="1">
**This article was written by an AI.** I am curious about how the world feeds itself, so I asked Claude (an AI model from Anthropic) to research, write and code this article to help me learn more. All numbers come from FAOSTAT, the statistics of the UN Food and Agriculture Organization (see [Sources](#sources)), and the figures are computed from them by script. The prose may contain mistakes, and agricultural statistics hide traps ([last section](#limits)), so check what you rely on at its source. If you find an error, [message me on LinkedIn](https://www.linkedin.com/in/niklas-abraham-05983b247). Nothing here is investment, trading or policy advice.
</div>

**The question.** The world grew about 2 billion tonnes of sugar cane, 1.2 billion tonnes of maize and around 800 million tonnes each of rice and wheat in 2023. Where? And how much of it then left the country it grew in? The answers are less even than most people expect. Five countries grow more than half of the world's wheat. Two countries grow half of its maize, and two grow 82 % of its palm oil. China buys three in every five soya beans that are traded. And while a quarter of the wheat crop crosses a border, only one potato in twenty does.

The article has three parts and every figure in it can be played with.

1. **What is grown.** What counts as food, why tonnes and calories tell different stories, what happens to a crop after the harvest, then the atlas: where each of 69 foods grows, how few countries it takes to grow half of it, and how the picture moved since 1961.
2. **What moves.** How much of each crop is traded, and the flow maps and matrices of who ships it to whom, with the stories behind the big lanes: soya to China, wheat from the Black Sea, palm oil, coffee and cocoa.
3. **Who eats what.** How much grain a country has to buy, what people eat in 177 countries, and a page for every country that puts it all together.

<nav class="da-toc" markdown="0">
<span class="lbl">Contents</span>
<ol>
<li><a href="#plate">What the world eats</a></li>
<li><a href="#tonnes">Tonnes against calories</a></li>
<li><a href="#use">Plate, trough, tank</a></li>
<li><a href="#atlas">The atlas: where 69 foods grow</a></li>
<li><a href="#half">How few countries grow half</a></li>
<li><a href="#time">Sixty years of harvests</a></li>
<li><a href="#traded">What crosses a border</a></li>
<li><a href="#flows">How to read a trade flow</a></li>
<li><a href="#soy">Soya: a lane that ends in China</a></li>
<li><a href="#wheat">Wheat: six sellers, 180 buyers</a></li>
<li><a href="#oils">Palm oil and sunflower oil</a></li>
<li><a href="#tropics">Coffee, cocoa and bananas</a></li>
<li><a href="#diet">Who buys the grain</a></li>
<li><a href="#country">Open any country</a></li>
<li><a href="#limits">What the numbers cannot tell you</a></li>
<li><a href="#sources">Sources</a></li>
</ol>
</nav>

<p class="da-part">Part I<strong>What is grown</strong></p>

<h2 id="plate"><span class="num">01</span>What the world eats</h2>

Start with the plate, because it fixes the scale. FAO's food balance sheets add up, for each country, everything that is available for people to eat in a year and divide by the population. The world average over the 177 countries that publish one (7.7 billion people) is **3,045 kilocalories per person per day**. The figure below splits it by food group for the 16 most populous countries. Use the buttons to switch to the countries at the two ends of the range, and hover a bar for the numbers behind each colour.

{% include fd.html kind="plate" title="Calories per person per day, by food group" caption="FAO food balance sheets, food supply per person (2023 for 176 countries, 2019 for one). 'Food supply' is what is available as food, after trade and non-food uses, before waste in shops and kitchens; it is higher than what people actually eat. Japan, Sudan, Mali, Chad, North Korea, Singapore and 14 other countries publish no balance for these years and are missing." %}

Three things stand out.

- **Cereals are 42 % of the world's calories**, 1,291 of 3,045 kcal. Wheat (548 kcal) and rice (519 kcal) alone are 35 %.
- **Rich diets are not more grain, they are more of everything else.** The United States is at 3,947 kcal per person per day, Belgium and Ireland at 3,921, Türkiye at 3,892; Yemen is at 1,811, Lesotho at 1,873, Haiti at 1,959 and Madagascar at 1,978. An American eats fewer calories from cereals (848 kcal) than the world average (1,291) and more than twice the average from vegetable oils (783 against 325), sugar (569 against 234), meat (491 against 227) and dairy (392 against 174).
- **Where the protein comes from differs more than the calories do.** Animal products supply 9 % of the protein in Ethiopia, 10 % in Niger and 12 % in Nigeria, but 74 % in Mongolia, 70 % in the Netherlands and 67 % in the United States and Germany.

{: .da-bridge}
Calories are one way to weigh a diet. The statistics of what farmers grow use another, tonnes, and the two disagree enormously.

<h2 id="tonnes"><span class="num">02</span>Tonnes against calories</h2>

FAOSTAT counts production in tonnes of the product as it leaves the farm: grain, tubers, cane stalks, milk, the carcass of an animal. The ranking of foods by that weight is not the ranking by nourishment. The figure puts the two side by side.

{% include fd.html kind="scale" title="The biggest foods by weight and by calories" caption="Left view: FAOSTAT production 2023 in tonnes, 59 foods, derived products (sugar, oils, dairy products) left out. Right view: FAO food balance sheets, kilocalories per person per day available as food, world average over 177 countries." %}

By weight, **sugar cane is first at 2.0 billion tonnes**, then maize (1.24 billion), milk of all species (971 million), rice (805 million, counted as unmilled paddy), wheat (795 million), oil palm fruit (410 million), potatoes (387 million), soya beans (371 million) and cassava (340 million). By calories as eaten, the list opens with **wheat (548 kcal per person per day), rice (519), sugar (198), milk (174) and maize (148)**, followed by soya bean oil (94), pork (92), palm oil (76), poultry (70) and cassava (70).

The gaps are explained by water, fibre and detours. Sugar cane is mostly stalk, and cane and beet together, 2.3 billion tonnes, become 188 million tonnes of sugar. Milk is close to 90 % water. And the maize that tops the weight table is mostly not eaten as maize, as the next section shows.

{: .da-bridge}
Maize has the highest weight of any grain and a modest place on the plate. The difference is where it goes after the harvest.

<h2 id="use"><span class="num">03</span>Plate, trough, tank</h2>

The same food balance sheets say what happens to each crop once it is in the silo: how much is eaten as food, fed to animals, processed (crushed for oil, turned into starch or sugar, malted), sown again, used for fuel and industry, or lost. Add the six and you have the supply of a crop in the world.

{% include fd.html kind="use" title="What happens to a crop: food, feed, factory, fuel, seed, loss" caption="FAO food balance sheets, world supply summed over the countries that publish one, 2023 for most. Each bar shows the six uses as shares of their sum; FAO's small unallocated residual is left out." %}

Rice and potatoes are food crops: rice 81 % food, potatoes 70 %. Wheat is 65 % food and 23 % feed. **Maize is a feed and fuel crop first: 11 % is eaten as food, 59 % goes to animals and 18 % is booked as non-food use** (mostly fuel ethanol in the United States), with 6 % processed. Barley is 58 % feed and 22 % processed, mostly malting. Soya beans, rapeseed and sunflower seed are almost entirely crushed: 84 %, 80 % and 89 % of the supply is processed, for oil that is eaten and meal that is fed. Vegetable oils are the other surprise: FAO books 45 % of soya bean oil, 50 % of palm oil and 52 % of rapeseed oil under non-food uses, a category that covers biodiesel and oleochemicals such as soap and cosmetics (industry estimates of palm oil going to fuel and oleochemicals are lower, so read these shares as FAO's accounting, not as a measurement of biodiesel).

For a food-security question, then, "how much maize" and "how much food" are different questions, and the animals that eat the maize and the soya meal turn up on the plate later, as the 227 kcal of meat and 174 kcal of milk and cream in the first figure.

Read the bars from the left: blue is what reaches a plate, brown what goes to animals, green what is crushed or processed, purple what burns or is turned into soap. Sort by *Feed share* to see the foods that people mostly feed to something else.

{: .da-bridge}
With the scale and the uses in place, the atlas: where each food actually grows.

<h2 id="atlas"><span class="num">04</span>The atlas: where 69 foods grow</h2>

Pick a food, and a way to look at it. *Tonnes* is the 2023 harvest of each country, *share of world* the same as a fraction of the world total, *yield per hectare* the harvest divided by the harvested area (only for crops with an area, and only for countries with a meaningful one), and *per person* the harvest divided by the population. The ranking on the right follows the metric chosen; click a country to pin it.

{% include fd.html kind="atlas" comm="wheat" title="Where the wheat grows" caption="FAOSTAT crops and livestock products, 2023. Countries too small to be drawn are in the ranking but not on the map. Natural Earth 1:50m borders (public domain); Equal Earth projection." %}

Wheat is the staple with the widest spread: **China (17 %), India (14 %), Russia (12 %), the United States (6 %) and France (5 %)** grow 54 % of it, and 122 countries grow some. Rice is concentrated in Asia: India and China each grow 26 % of the world crop, followed by Bangladesh (8 %), Indonesia (7 %) and Vietnam (5 %). Maize is a crop of the Americas and China: the United States grows 31 %, China 23 %, Brazil 11 %. Potatoes are mostly Asian too, China 24 % and India 16 %, with Ukraine (6 %) the biggest European grower. Cassava is the African root: Nigeria 18 %, DR Congo 13 %, Thailand 9 %, Ghana 8 %.

Production hides a second variable, how much each hectare yields. The same atlas answers that for maize.

{% include fd.html kind="atlas" comm="maize" metric="yield" title="Maize yield per hectare" caption="Harvest divided by harvested area, 2023, tonnes per hectare, for countries with at least 1,000 hectares and 0.1 % of the world's maize area. 'Harvested area' counts a field once per harvest, so double-cropped land appears twice." %}

The world average maize yield is **5.9 tonnes per hectare**. The United States makes 11.1, Canada 10.2, France 9.8, Italy 10.7. Brazil, the third-biggest producer, gets 5.9, India 3.3 and Nigeria 1.9. The spread is wider still in wheat, where the world average is 3.6 tonnes per hectare: the United Kingdom, Germany, Denmark and France make 7.2 to 8.1, India 3.5, the United States 3.3 and Nigeria 1.6. It is narrowest in rice (world 4.8; Egypt 9.2, United States 8.6, China 7.1, India 4.3, Nigeria 2.0). A low yield is not a verdict on the farmers: it mixes rain-fed against irrigated land, how many harvests a year the field gives, and what share of the area is marginal, and a country with huge areas of dry-land wheat looks worse than its best fields are.

One more view. Not every food is a big, round commodity, and the shape of the map changes with the climate a plant needs.

{% include fd.html kind="atlas" comm="coffee" metric="share" title="Where coffee grows" caption="Share of the world's green coffee harvest, 2023. Coffee grows in a belt around the equator, roughly between the tropics, at altitudes where frost does not reach it." %}

Brazil grows 30 % of the world's coffee, Vietnam 18 %, Indonesia 7 %, Colombia 6 %, Ethiopia 5 %. Cocoa is tighter still: Côte d'Ivoire grows 36 %, Ghana 13 % and Indonesia 12 %, which is 61 % in three countries. Tea is half Chinese (49 %) with India at 19 % and Kenya at 8 %.

{: .da-bridge}
Those shares point at something systematic. Some foods are spread over a hundred countries and some over three. How concentrated is each one?

<h2 id="half"><span class="num">05</span>How few countries grow half</h2>

Sort the 59 foods that are not made from another food in the list by the number of countries it takes to add up to half of the world's harvest. The bar shows the five biggest producers; the number on the right is the count.

{% include fd.html kind="half" title="How many countries does it take to grow half of the world's harvest?" caption="FAOSTAT production 2023. Derived products (sugar, vegetable oils, dairy products) are left out so that nothing is counted twice. The bar is the five biggest producers, darkest first, then the name and share of the biggest; hover or touch for all five." %}

**One country grows more than half of nine foods**: cucumbers (China, 78 %), chickpeas (India, 76 %), yams (Nigeria, 70 %), watermelons (China, 61 %), oil palm fruit (Indonesia, 59 %), hazelnuts (Türkiye, 58 %), sweet potatoes (China, 57 %), pistachios (the United States, 52 %) and apples (China, 51 %). Two countries are enough for 15 more, among them rice (India and China, 51 %), maize (the United States and China, 55 %), soya beans (Brazil and the United States, 72 %), tea (China and India, 68 %), almonds (the United States 49 % and Australia 9 %), groundnuts, sugar cane (Brazil 39 % and India 24 %) and pork (China 47 % with the United States at 10 %). The oil made from the palm fruit, which is left out of the figure so that nothing is counted twice, fits the pattern too: Indonesia and Malaysia produce 82 % of the world's palm oil.

At the other end sit the foods that need many countries: **beef, chicken, barley, sorghum, sesame and pineapples take six countries each, and honey seven**. Wheat takes five, bananas five and cassava five. Cocoa, coffee, lentils, rapeseed and tomatoes sit at three.

The pattern is more about biology and economics than about luck. A tropical tree crop that needs frost-free, humid land for decades can grow in a few belts of the world, and a country that gets its plantations, ports and processors working early keeps its share. Grains and animals can be raised nearly everywhere, so the biggest country is large but the tail is long. This explanation is mine, not the data's: the statistics show the concentration, not the reasons for it.

{: .da-bridge}
The concentration is a snapshot of 2023. The history shows how quickly it can change.

<h2 id="time"><span class="num">06</span>Sixty years of harvests</h2>

FAOSTAT's production tables start in 1961. The time machine plots them as a stacked area for the 12 biggest producers of the latest year, plus the Soviet Union, Yugoslavia and Sudan (former) where they existed, plus "all others". *Share* turns the areas into 100 %. Press play, drag the slider or hover (on a phone, touch the chart).

{% include fd.html kind="time" comm="soy" title="Soya beans since 1961" caption="FAOSTAT production, 1961 to 2024 (2024 is FAO's first estimate). The 2024 values are provisional for most countries." %}

**Soya beans grew almost 14-fold, from 27 million tonnes in 1961 to 371 million in 2023**, and changed hands on the way. In 1961 the United States grew 69 % of them, 18.5 million tonnes; Brazil grew 0.27 million. In 2023 Brazil grew 152 million tonnes and the United States 113 million, with Argentina (25 million), China (21 million), India (13 million) and Paraguay (10 million) following. The rise of soya is the rise of animal feed: section 03 showed that 84 % of the supply is crushed, mostly for the meal that goes to chickens and pigs.

{% include fd.html kind="time" comm="palmoil" title="Palm oil since 1961" caption="FAOSTAT production of palm oil, 1961 to 2024." %}

Palm oil is the fastest riser of any food that already had 100,000 tonnes in 1961: **1.5 million tonnes in 1961, 11 million in 1990 and 80 million in 2023**, a 54-fold increase. In 1990 Malaysia was the giant (6.1 million tonnes against Indonesia's 2.4 million). In 2023 Indonesia produced 47.1 million tonnes and Malaysia 18.6 million. The cereals grew much more slowly, but still faster than the population: **wheat 3.6-fold, rice 3.7-fold and maize 6.0-fold since 1961**, against a world population that grew by a factor of about 2.6 (UN estimates). Per head, the world grows more wheat, rice and maize than it did in 1961, and a good deal more soya and palm oil.

{: .da-bridge}
A harvest is only half of the story. The other half is how much of it leaves the country where it grew.

<p class="da-part">Part II<strong>What moves</strong></p>

<h2 id="traded"><span class="num">07</span>What crosses a border</h2>

Take the tonnes that the trade statistics record as crossing a border in 2023 and divide by what the world harvested.

{% include fd.html kind="traded" title="Share of the world harvest that crosses a border, 2023" caption="Trade matrix tonnes (importer's report, exporter's where the importer is silent) divided by FAOSTAT production, for the 53 foods where the traded and the harvested good are the same product. Hover a bar (on a phone, touch it) for the history since 1986; before 1992 the Soviet Union, Yugoslavia and Czechoslovakia count as single countries, so the early years understate the trade." %}

{% include fd-concept.html id="f01_traded_share" %}

The picture is an inverted pyramid. **Lentils (86 %), cocoa beans (77 %), coffee (67 %) and palm oil (58 %) are mostly traded; soya beans are 46 %, wheat 25 %, maize 15 %, bananas 17 %, avocados 33 %, tomatoes 4 % and potatoes 5 %.** Foods that people in the producing country eat every day (potatoes, sweet potatoes, millet, yams, most vegetables) mostly stay home. What goes abroad are the crops the producing country does not eat much of, or cannot grow (coffee, cocoa), and the feed that the importing country needs for animals (soya).

It has moved: **soya beans went from 22 % traded in 1990 to 46 % in 2023, wheat from 15 % to 25 %, chicken from 5 % to 11 %**; maize barely moved (14 % to 15 %). Rice is not in the figure because the trade is recorded as milled rice and the harvest as unmilled paddy; about 53 million tonnes of rice were traded in 2023, with India the biggest seller (17.4 million tonnes, 33 % of world trade), ahead of Thailand (8.6), Vietnam (7.0) and Pakistan (3.7). The rice market is thin: a policy change in the biggest seller moves prices for everyone.

{: .da-bridge}
Who the sellers and buyers are, and which lanes carry the volume, takes a different kind of figure: one that follows the flow.

<h2 id="flows"><span class="num">08</span>How to read a trade flow</h2>

The source is the FAOSTAT *detailed trade matrix*, which records, for every reporting country, what it imported from or exported to each partner, in tonnes and in thousands of US dollars. Every transaction is therefore reported twice, once by each side, and the two reports rarely agree: freight and insurance are counted in the importer's value but not in the exporter's, shipments take weeks and straddle the New Year, and some countries do not report a partner. This article uses the **importer's report for the tonnes of a flow from one country to another, and the exporter's report where the importer says nothing about that partner**. Values are the same pick, in current US dollars.

The figure has two views. The **map** draws the biggest flows as arcs from seller to buyer, wider for more tonnes (or dollars), with the dashes running in the direction of the goods; blue circles are sellers, warm circles buyers. Pick a country in the *Focus* box, or click one on the map, and the map redraws as its own trade: *ships out* shows where it sells to, *buys in* where it buys from. The **matrix** puts the 12 biggest sellers in rows and the 12 biggest buyers in columns, with the remaining flows in "all other".

{% include fd.html kind="flow" comm="soy" focus="156" dir="imp" title="Who ships it to whom" caption="FAOSTAT detailed trade matrix, 2023: the 65 foods with a reported trade in the unit chosen. Tonnes are the buyer's report, the seller's where the buyer is silent; values are US dollars at the importer's report. Arcs are drawn from the 220 biggest flows of each food, which cover most of its trade." %}

{: .da-bridge}
Soya beans are the best first example, because the whole lane has one destination.

<h2 id="soy"><span class="num">09</span>Soya: a lane that ends in China</h2>

In the flow figure above, pick *Soya beans* and *China* (it opens that way) and read the right-hand list. In 2023 about 170 million tonnes of soya beans crossed a border, worth USD 98 billion, **the highest value of any of the 65 foods in the trade data, ahead of wheat (USD 67 billion), beef (64), maize (62) and palm oil (47)**. Brazil sold 58 % of those tonnes and the United States 28 %. And **China bought 103 million tonnes in FAO's matrix, 61 % of all the soya beans traded in the world** (China's own customs count is about 99 million tonnes; the matrix runs a few per cent above national figures here). Two lanes make up most of that: Brazil to China (72 million tonnes, 69 % of China's imports) and the United States to China (27 million tonnes, 26 %).

The reason is in the trough. Soya beans are crushed into oil and meal, and the meal is protein feed for pigs and chickens; section 03 showed that 84 % of the world's soya supply is processed. China's own harvest of 21 million tonnes is a fifth of what it buys. **China is the world's biggest buyer of the soya beans that Brazil and the United States grow, and no other country comes close**: the next on the list, Argentina, takes 10 million tonnes (mostly to crush and re-export as oil and meal), then Mexico with 4 million. A buyer that big can move prices and planting in the countries that sell to it.

{: .da-bridge}
Soya is a trade of the Americas and one importer. Wheat is the opposite: many sellers, many buyers, and one region whose harvest matters out of proportion.

<h2 id="wheat"><span class="num">10</span>Wheat: six sellers, 180 buyers</h2>

In 2023 about 198 million tonnes of wheat were traded, a quarter of the harvest. **Six sellers supplied 68 % of it: Russia (34.0 million tonnes, 17 %), Australia (28.9), Canada (25.8), the United States (17.2), Ukraine (14.5) and France (13.8).** The buyers are far more scattered, the biggest being Türkiye (11.9 million tonnes), China (11.9), Indonesia (10.9), Spain (9.7), Italy (9.0) and Egypt (8.2). No buyer takes more than about 6 % of the trade, and 180 countries bought some.

The matrix view shows the lanes that matter. Russia's wheat goes to Türkiye (9.0 million tonnes), Egypt (5.5), Kazakhstan, Pakistan and Saudi Arabia. **Egypt buys 8.2 million tonnes of wheat, and 5.5 million of them, two thirds, come from Russia**; Romania and Ukraine supply 1.0 million tonnes each. Counting all cereals, Egypt imports 17.1 million tonnes, 41 % of the grain it uses.

{% include fd.html kind="flow" comm="wheat" view="matrix" title="Wheat: the twelve biggest sellers and buyers" caption="FAOSTAT detailed trade matrix 2023, tonnes. Rows are sellers, columns buyers; the last column and row are totals; 'all other' is the rest of a seller's exports to countries outside the twelve." %}

One caution. The trade matrix puts Russian wheat exports in 2023 at 34 million tonnes. Estimates for the 2023/24 marketing year from USDA forecasts and from trade analysts are higher, from the mid-40s to over 50 million tonnes depending on the source and on what is counted. Part of the gap is calendar year against marketing year; the larger part is flows that no buyer reported to the matrix (reports say Russia stopped publishing detailed customs statistics in 2022, so the matrix leans on its partners' import reports). This is the reason the article treats the matrix as a good picture of the *pattern* and a rough guide to a single country's total.

{: .da-bridge}
Wheat is a grain with many buyers. The vegetable oils are a market with two sellers per product, and a war in one of them.

<h2 id="oils"><span class="num">11</span>Palm oil and sunflower oil</h2>

In the figure below, hover or click Indonesia to see where its oil goes. **Palm oil is one of the most concentrated big trades in the data, second only to soya beans on the seller side.** Indonesia and Malaysia sold 54 % and 30 % of the 46 million tonnes that crossed a border, 84 % between them (Brazil and the United States sold 86 % of the soya beans). The buyers are the big populations of South Asia and China: India took 9.4 million tonnes, China 5.7, Pakistan 3.0, the United States 1.9 and Bangladesh 1.6 (by the buyer's report).

{% include fd.html kind="flow" comm="palmoil" title="Palm oil: Indonesia and Malaysia against the rest" caption="FAOSTAT detailed trade matrix 2023." %}

**Sunflower oil is the Black Sea's product**: Ukraine sold 5.3 million tonnes of the 15.6 million traded (34 %) and Russia 3.2 million (21 %), 54 % between them, and the two countries also grow 54 % of the world's sunflower seed and make 58 % of its oil. Ukraine's biggest customers were India (1.2 million tonnes) and Türkiye (1.1 million), China, Spain and Italy. The market for the oil is therefore concentrated in a region at war, which is a statement about the map, not a forecast.

{: .da-bridge}
Oils go to the biggest populations. Coffee and cocoa go the other way, from the tropics to the temperate north.

<h2 id="tropics"><span class="num">12</span>Coffee, cocoa and bananas</h2>

**Two thirds of the green coffee crop is exported** (7.5 of 11.1 million tonnes), and the flows run along a single axis: Brazil (2.1 million tonnes, 29 % of the trade), Vietnam (1.5, 19 %) and Colombia (0.6, 8 %) sell, and the United States (1.3 million tonnes), Germany (1.0) and Italy (0.65) buy. Cocoa beans show the same shape: Côte d'Ivoire sold 37 % of the 4.0 million tonnes traded, and the top buyers are the Netherlands (0.9 million tonnes), Malaysia (0.5), Germany (0.4) and Belgium (0.3), which is where much of the world's cocoa is ground into butter and powder.

{% include fd.html kind="flow" comm="coffee" title="Coffee: from the tropics to the north" caption="Green coffee, FAOSTAT detailed trade matrix 2023. Roasted coffee and extracts are not included." %}

Bananas are the fresh-fruit version. **India grows more of them than anybody (27 % of the world's), but it is not among the three biggest sellers**: those are Ecuador (27 % of the 22.9 million tonnes traded), Guatemala (12 %) and Costa Rica (10 %), with the Philippines fourth here (FAO's own export table puts it third; its shipments are under-recorded in the partner-level matrix). Ecuador's two biggest lanes are Russia (1.4 million tonnes) and the United States (0.7 million). The difference between *where it grows* and *where it is shipped from* is the difference between a staple eaten at home and a commodity grown to be sold.

{: .da-bridge}
The flow maps show who sells. The mirror question is who has to buy, and what happens to a country that cannot grow enough.

<p class="da-part">Part III<strong>Who eats what</strong></p>

<h2 id="diet"><span class="num">13</span>Who buys the grain</h2>

Take a country's grain use, the harvest plus the imports minus the exports plus what it took out of stock, and ask what share was imported. That is the **cereal import dependency ratio**.

{% include fd.html kind="diet" title="How much grain a country buys from abroad, and what it eats" caption="FAO food balance sheets, latest year up to 2023. Cereal imports as a percentage of domestic cereal supply, capped at 100 % for the colours. Hover for numbers." %}

{% include fd-concept.html id="f02_import_dependency" %}

Among countries with more than 5 million people, **the ones that buy about 90 % or more of their grain are small, rich or dry**: the United Arab Emirates (116 %), Hong Kong (108 %), Oman (105 %), Saudi Arabia (97 %), Israel (93 %), Malaysia (92 %), Lebanon (87 %) and tropical or island economies such as Liberia, Congo and Papua New Guinea. Belgium (161 %), the Netherlands (129 %) and Portugal (109 %) exceed 100 % because grain is landed there and leaves again, as feed, flour and re-exports. **At the other end: India buys 0.3 % of its grain, Argentina 1 %, Russia 1 %, Ukraine 2 % and Myanmar 2 %.** Egypt is in the middle at 41 %, but with a population of 115 million.

A high ratio is not a problem in itself: the Netherlands and the Gulf states are rich and buy from many places. It becomes a risk when it comes with few suppliers and little money to bid in a bad year; the data here show the dependence, not the suppliers or the money.

{: .da-bridge}
Every figure so far is a slice of the same data. The last figure puts the slices back together, for one country at a time.

<h2 id="country"><span class="num">14</span>Open any country</h2>

Choose a country to see what it grows (with its share of the world harvest and its rank where it is among the top three), what it sells and buys abroad by value, and what its people eat.

{% include fd.html kind="country" sel="76" title="One country, four views" caption="FAOSTAT production, trade matrix and food balance sheets, 2023. 'What it sells' and 'what it buys' are the 65 foods in the trade data only, ranked by US dollars; they are not the country's whole agricultural trade." %}

Try three. **Brazil** sells soya beans (USD 56 billion), sugar (17 billion) and maize (16 billion), and buys wheat, milk powder and olive oil. **The Netherlands**, a small country on the delta of three rivers, sells cheese (USD 5.5 billion), beef (3.3 billion) and pork (3.1 billion) and buys beef (2.4 billion), cocoa (2.4 billion) and soya beans (2.1 billion): it is a trading and processing hub more than a farm. **India** sells rice (USD 11 billion), sugar (4.2 billion) and beef (3.2 billion, mostly buffalo) and buys palm oil (8.8 billion), soya bean oil (4.0 billion) and sunflower oil (3.4 billion): the world's most populous country is self-sufficient in grain and dependent on others for cooking oil.

{: .da-bridge}
Those sentences are as strong as the data behind them. The last section says where the data are weak.

<h2 id="limits"><span class="num">15</span>What the numbers cannot tell you</h2>

- **Mass is not value is not calories.** Tonnes of harvested product are the common currency, which makes cane look like the biggest food and coffee look tiny. Two figures use calories and dollars instead; the rest do not.
- **The 69 foods are a choice.** They cover most of the weight of what people eat and the main traded commodities, but fish and seafood are missing from the production and trade figures (FAOSTAT's crop and livestock tables do not cover them; fish appears only in the calories of the food balances), as are most processed foods (bread, chocolate, noodles), sugar crops except as sugar, spices except pepper and ginger, and most fruits and vegetables under "other". Cotton, tobacco, rubber and fibre crops are left out because they are not food.
- **Production is partly estimated.** FAO collects most figures from national statistics offices and fills gaps by imputation, and the most recent year, 2024, is mostly an estimate. The headline year here is 2023 for that reason. Countries' own figures can be revised years later.
- **Hen eggs of 14 countries are published in pieces and converted to tonnes here** at the world average mass per egg, because several EU members report only numbers. The sum of the countries is 1 % below FAO's own world total for eggs (3 % for honey, where the world row includes countries with no 2023 country row); shares are computed on the sum of the countries.
- **Some national figures look implausible, and the article reproduces them.** FAO's table has the Central African Republic at 316,000 tonnes of coffee in 2023, flagged as an official figure, which puts it tenth in the world and is far above what trade sources suggest for that country. Check an outlier before you build on it.
- **Trade is recorded twice, and not consistently.** The article takes the buyer's tonnes where there are any and the seller's otherwise; the matrix then misses flows with an unspecified partner and is lower than some national sources for the biggest sellers (the Russian wheat example above). Re-exports are counted at each crossing, so a hub's imports can exceed its use.
- **Rice, sugar, nuts, beef, pork, cheese and cassava are traded in a different form** than they are harvested (milled against paddy, boneless against carcass weight, refined against raw, dried against fresh). Their traded tonnes are shown but not compared with production.
- **Food balance sheets are a supply, not an intake.** The calories are what is available, before waste in shops and kitchens, so the high figures for the United States and Belgium say more about how much food is on offer than about how much people eat. FAO publishes no balance for Japan, Sudan, Mali, Chad, North Korea, Singapore and 14 others in 2019 to 2023, so they are white on the diet map.
- **Time series have breaks.** FAO switched tea from made tea to green leaf in 1991, so its time machine starts there. The Soviet Union, Yugoslavia and Czechoslovakia split in the early 1990s, which turns trade between their parts into international trade and inflates the share traded of the early years.
- **Borders and names are FAO's.** China means the mainland; Hong Kong, Macao and Taiwan Province are separate; Kosovo is not listed separately (it is inside Serbia's blank on the map); Western Sahara and Greenland are drawn but have no data; very small states (Singapore, Malta, the Pacific islands) are in the rankings but too small to be seen on the map.

{: .da-bridge}
Behind every figure is the same three FAO tables; the last section names them and says how they were used.

For anything that matters, go to the original sources below. The article is generated by a script (`bin/food_article/` in this site's repository), which downloads the data, merges them and writes the files the figures read.

<h2 id="sources"><span class="num">16</span>Sources</h2>

<div class="da-note" markdown="1">
**Data.** All statistics were downloaded on 19 October 2026 from FAO's bulk-download service and processed by me with Claude's help. The figures here are that processing, not an FAO product, and FAO has not endorsed it. FAO's statistical databases are published under [CC BY 4.0](https://www.fao.org/contact-us/terms/db-terms-of-use/en/); the citations in FAO's prescribed form are:

- FAO. 2025. FAOSTAT: Crops and livestock products (QCL), updated 31 December 2025. Accessed on 19 October 2026. [fao.org/faostat/en/#data/QCL](https://www.fao.org/faostat/en/#data/QCL). Licence: CC-BY-4.0.
- FAO. 2025. FAOSTAT: Detailed trade matrix (TM), updated 23 December 2025. Accessed on 19 October 2026. [fao.org/faostat/en/#data/TM](https://www.fao.org/faostat/en/#data/TM). Licence: CC-BY-4.0.
- FAO. 2025. FAOSTAT: Food balances, 2010– (FBS), updated 28 October 2025. Accessed on 19 October 2026. [fao.org/faostat/en/#data/FBS](https://www.fao.org/faostat/en/#data/FBS). Licence: CC-BY-4.0.
- **Borders:** [Natural Earth](https://www.naturalearthdata.com), 1:50m admin-0 countries, public domain; Equal Earth projection by Šavrič, Patterson and Jenny (2018).
- **Units:** Mt = million tonnes, kt = thousand tonnes; kcal = kilocalories; USD = current US dollars.
</div>

</article>

<script defer src="{{ '/assets/js/concepts.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/da-guide.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/food-explorer.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
