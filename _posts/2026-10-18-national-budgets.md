---
layout: default
title: What a national budget is, and where 33 countries spend it
description: What a national budget really is, how governments raise money and what they spend it on, taken apart for 33 countries from the United States and China to Norway, Ukraine and Indonesia. With the data of the IMF, Eurostat, the OECD and SIPRI, absolute dollar amounts, a flow chart, a deep-dive explorer, a time machine and a section on government bonds.
date: 2026-10-18
tags: [public-finance, budgets, data]
image: /assets/blog-thumbs/budget.webp
categories: [long-read]
read_time: 50 # the word count does not include the interactive figures
---
{%- assign data = '/assets/budget-article/' | relative_url -%}
<article class="da bud" markdown="1" data-stations="off" data-brand="National budgets" data-brand-sub="what they are, who spends what · a long read" data-contact="https://www.linkedin.com/in/niklas-abraham-05983b247">

<p class="da-eyebrow">Blog · Long read · 33 countries, 21 interactive figures</p>
<h1 class="da-title">What a national budget is, and where 33 countries spend it</h1>
<p class="da-lede">A budget is the most honest document a state writes about itself: it says what the government takes, what it pays for and what it borrows. This is a guided tour of how that works, followed by a fact-by-fact dissection of who spends what on what, from Finland's pensions to Ukraine's war and China's infrastructure.</p>
<p class="da-meta">Written by an AI, published by Niklas Abraham · 18 October 2026 · about 50 minutes · 33 countries, data up to 2024 and 2025 · 21 interactive figures</p>

<div class="da-note ai-note" markdown="1">
**This article was written by an AI.** I am curious about national budgets, so I asked Claude (an AI model from Anthropic) to research, write and code this article to help me learn more. All numbers come from public statistics (IMF, Eurostat, OECD, World Bank, SIPRI; see [Sources](#sources)) and the figures are computed from them by script. In the section on bonds, facts that come from outside the dataset (auctions, central-bank decisions, news) carry tags such as <sup class="bd-ref"><a href="#rb-mof-jgb">[MoF JGB holders]</a></sup> that lead to the reference list in [Sources](#sources), marked primary, opened or snippet (where I saw only a search result, the number is "as reported"). The prose may contain mistakes, and statistical definitions hide traps ([last section](#limits)), so check what you rely on at its source. If you find an error, [message me on LinkedIn](https://www.linkedin.com/in/niklas-abraham-05983b247). Nothing here is investment, tax, legal or policy advice.
</div>

**The question.** Every year, governments collect between a sixth and well over half of everything their countries produce, and then spend it. Who decides how much, where does the money come from, and what does it buy? The answers differ enormously. In the data used here, the general government of Finland (all levels: state, regions, municipalities and social-insurance funds) spends 57.7 % of its GDP and that of Indonesia 16.8 %. A pension is the biggest item in most budgets, but a war is the biggest item in Ukraine's, health is the biggest in the United States', and in China it is economic affairs, the umbrella for roads, rail, energy and industry policy.

The article has five parts and is built so that each figure can be played with.

1. **What a budget is.** The three things the word means, the vocabulary of revenue, spending, deficit and debt, and the classification the rest of the article relies on.
2. **The money in.** How big states are, and where their revenue comes from.
3. **The money out.** The big picture for 33 countries, then pensions, health, education, defence, interest, economic affairs and the economic anatomy of spending, with a deep-dive explorer.
4. **Over time, and the balance.** What changed since 2007, who runs deficits and who carries debt, and how a deficit is financed by selling bonds.
5. **Thirty-three profiles, and the limits.** One computed card per country, and an honest list of what the numbers cannot tell you.

<nav class="da-toc" markdown="0">
<span class="lbl">Contents</span>
<ol>
<li><a href="#meaning">Three things called a budget</a></li>
<li><a href="#dollars">In dollars: who spends how much</a></li>
<li><a href="#ledger">The ledger: revenue, spending, balance, debt</a></li>
<li><a href="#cofog">Ten purposes: how spending is classified</a></li>
<li><a href="#size">How big is the state?</a></li>
<li><a href="#revenue">Where the money comes from</a></li>
<li><a href="#flow">One year in one picture</a></li>
<li><a href="#purposes">Eight purposes, 30 countries</a></li>
<li><a href="#social">Social protection: pensions, mostly</a></li>
<li><a href="#health">Health</a></li>
<li><a href="#education">Education</a></li>
<li><a href="#defence">Defence</a></li>
<li><a href="#interest">Interest: paying for the past</a></li>
<li><a href="#economic">Economic affairs: the China exception</a></li>
<li><a href="#anatomy">Wages, benefits, subsidies: what the money becomes</a></li>
<li><a href="#deep">Open any budget</a></li>
<li><a href="#time">The time machine</a></li>
<li><a href="#balance">Deficits and debt</a></li>
<li><a href="#bonds">Bonds: how a deficit gets financed</a></li>
<li><a href="#profiles">Thirty-three profiles</a></li>
<li><a href="#limits">What the numbers cannot tell you</a></li>
<li><a href="#sources">Sources</a></li>
</ol>
</nav>

<p class="da-part">Part I<strong>What a budget is</strong></p>

<h2 id="meaning"><span class="num">01</span>Three things called a budget</h2>

"The national budget" is used for three different things, and most confusion about public finance comes from mixing them up.

**A budget is a law.** In most countries the government proposes, the parliament amends and approves, and the approved text authorises the executive to spend up to a limit on each purpose and to collect taxes at stated rates. In the United States the President proposes and Congress writes the spending bills, called appropriations; in a parliamentary system such as Germany's or the United Kingdom's the government's majority normally carries its own budget through the chamber. The fiscal year to which the law applies is not the calendar year everywhere. The United States starts it on 1 October, Australia on 1 July, the United Kingdom, Japan, India, Canada, Singapore and South Africa on 1 April, and most of continental Europe, Mexico and China use the calendar year.

**A budget is a plan.** The law is a forecast of revenue and a promise of spending. Reality departs from it: growth disappoints, a pandemic arrives, a war starts, so there are supplementary budgets, and the final accounts differ from the plan.

**A budget is a statistic.** Statisticians do not care what was authorised. They record what was actually received and paid, by everyone who spends public money, and classify it so that countries can be compared. This article uses only the third meaning. Everything in the figures is outturn, money that was actually spent or collected as reported to the IMF, Eurostat and the OECD, except the 2025 values of the IMF's World Economic Outlook, which are estimates.

That choice has a consequence. A country's headline "budget" usually means the **central government**: ministries, agencies and the funds they control. But a great deal of public money is spent by regions, municipalities and social-insurance funds. Statisticians therefore add all of them into one sector, **general government** (code S13 in the international national-accounts standard), and remove transfers between its parts so that nothing is counted twice. Whenever this article says "the government spent", it means general government. That is the convention of every spending-by-purpose, revenue-source and economic-type figure in the latest year of data; the exceptions are Thailand before 2013, which reports central government only, and the figures that say "central government only" explicitly. The headline series (revenue, expenditure, balance, debt) are the IMF's World Economic Outlook, whose coverage varies by country: for Saudi Arabia and South Africa it is visibly narrower than the all-levels statement of operations, so the profiles pair figures that are not always on the same footing (see [the limits](#limits)). Amounts are shares of GDP unless a figure says dollars. **Central is not federal either**: Germany's federal budget is about €480 billion, while the IMF's central-government sector for Germany ($0.70 trillion, about €650 billion) adds extra budgets and is a third number, and the all-levels total is about $2.3 trillion (49 % of GDP).

{: .da-bridge}
Whatever the level, the arithmetic is the same: money in, money out, and the difference.

<h2 id="dollars"><span class="num">02</span>In dollars: who spends how much</h2>

Almost everything after this section is measured as a share of GDP, because that is the fair way to compare a small state with a large one. It hides something, though: how large the sums are. And it needs one warning first. As [section 01](#meaning) said, this article adds up **all levels of government**: federal, regional, municipal and the social-insurance funds. That is why Germany shows up with $2.3 trillion below, not with the roughly €480 billion of the federal budget that the news talks about. The switch "Central government only" shows the national level instead, as the IMF defines it. That definition is not uniform: for most countries it excludes the social-insurance funds (Germany, France, Spain), for the United States the IMF reports only a version that includes the social-security funds, in China and Switzerland it leaves out most public spending, and in the United Kingdom it is almost identical to the all-levels figure. The view is missing for Canada, India, Saudi Arabia, Mexico and South Korea (no central series from 2020 on), and for revenue, debt, interest and military spending it shows the same bars as the all-levels view. In it the United States spends $7.4 trillion, about two thirds of its all-levels total, but that includes Social Security and Medicare, which Germany's central figure does not. Treat the central view as one country at a time, not as a league table.

Thirty of the 33 countries have a full breakdown of spending by purpose. Together they spent about $35 trillion across all levels in their latest year of data, and four of them account for 61 % of it: the United States ($11.6 trillion, 33 %), China ($5.9 trillion, 17 %), Germany ($2.3 trillion, 7 %) and France ($1.8 trillion, 5 %). Choose a measure below; click a bar to pit that country against another figure.

{% include bx.html kind="dollars" title="What governments spend, in dollars" caption="Spending, revenue and debt as the share of GDP of this article's data (IMF, Eurostat, OECD) times GDP in current US dollars (IMF WEO, data of 28–29 September 2026); military spending in current dollars from SIPRI. Latest year per country, mostly 2024. Market exchange rates: they understate what China or India can buy at home, where prices are lower." %}

Some comparisons the dollars make possible (COFOG, latest year per country, mostly 2024; market exchange rates):

- **American defence is bigger than the national budget of most large countries.** At $913 billion it exceeds the central-government spending, in the IMF's definition, of Germany ($0.70 trillion), France ($0.72 trillion, 2023), Italy ($0.78 trillion) and Japan ($0.78 trillion; none of them includes all social insurance on the same terms as the American figure), and it matches the whole spending of Canada at all levels ($907 billion). Counting all levels of government, it is larger than the entire spending of 22 of the other 29 countries, Spain ($784 billion), Australia ($755 billion), South Korea ($657 billion) and Türkiye ($552 billion) among them. Germany's all-levels total of $2.3 trillion is two and a half times American defence; American *health* spending ($3.0 trillion) is larger still.
- **One purpose can outweigh a whole government.** American education spending ($1.6 trillion, federal, state and local) is more than the entire all-levels budget of Italy ($1.2 trillion) or Brazil ($1.0 trillion).
- **China's defence is a quarter of America's** on the COFOG measure ($238 billion against $913 billion), and a third on SIPRI's wider one ($336 billion against $954 billion in 2025). Germany's SIPRI figure is $114 billion.
- **Interest can overtake defence.** The United Kingdom paid $110 billion in interest (all levels, economic-type table) and $85 billion for defence (COFOG). Germany is the counter-case: $52 billion in interest against $63 billion for defence.

Three cautions. Which level you count changes the answer by a factor of three or more, so always ask what "the budget" in a headline includes. Dollars at market exchange rates move with currencies: when the dollar rises, every other country shrinks on this page without a single cut. And the sums do not buy the same everywhere: wages and prices differ enormously, so a dollar goes much further in Indonesia than in Switzerland. That is why the rest of the article switches to shares of GDP, and why [section 03](#ledger) defines spending per person in purchasing-power dollars.

{: .da-bridge}
Absolute sums say who is big. To say what a government does, the money has to be split into purposes, and first the four quantities that tie it together.

<h2 id="ledger"><span class="num">03</span>The ledger: revenue, spending, balance, debt</h2>

Four quantities carry the whole story.

- **Revenue** is what the government receives: taxes (on income and profits, on goods and services, on property), social-insurance contributions, and everything else (dividends, royalties on oil and gas, fees, grants from abroad).
- **Spending**, in the statisticians' wording **expenditure**, is what it pays out: wages, purchases, interest, subsidies, benefits and investment.
- **The balance** is revenue minus expenditure. Positive is a surplus, negative a deficit.
- **Debt** is the stock of everything borrowed and not yet repaid. A deficit adds to it; a surplus reduces it.

To compare countries of different size, everything is divided by **GDP**, the value of what the economy produces in a year, so that "spending is 48.8 % of GDP" means the government spends 48.8 cents of each euro the economy produces. To compare living standards, spending can also be expressed **per person** in "PPP dollars", which correct for differences in local price levels so that one dollar buys roughly the same basket everywhere:

$$
\text{spending per person (PPP \$)} \;=\; \frac{\text{spending as \% of GDP}}{100} \times \text{GDP per person (PPP \$)}
$$

Debt follows from the balance in a way that is worth knowing, because it explains why interest rates matter so much for the figures later on. Let $d_t$ be debt as a share of GDP, $r$ the average interest rate the government pays, $g$ the growth rate of nominal GDP and $pb_t$ the **primary balance**, revenue minus all expenditure except interest, as a share of GDP. Then

$$
d_t \;=\; d_{t-1}\,\frac{1+r}{1+g} \;-\; pb_t .
$$

If the economy grows as fast as the interest rate ($r = g$), the debt ratio changes only by the primary balance: a country that balances its non-interest budget keeps its debt ratio constant. If $r > g$, the debt grows on its own, and a primary surplus is needed just to stand still. The more debt a country already carries, the more it matters whether $r$ is below or above $g$. This is why Brazil, which pays an implied 9.5 % on its debt, and Japan, which pays 0.7 %, can have such different fiscal lives, as [the section on interest](#interest) shows.

{: .da-bridge}
Revenue, spending and debt describe the whole. To say what the government does with the money, they need a classification, and there is a standard one.

<h2 id="cofog"><span class="num">04</span>Ten purposes: how spending is classified</h2>

There are three ways to cut spending, and the article uses all three.

**By purpose.** The international standard is COFOG, the Classification of the Functions of Government, maintained by the United Nations and used by the IMF, Eurostat and the OECD. It sorts every euro of general-government spending into one of ten divisions, and each division into sub-groups (the "deep dive" below opens them). The purpose view answers *what for?*

| Code | Division | What is in it |
|---|---|---|
| 01 | General public services | Parliament, finance and foreign ministries, tax collection, basic research, **interest on public debt** |
| 02 | Defence | Armed forces, military aid, civil defence, defence research |
| 03 | Public order and safety | Police, fire brigades, courts, prisons |
| 04 | Economic affairs | Transport, energy, agriculture, industry policy, labour-market administration |
| 05 | Environmental protection | Waste, waste water, pollution abatement, nature |
| 06 | Housing and community amenities | Housing development, water supply, street lighting |
| 07 | Health | Hospitals, doctors, medical products, public health programmes |
| 08 | Recreation, culture and religion | Sport, museums, libraries, public broadcasting |
| 09 | Education | Schools, universities, school meals and transport |
| 10 | Social protection | **Pensions**, sickness, disability, family and unemployment benefits |

**By economic type.** The other cut asks *what kind of payment?*: wages of government employees, purchases of goods and services, interest, subsidies, social benefits, investment. A hospital's budget appears under Health in the first cut and splits into wages, medicines and building work in the second.

**By revenue source.** The third asks where the money came from: income taxes, taxes on goods and services, social contributions, other taxes, other revenue.

Two details of COFOG matter in what follows. First, interest on debt sits in division 01, which is why general public services look huge in highly indebted countries and in a few special cases. Second, COFOG counts what *government* does. If a country finances its health care through compulsory private insurance, as Switzerland does, the spending is real but does not appear in the government's Health line. The data later show it: Switzerland's government spends 2.3 % of GDP on health, about a quarter of what France's does, without Swiss people being sicker or less cared for.

For the colours of the figures the ten divisions are folded into eight groups, because a chart can keep only so many colours apart: environment, housing and culture (05, 06, 08) share one colour. The deep dive shows all ten.

{: .da-bridge}
That is all the vocabulary needed. First the question of scale: how much of an economy does the state take?

<p class="da-part">Part II<strong>The money in</strong></p>

<h2 id="size"><span class="num">05</span>How big is the state?</h2>

The figure shows total spending in each country's latest year of data, as a share of GDP, split into the eight groups. It can be re-sorted and switched to other measures: *% of total* turns every bar into a share of the whole, *PPP $ per person* converts it into money per head, and *show* changes the cut to spending by economic type or revenue by source. Hover a bar for the numbers, click a country's name to open it in [the deep dive](#deep).

{% include bx.html kind="stack" title="Government spending by purpose, 30 countries" ctrl="view,metric,sort" caption="Latest year of data per country: 2024 for most, 2023 for Ukraine, South Korea and Indonesia, 2025 for Türkiye, 2020 for Russia. General government, COFOG divisions. Sources: IMF GFS (COFOG), Eurostat, OECD; GDP and GDP per person from the IMF World Economic Outlook database, data of 28–29 September 2026." %}

Some facts the bars make visible.

- **The range is large.** The median country of the 30 spends 42.8 % of GDP. At the top are Ukraine (73.5 % in 2023, at war), Finland (57.7 %), France (57.0 %), Italy (50.2 %) and Sweden (50.1 %). At the bottom are Indonesia (16.8 %), the United Arab Emirates (21.3 %), Ireland (22.4 %), Thailand (22.5 %) and Singapore (25.2 %). China is at 31.0 %, the United States at 39.6 %, Japan at 40.2 %, the United Kingdom at 46.7 %, Germany at 48.8 %.
- **Riches do not predict size.** Among 28 countries (leaving out Ukraine and Ireland, whose ratios are distorted by war and by multinationals' profits) the rank correlation between GDP per person and the share of GDP spent by government is 0.16, close to none. Switzerland and the United States are rich and spend little; Finland and France spend a lot at similar income. How much of the economy to pass through the public sector is a political choice, not a development stage.
- **Ireland is a statistical illusion.** Irish GDP includes the profits booked there by multinationals, which inflates the denominator. Every Irish ratio to GDP, including this 22.4 %, is therefore smaller than it would be against a measure of what Irish residents earn. This affects the whole article.
- **In money, the ordering changes.** In PPP dollars per person, Norway is first at \$53,334, followed by Singapore (\$38,588), Denmark, Finland, France, the Netherlands, Sweden and Germany (\$35,512). Indonesia spends \$2,623 per head, one twentieth of Norway.
- **In absolute dollars, only two states are in a different league.** At market exchange rates, the general government of the United States spent about \$11.6 trillion in 2024 and China's about \$5.9 trillion; Germany, France, the United Kingdom and Japan each between \$1.7 and \$2.3 trillion.

{: .da-bridge}
Spending has to be funded. Where does the money come from, and is it the same everywhere?

<h2 id="revenue"><span class="num">06</span>Where the money comes from</h2>

The figure below splits the money in by source. Clicking a source in the legend lines it up at the left edge and sorts by it, which is the fastest way to see how different countries are.

{% include bx.html kind="stack" title="Government revenue by source, 32 countries" view="rev" ctrl="metric,sort" sort="inc" caption="Revenue as % of GDP, latest year with a breakdown per country. 'Other revenue' is mostly property income (including oil and gas royalties and dividends), grants and fees. IMF Government Finance Statistics, statement of operations." %}

Revenue per GDP in 2024 ran from 14.6 % in Indonesia, 18.0 % in Singapore and 21.4 % in India to 53.4 % in Finland, 59.8 % in Norway (the IMF's World Economic Outlook figures; the median of the 33 is 35.7 %). The composition tells more than the total.

- **Denmark lives on income tax.** Income and profit taxes are 60 % of Danish revenue, 30.5 % of GDP, and social contributions are almost nothing: Danish pensions and health care are financed from general taxes, not from payroll insurance.
- **Germany, Japan, France and Poland live on payroll insurance.** Social contributions are 38 % of German revenue (17.5 % of GDP), 36 % in Japan, 35 % in Poland and 33 % in France, against 22 % in the United States and 1 % in Denmark. This is the two classic ways of funding a welfare state: through the tax system, or through earmarked insurance.
- **The United States has no national consumption tax.** Taxes on goods and services are 13 % of American general-government revenue (3.9 % of GDP, collected by states and cities as sales taxes and by Washington as excises), against 21 % in Germany, 29 % in Britain and 34 to 42 % in Türkiye, China, Brazil, Indonesia and Thailand. Poorer countries lean on taxes that are cheap to collect, which means taxes on sales and imports; income taxes require records of income.
- **Oil states live on something else.** For Saudi Arabia, 66 % of revenue (21.2 % of GDP) is "other revenue", which is mostly oil, while income taxes yield 0.7 % of GDP. In Norway "other revenue" is 35 % of the total, 21.3 % of GDP, and is what lifts Norwegian revenue to 61.6 % of GDP in the statement of operations (59.8 % in the IMF's outlook).
- **Australia, Denmark and Ireland get a large share of revenue from income taxes** (51 %, 60 % and 44 %), Brazil and Thailand a small one (23 % and 29 %).

{: .da-bridge}
Between revenue and spending sits the government itself. One figure can show the whole machine for any country: money in on the left, money out on the right, borrowing where the two disagree.

<h2 id="flow"><span class="num">07</span>One year in one picture</h2>

Pick a country. The width of every ribbon is the share of GDP it carries. The pillar in the middle is the government; revenue flows in from the left, purposes flow out to the right, and a hatched block marks borrowing when the government spends more than it receives (or a surplus when it receives more).

{% include bx.html kind="flow" title="Money in, money out" country="DEU" caption="Revenue: IMF GFS statement of operations. Spending: COFOG. The hatched block is spending minus revenue, so it can differ from the officially reported net borrowing, which comes from another table: by several points of GDP in the United States, the United Kingdom, Canada, Singapore and South Africa, where COFOG counts items the statement of operations does not, and in Australia, where the two series are from different years. Read the hatched block as a rough gap, not as the deficit." %}

For Germany in 2024, the picture reads like this. Revenue was 46.1 % of GDP: social contributions 17.5 %, income taxes 12.4 %, taxes on goods and services 9.8 %, other revenue 5.4 % and other taxes 1.1 %. Spending was 48.8 %: social protection 20.1 %, health 7.5 %, general public services 6.3 %, economic affairs 5.3 %, education 4.4 %, environment, housing and culture 2.1 %, public order 1.6 % and defence 1.3 %. The gap, 2.6 percentage points of GDP, was financed by borrowing. Try Norway, whose ribbons show a surplus fed by oil, then Brazil and Ukraine.

{: .da-bridge}
The big picture is now visible for one country. The next step is to put all of them next to each other, and to look at one purpose at a time.

<p class="da-part">Part III<strong>The money out</strong></p>

<h2 id="purposes"><span class="num">08</span>Eight purposes, 30 countries</h2>

The figure below shows how each country splits the same euro, as shares of the budget; switch to *% of GDP* for the absolute weight. The legend buttons beneath the chart re-sort by one purpose and push it to the left edge, so that you can compare it across countries without the clutter of the rest.

{% include bx.html kind="stack" title="What each country spends on, as a share of its budget" metric="share" ctrl="metric,sort" sort="soc" caption="Same data as above, as shares of each country's total spending. Click a colour in the legend to line that purpose up at the left." %}

The first fact is a simple ranking of what comes first. **Social protection is the largest purpose in 22 of the 30 countries.** In five (the United Arab Emirates, South Africa, Indonesia, Thailand and Singapore) it is general public services, which includes interest. In the remaining three it is something particular: health in the United States, defence in Ukraine and economic affairs in China. That is nearly the whole map of exceptions.

{: .da-bridge}
Because social protection dominates, it deserves a closer look first, and what is inside it is mostly one thing.

<h2 id="social"><span class="num">09</span>Social protection: pensions, mostly</h2>

{% include bx.html kind="stack" title="Social protection, the largest purpose almost everywhere" focus="soc" sort="soc" ctrl="metric" caption="Social protection (COFOG 10) first in every bar, the rest of the budget behind it. Switch the measure to see it per person." %}

Social protection takes 26.4 % of Finland's GDP, 23.6 % of France's, 21.2 % of Italy's and 20.1 % of Germany's. In the United States it takes 7.8 %, in China 8.1 %, in Indonesia 1.3 % and in Singapore 1.1 %. The gap is between the welfare states of Europe and Japan on one side and everyone else on the other.

What is inside? Open any country in [the deep dive](#deep): in most of them the largest sub-group is **old age**, which is pensions. Old-age spending is 15.5 % of GDP in Finland, 13.9 % in Italy, 13.4 % in France, 11.8 % in Greece, 10.8 % in Poland, 10.7 % in Japan and 9.7 % in Germany. In Italy it is 27.6 % of everything the government spends: more than one euro in four is an old-age pension. That is why the age structure of a population, not any decision in the current year, explains so much of the differences between the bars. (The IMF series has no breakdown below social protection for the United States, so it is missing from this list.) Ukraine, in 2023, spent 10.5 % of its GDP on old-age benefits, nearly as much as Japan's 10.7 %.

{: .da-bridge}
The second-largest purpose in many countries is the one the United States leads.

<h2 id="health"><span class="num">10</span>Health</h2>

{% include bx.html kind="stack" title="Government health spending" focus="hea" sort="hea" metric="pc" ctrl="metric" caption="Health (COFOG 07) first in every bar. The default measure is PPP dollars per person." %}

The United States government spends **10.3 % of GDP on health**, the highest of the 30 and 26.0 % of the whole budget, through Medicare, Medicaid and veterans' care. France and the United Kingdom spend 8.9 %, Canada 8.8 %, Norway 8.2 %, Denmark and Australia 8.1 %. In PPP dollars per person the American government pays \$8,883, slightly above Norway's \$8,858 and well above France (\$5,737), Canada (\$5,685) and Britain (\$5,639). That is *public* money only; a large part of American health spending is private and is not in this figure at all, nor are the private insurance premiums that fund health care in Switzerland.

At the other end, Indonesia's government spends 1.4 % of GDP on health, Thailand's 1.7 %, Switzerland's 2.3 % (private insurance), Singapore's 2.5 %, the Emirates' 2.7 % and China's 3.1 %. In dollars per person the contrast is stark: \$225 in Indonesia, \$416 in Thailand, \$684 in South Africa, against \$5,000 to \$9,000 in the richest countries. A low public number can mean a poor state or a private system; the data alone cannot say which.

{: .da-bridge}
Health is a recurring cost. Education is an investment that returns years later, and countries differ about as much.

<h2 id="education"><span class="num">11</span>Education</h2>

{% include bx.html kind="stack" title="Government education spending" focus="edu" sort="edu" ctrl="metric" caption="Education (COFOG 09) first in every bar, all levels from pre-primary to tertiary." %}

The highest share of GDP belongs to a middle-income country: **South Africa, 8.3 % of GDP and 20.5 % of its budget**, followed by Sweden (7.2 %), Israel (6.5 %), Finland (6.3 %), Australia (5.9 %), the United States and Poland (both 5.6 %). The lowest are the Emirates (1.3 %), Indonesia (2.4 %), Singapore (2.4 %), Thailand (2.6 %), Ireland (2.7 %), Japan and China (both 3.2 %).

South Africa's high share is partly a political priority and partly arithmetic: a ratio to GDP is large when GDP per person is small. Per person in PPP dollars the order is Sweden (\$5,212), Norway (\$5,210), Switzerland (\$4,867) and the United States (\$4,835) at the top, and South Africa is far below at about \$1,300. The two measures answer different questions: *how much of its economy does the country devote to schools?* and *how much money does it put in front of each pupil?*

{: .da-bridge}
Of all purposes, the one that has changed most since 2021 is the one the budget statistics are slowest to show.

<h2 id="defence"><span class="num">12</span>Defence</h2>

Two sources describe defence spending, and they differ by definition, so both are used. **COFOG** counts defence as one of ten functions of government, which is what the other figures use. **SIPRI**, the Stockholm International Peace Research Institute, publishes a military-expenditure series that is the standard one for defence debates, includes things such as military pensions and paramilitary forces, and is available for all 33 countries up to 2025. For Germany in 2024, SIPRI says 1.84 % of GDP and COFOG 1.33 %; for Spain 1.46 % against 0.89 %; for China 1.66 % against 1.26 %. For Japan, South Korea and Norway the two nearly coincide. When they disagree, the definitions are the first suspect.

{% include bx.html kind="stack" title="Defence in the budget (COFOG)" focus="def" sort="def" metric="gdp" ctrl="metric" caption="Defence (COFOG 02) first in every bar, latest year of data per country. Russia is 2020, before the invasion of Ukraine; Ukraine is 2023." %}

By COFOG the largest military budgets relative to GDP are **Ukraine's (31.6 % of GDP in 2023, 43.1 % of everything the state spent)** and **Israel's (9.0 %, one euro in five)**, followed by the United States (3.1 %), Singapore (3.0 %), Poland (2.9 %), South Korea (2.5 % in 2023), Australia and the United Kingdom (2.3 %). The smallest are Ireland's (0.1 %) and Brazil's (0.5 %).

The newer picture is in the SIPRI series. The figure below shows it. In 2025, SIPRI via the World Bank has Ukraine at 39.6 % of GDP, Israel at 7.8 %, Russia at 7.5 % (3.6 % in 2021), Saudi Arabia at 6.5 %, Poland at 4.5 % (2.2 % in 2021), Norway at 3.3 % (1.7 %), Denmark at 3.3 % (1.3 %) and the United States at 3.1 %. Among the large spenders the ratio fell only in the United States (3.4 % in 2021) and, slightly, in India (2.5 % to 2.3 %). Germany went from 1.3 % to 2.3 %, Finland from 1.3 % to 2.6 %, Sweden from 1.2 % to 2.5 %. In absolute terms the World Bank's SIPRI series puts the United States at about \$1,005 billion in 2024, China at \$312 billion, Russia at \$149 billion, and the United Kingdom, Germany, India and Saudi Arabia between \$80 and \$90 billion each. Behind much of the European rise is the commitment NATO members made in June 2025 to raise defence-related spending to 5 % of GDP by 2035, 3.5 % of it for core defence.

{% include bx.html kind="lines" title="Military spending since 2007, % of GDP" fn="MIL" countries="USA,RUS,POL,DEU,CHN,ISR" caption="SIPRI Military Expenditure Database via the World Bank (MS.MIL.XPND.GD.ZS), 32 of the 33 countries to 2025 (the series of the United Arab Emirates ends in 2014), from 2007. Add any country from the menu; change 'what' to switch to a COFOG purpose from the budget statistics." %}

{: .da-bridge}
Defence buys security for the future. The next item pays for the past: interest.

<h2 id="interest"><span class="num">13</span>Interest: paying for the past</h2>

Interest is the part of today's budget that was decided by yesterday's. In the economic-type view below it has its own colour; click *Interest* in the legend to line it up.

{% include bx.html kind="stack" title="What the money becomes: spending by economic type" view="econ" focus="int" sort="int" metric="gdp" ctrl="metric,sort" caption="IMF GFS statement of operations, general government, latest year per country. Singapore is not shown: its net investment in the series is negative." %}

Interest is **8.3 % of Brazil's GDP, 18 % of everything the Brazilian state spends**. South Africa pays 5.5 % of GDP (14 % of spending), the United States 4.0 % (11 %), Italy 4.0 %, Ukraine 3.8 % in 2023, Türkiye 3.9 %, Mexico 3.8 % in 2023, Greece and Canada 3.5 %. The lowest are Singapore (0.09 %), Switzerland (0.28 %), Ireland (0.6 %), the Netherlands and Sweden (0.7 %).

Dividing interest by gross debt gives a crude **average interest rate**, and it explains the table above through the debt equation of [section 03](#ledger). Türkiye shows 16.5 %, Brazil 9.5 %, South Africa 7.3 %, Mexico 7.2 %, Indonesia 5.3 %, Israel 4.7 %, the United States 3.3 %, Italy 3.0 %, Germany and France 1.8 %, and **Japan 0.7 %**. Japan carries a debt of 213.6 % of GDP, the highest here by far, and pays only 1.5 % of GDP on it. Italy's debt, 134.7 % of GDP, costs 4.0 % of GDP; Germany's, 61.4 %, costs 1.1 %. Debt is a stock; what hurts is the rate that has to be paid on it, which in the countries at the top of the list reflects inflation and perceived risk, not just the size of the debt. (The ratio mixes gross debt with interest actually paid, so it is only an approximation.)

{: .da-bridge}
Interest is the cost of past spending. The purpose with the widest spread between countries is the one that decides what the economy is made of: economic affairs, where one country is an outlier.

<h2 id="economic"><span class="num">14</span>Economic affairs: the China exception</h2>

{% include bx.html kind="stack" title="Economic affairs: transport, energy, industry, agriculture" focus="eco" sort="eco" metric="gdp" ctrl="metric" caption="Economic affairs (COFOG 04) first in every bar. China, Singapore, Thailand, South Africa and Indonesia stand out in the share of their budget." %}

In China, economic affairs is the **largest** purpose: 28.9 % of the budget and 9.0 % of GDP, ahead of social protection (26.2 %). Singapore comes next in share (21.9 %), then Thailand (17.8 %), South Africa (17.2 %) and Indonesia (17.1 %). The lowest are Brazil (4.9 %) and Ukraine (4.7 %). Germany spends 11.0 % of its budget there, 5.3 % of GDP.

What is inside China's 9.0 % of GDP? The IMF's detail splits it into agriculture, forestry and fishing (2.1 %), transport (1.2 %), economic-related research (0.7 %), general economic and labour affairs (0.6 %), and **"not elsewhere classified", 3.9 % of GDP**, the biggest block. The data cannot say how much of that is steel, rail, chips or electricity, and any statement such as "China builds infrastructure with its budget" is a reading of the label, not of the data. It is also likely incomplete: a good deal of Chinese public investment is widely reported to run through state-owned enterprises and local-government financing vehicles that official statistics treat as outside general government.

{: .da-bridge}
The purpose view says what the money is for. The economic-type view, which appeared in the interest figure above, says what kind of payment it is, and it separates the welfare states from the others even more clearly.

<h2 id="anatomy"><span class="num">15</span>Wages, benefits, subsidies: what the money becomes</h2>

Use the same economic-type figure and sort it by social benefits, or by wages; the facts follow.

{% include bx.html kind="stack" title="Spending by economic type, as a share of the budget" view="econ" metric="share" focus="ben" sort="ben" ctrl="metric,sort" caption="Social benefits, wages, goods and services, investment, subsidies, grants, interest and other expense; the first bar segment is the one you clicked in the legend." %}

- **Social benefits are more than half the budget in Japan (53 %) and Germany (52 %)**, 48 % in the Netherlands, 46 % in France, 45 % in Italy, 44 % in Spain, 40 % in the United States. In Indonesia they are 5 %.
- **Wages are the largest item in a few countries.** 36 % of Saudi spending is the pay of government employees, 32 % in South Africa, 31 % in Ukraine (2023), 30 % in Denmark, 29 % in the Emirates, and only 13 % in Japan.
- **Subsidies are a mark of industrial policy and of price controls.** South Korea spends 16 % of its budget on subsidies (2023), Indonesia 14 % (2023), Russia 10 % (2020), Switzerland 9 %, and Germany 3 %.
- **Investment varies by a factor of ten.** Saudi Arabia puts 13 % of its spending into investment, Indonesia 12 %, Russia 8 % (2020), Thailand 8 %, against 1 % in Germany, the Netherlands, Japan, France and Spain.

{: .da-bridge}
So far every figure has fixed a country's year. Now the other way around: open one country and look inside it, level by level and year by year.

<h2 id="deep"><span class="num">16</span>Open any budget</h2>

This is a treemap of one country's spending: area is money. Click a block to see its parts, move the year slider to watch the budget change, switch the measure to compare in dollars per person, and use the panel on the right for the headline numbers and the country's rank among the 30. Clicking a country name in any of the other figures, or a profile at the end of the article, brings you here.

{% include bx.html kind="tree" title="Deep dive: any country, any year since 2007" country="DEU" id="deep-dive" caption="Source: Eurostat (EU members), OECD (Korea, Australia) and IMF GFS (others); revenue, balance, debt and GDP from the IMF World Economic Outlook. Years differ because the sources publish with different delays." %}

And the same data side by side. Pick up to four countries; click a purpose to open its sub-groups.

{% include bx.html kind="compare" title="Head to head" countries="DEU,USA,CHN,FRA" caption="Latest year per country. 'Public debt transactions' in the General public services group is interest; the IMF series reports it for most but not all countries (not the United States)." %}

Things to try: open **Ukraine** and drag the year back to 2013 to see the budget before the war; open **Italy** and compare *old age* with *tertiary education*; open **Singapore** and look at what "general public services" means; open **China** and look for how much is not broken down; compare **Germany** and **the United States** on *hospital services*, *medical products* and *outpatient services*.

{: .da-bridge}
Every one of those spending lines moves with the economy and the political cycle. The next figure shows how much, over eighteen years.

<p class="da-part">Part IV<strong>Over time, and the balance</strong></p>

<h2 id="time"><span class="num">17</span>The time machine</h2>

Pick any purpose, up to six countries, and either the share of GDP or the share of the budget. The buttons under *try* load six stories; the dashed lines mark the financial crisis of 2008, the pandemic and the invasion of Ukraine.

{% include bx.html kind="lines" title="Time machine, 2007 to 2025" fn="TOTAL" countries="USA,DEU,GBR,ITA,JPN,KOR" caption="General government, % of GDP or of total spending. Each line stops at the latest year of data (2024 for most; Russia 2020, Ukraine and Korea 2023)." %}

Three stories stand out.

- **The pandemic.** Between 2019 and 2020, government spending jumped by 11.4 percentage points of GDP in the United Kingdom (40.9 % to 52.3 %), 11.6 in Greece, 9.1 in the United States (38.2 % to 47.3 %), 8.5 in Japan (38.4 % to 46.9 %), 8.4 in Italy (48.5 % to 56.9 %) and 5.4 in Germany (45.3 % to 50.7 %). Part of that is GDP falling, which raises every ratio. What happened afterwards differs: American spending fell back to 39.6 % of GDP in 2024, close to before, while Germany's remained at 48.8 %, 3.5 points above 2019; Spain's 45.4 % is 3.4 points above 2019.
- **The shift to defence.** See [section 12](#defence): the biggest changes are in Poland, Germany and the Nordic countries.
- **A level that moves only slowly.** China's government spent 31.6 % of GDP in 2007, 31.0 % in 2019 and 31.0 % in 2024. Outside crises, the year-to-year changes in most countries are small compared with the differences between countries.

{: .da-bridge}
Spending that exceeds revenue year after year has to be financed. The last analytical step is the balance and the pile of debt it leaves.

<h2 id="balance"><span class="num">18</span>Deficits and debt</h2>

The fiscal map uses the IMF's World Economic Outlook database (country data of 28–29 September 2026) for all 33 countries, including India, Mexico and Saudi Arabia, for which there is no COFOG breakdown. Choose any two quantities for the axes; the year slider goes from 2005 to 2025, and the play button animates it. Click a bubble to see the path that country took through the plane.

{% include bx.html kind="scatter" title="The fiscal map" x="rev" y="exp" caption="Bubble area is GDP at market exchange rates. 2025 is partly estimates. Axes: revenue, expenditure, net lending, primary balance, gross debt (all % of GDP), GDP per person (PPP, log scale), GDP (US$, log scale) and SIPRI military expenditure." %}

Some points to look for. In 2024 (IMF figures):

- **Surpluses are rare and tell their own story.** Norway ran a surplus of 12.9 % of GDP (oil), the Emirates 6.2 %, Denmark and Ireland 4.1 %, Singapore 3.8 %. Greece, which had 155.4 % debt, ran a surplus of 1.4 %.
- **The biggest deficits are in wartime or in the largest economies.** Ukraine −17.2 % of GDP, Israel −8.1 %, India −7.9 %, the United States −7.8 %, China −7.2 %, Poland −6.5 %, Brazil −6.3 %, the United Kingdom −6.0 %, France −5.8 % and Mexico −5.8 %. 
- **Debt is not the same as deficits.** Japan's debt is 213.6 % of GDP (2024) and its deficit 1.7 %; Singapore's gross debt is 165.8 % of GDP while it runs a surplus; Greece 155.4 %, Italy 134.7 %, the United States 122.3 %, France 112.6 % and Canada 110.0 % follow. The lowest are Russia (14.8 %), Türkiye (23.6 %), Saudi Arabia (25.9 %) and Denmark (29.9 %). Gross debt does not subtract the government's assets: Singapore, Japan and Norway hold large financial assets, so the same figure means different things.

A last quirk of the map: put *revenue* on x and *expenditure* on y, and the dashed diagonal is the balanced budget. Most bubbles lie above it, which is the plain-language version of the fact that most governments spend more than they collect. The countries below it, the surplus states, are a small and special group: oil, financial centres and a few Nordic economies.

{: .da-bridge}
A debt is a stock of promises, and the market that prices them has its own rules. How a deficit becomes a bond, who buys it and what it costs is the subject of the next section.

<h2 id="bonds"><span class="num">19</span>Bonds: how a deficit gets financed</h2>

A deficit is a gap, and somebody has to lend the money that fills it. Governments borrow by selling **bonds**: a promise to pay a fixed **coupon** every year, as a percentage of the face value, and to repay the face value on the **maturity** date. The coupon is fixed on the day the bond is sold; the price is not. At an auction investors bid until everything on offer is sold, and the return they accept is the **yield**. A 10-year bond with a 4 % coupon sold when investors demand 5 % costs 92.28 per 100 of face value, because 4 a year is worth less than 5; if they demanded only 3 % it would cost more than 100. Price and yield move in opposite directions, so a rise in yields cuts the value of bonds already issued and raises the price of every new loan. The US Treasury sells bills of 4 to 52 weeks, notes of 2, 3, 5, 7 and 10 years and bonds of 20 and 30 years {% include bd-ref.html k="td-instruments" %}, in auctions where every successful bidder gets the rate of the highest accepted bid {% include bd-ref.html k="td-auctions" %}.

What is sold is not the deficit but the deficit plus whatever matures. On 5 August 2026 the Treasury offered \$125 billion of 3-, 10- and 30-year securities (\$58 bn, \$42 bn and \$25 bn) to refinance about \$96.3 billion of notes and bonds falling due on 15 August; only about \$28.7 billion of it, 23 %, was new cash {% include bd-ref.html k="ust-refunding" %}. Only the new cash adds to the debt; the rest is old debt rolled over at whatever the market charges that day. Over the fiscal year to 30 September 2026 the federal deficit was \$1,992 billion: receipts of \$5,403 billion against outlays of \$7,396 billion {% include bd-ref.html k="ust-mts9" %}. For 2026 Germany plans to raise about €512 billion at auction, €176 billion of it in short-term money-market bills {% include bd-ref.html k="dfa-2026" %}.

**The pile.** There is no single number for "US debt", and the differences are scope and date, not errors. The figure below needs one number per country on one basis, and uses the IMF's *general-government* gross debt at the end of 2025. For the other stocks, the US Treasury and the Federal Reserve publish these:

<div class="bd-tabwrap" markdown="1">

| US debt measure | Scope | Date | Amount |
|---|---|---|---|
| IMF general-government gross debt, 124.4 % of GDP | as reported by the IMF; how it relates to federal debt is not verified here | end of 2025 | \$38.39 trn |
| Federal debt, Financial Accounts {% include bd-ref.html k="fred-bonds" %} | federal government, all securities | Q1 2026 | \$39.07 trn |
| Total public debt outstanding {% include bd-ref.html k="ust-dttp" %} | federal, including \$7.85 trn owed to its own trust funds | 15 Oct 2026 | \$40.39 trn |
| Held by the public {% include bd-ref.html k="ust-dttp" %} | federal, excluding intragovernmental holdings | 15 Oct 2026 | \$32.54 trn |
| Marketable securities {% include bd-ref.html k="ust-mspd" %} | federal, tradable bills, notes, bonds, TIPS and floating-rate notes | 30 Sep 2026 | \$31.83 trn |

</div>

Of the marketable stock, bills (up to one year) were \$7.12 trillion, 22 %. I give no percentage of GDP for the 2026 rows because the dataset has no 2026 GDP; the ratios in this section (124.4 % for the IMF measure) are for 2025. Other countries' numbers are equally scope-specific. The UK's debt portfolio was £2,994 billion in uplifted nominal terms at 30 June 2026 (central government; £86.5 billion of it Treasury bills) {% include bd-ref.html k="dmo-q2" %}. Japan's government bonds were ¥1,006.5 trillion in June 2026 (central government, excluding ¥135.5 trillion of short-term bills) {% include bd-ref.html k="mof-jgb" %}, whereas the IMF's general-government ratio for Japan, 204.8 % of GDP at the end of 2025, covers all debt of all levels.

{% include bx.html kind="stock" title="Debt in dollars, and what it costs" caption="Debt: general-government gross debt, % of GDP times GDP in current US dollars, IMF World Economic Outlook database (country data of 28–29 September 2026), end of 2025 for every country (partly estimates); coverage of 'general government' differs between countries, so bars are indicative. Section 02 stops at 2024, this figure uses 2025. Interest: general-government interest in the economic classification of expenditure (IMF GFS, Eurostat, OECD), % of GDP times GDP in US dollars, latest year per country (2020 to 2025, shown in the tooltip); implied rate is that interest divided by the gross debt of the same year, so an approximation. China and India have no interest series here." %}

**Who holds it** decides who can stop lending. Four countries publish a split I could use, and they differ sharply. In Japan the central bank holds 46.7 % of the government bonds, banks 15.6 %, insurers 15.1 % and foreigners 7.9 % (June 2026, preliminary) {% include bd-ref.html k="mof-jgb" %}. In the UK foreigners hold 33.6 % of the gilts (market value, Q1 2026), pension funds and insurers 20.2 % and the Bank of England 16.6 %, down from £427.1 billion to £365.9 billion in three quarters as it lets its gilts mature {% include bd-ref.html k="dmo-q2" %}. In the United States foreigners hold 23.9 % of the federal debt, the Federal Reserve 12.0 % and government accounts such as trust funds 19.5 % (Q1 2026, Financial Accounts) {% include bd-ref.html k="fred-bonds" %}; the Fed's Treasuries were \$4,571 billion on 14 October 2026, \$1.2 trillion below the peak of 8 June 2022 {% include bd-ref.html k="fred-bonds" %}, and it stopped the run-off on 1 December 2025 {% include bd-ref.html k="fed-norm" %}. In Italy the Eurosystem held 19 % in April 2026, non-residents 34 % (net of the Eurosystem's holdings, which are counted separately), banks and money funds 20.3 % and households and other residents 14.6 % {% include bd-ref.html k="ocpi-italy" %}. A central bank, or a domestic pension fund that cannot easily leave, is a patient lender; a foreign fund is not.

{% include bx.html kind="holders" title="Who holds the debt: four countries" caption="Shares of the debt, each country on its own definition and date: Japan, JGBs excluding bills, June 2026 (Ministry of Finance, from the Bank of Japan Flow of Funds); UK, gilts at market value, Q1 2026 (DMO, from ONS); United States, federal debt, Q1 2026 (Federal Reserve Z.1; the remainder is the total minus the three named groups, which overlap with the others); Italy, general-government debt, April 2026 (Osservatorio CPI from Banca d'Italia data of 15 July 2026). No comparable open split exists for the other 29 countries, so none is shown." %}

**What it costs** depends on which interest bill is meant. The United States has several, none interchangeable:

<div class="bd-tabwrap" markdown="1">

| US interest measure | Scope | Date | Amount |
|---|---|---|---|
| General-government interest, economic classification (the figure of [section 13](#interest)) | all levels of government, gross of interest received | calendar 2025 | \$1,247 bn (4.04 % of GDP) |
| Treasury net interest {% include bd-ref.html k="ust-mts9" %} | federal, net of interest received | fiscal 2025 (to 30 Sep) | \$970 bn |
| Treasury net interest {% include bd-ref.html k="ust-mts9" %} | federal, net of interest received | fiscal 2026 (to 30 Sep) | \$1,052 bn |
| Federal interest payments, national accounts {% include bd-ref.html k="fred-bonds" %} | federal, BEA, seasonally adjusted annual rate | Q2 2026 | \$1,280 bn (a quarterly rate for a different period, not comparable with the calendar-year all-levels figure above) |

</div>

"Interest exceeds defence" holds on the Treasury's own table: fiscal 2024 \$882 billion against \$874 billion, after being \$162 billion below in 2023, and fiscal 2026 \$1,052 billion against \$965 billion, 14.2 % of federal outlays and 19.5 % of receipts {% include bd-ref.html k="ust-mts9" %}. That is a federal, fiscal-year comparison. It is not comparable with the \$913 billion that section 02 gives for US defence in COFOG (all levels of government, calendar 2024) or with SIPRI's \$954 billion for 2025, and the table's "national defense" line excludes veterans' benefits: adding them (\$416 billion in fiscal 2026) gives \$1,381 billion, more than interest. In the national accounts, the Q2 2026 annualised rates are \$1,280 billion of interest against \$1,190 billion of national defence {% include bd-ref.html k="fred-bonds" %}; that defence figure is on a national-accounts definition and period, so it is not comparable with the Treasury's \$965 billion either. The average rate on the Treasury's marketable debt was 3.518 % on 30 September 2026 {% include bd-ref.html k="ust-avgrate" %}, below the 10-year market yield of 4.99 % (September average) and 5.10 % on 15 October {% include bd-ref.html k="fred-bonds" %}: most of the stock was sold earlier at lower rates and reprices only as it matures.

**Why $r - g$ decides.** The debt equation of [section 03](#ledger) says the debt ratio grows when the interest rate $r$ exceeds nominal growth $g$ and shrinks when it does not. Setting $d_t = d_{t-1}$ in it gives the primary balance that holds the ratio steady:

$$
pb^{*} \;=\; d\,\frac{r-g}{1+g} .
$$

Take the United States on one consistent basis, the IMF's general-government figures. In 2021 debt was 125.0 % of GDP, interest divided by debt (the implied $r$) was 2.13 % and nominal GDP grew 11.1 % in dollars in the rebound from Covid: $pb^{*}$ was $-10.1$ % of GDP, so the actual primary deficit of 9.2 % left the ratio falling. In 2025 debt was 124.4 %, almost unchanged, but $r$ had risen to 3.25 % and $g$ fallen to 5.04 %: $pb^{*}$ was $-2.1$ %, the actual primary deficit was 3.9 %, and the ratio rises. The same debt carried a cushion of about 10 points of GDP in one year and 2 to 3 in the other. With debt at 124.4 % and $g = 4$ %, a state paying $r = 1$ % can run a primary deficit of 3.6 % of GDP indefinitely; at $r = 5$ % it needs a surplus of 1.2 %. Three caveats. $r$ here is the average on the whole stock, not today's yield. The primary balance is the IMF's, net of interest received, while $r$ uses gross interest; on the IMF's net interest (3.18 % of GDP in 2025) $r$ is about 2.6 % and the 2025 stabilising balance about $-2.8$ %, so the cushion is nearer three points than two. And the identity ignores stock-flow adjustments, so it does not reproduce the reported change in the debt ratio year by year.

{% include bx.html kind="rg" title="r minus g: the debt-ratio calculator" caption="Debt ratio d(t) = d(t-1) (1+r)/(1+g) minus pb, the equation of section 03, with r, g and the primary balance pb constant for 30 years and r applied to the whole stock at once (in reality only maturing debt reprices). US presets: general-government gross debt, interest divided by gross debt, nominal GDP growth in US dollars and IMF primary balance for 2021 and 2025 (IMF WEO, country data of 28–29 September 2026, and the all-levels interest of this article's economic-type data); the 1 % and 5 % cases keep the 2025 debt ratio and primary balance and set growth to 4 %." %}

**The market's verdict, five times.** The yields below are monthly averages, so daily peaks were higher.

{% include bx.html kind="yields" title="10-year government bond yields since 2005" countries="USA,DEU,ITA,GBR,JPN,FRA" caption="OECD long-term government bond yields (about 10 years), monthly averages, January 2005 to September 2026 (August for Italy, the Netherlands, Denmark and Ireland), via FRED. Spread = country minus Germany, in percentage points. Series exist for 22 of the 33 countries; there is none for Brazil, Ukraine, Russia, Türkiye, Saudi Arabia, the UAE, China, India, Indonesia, Thailand and Singapore. Markers are dated events from the sources cited in the text." %}

*Euro area, 2011 to 2012.* The monthly average yield on Italy's 10-year bond reached 7.06 % in November 2011, 5.18 points above Germany's; Spain's peaked at 6.80 % in July 2012 and Greece's at 29.24 % in February 2012. The daily peak was higher: 575 basis points over Germany on 9 November 2011 according to the news agency AGI {% include bd-ref.html k="agi-spread" %}. In March 2012 about 97 % of Greece's privately held bonds, some €197 billion, were exchanged at a 53.5 % cut of face value, which lowered Greece's debt by about €107 billion {% include bd-ref.html k="esm-psi" %}. On 26 July Mario Draghi said that "within our mandate, the ECB is ready to do whatever it takes to preserve the euro. And believe me, it will be enough" {% include bd-ref.html k="ecb-draghi" %}; on 6 September the ECB set out a bond-buying programme with strict conditionality and "no ex ante quantitative limits" {% include bd-ref.html k="ecb-omt" %}. Italy's spread was 3.76 points that month and 1.40 in December 2014.

*United Kingdom, September 2022.* After the government's growth plan of 23 September, the 30-year gilt yield rose by 160 basis points in a few days, having started the year near 1.2 %. The mechanism ran through pension funds: over £1 trillion was invested in strategies that borrow against gilts to hedge pension liabilities, so falling prices triggered collateral calls, forced sales and further falls, and the Bank of England saw sales of at least £50 billion in prospect against normal trading of £12 billion a day {% include bd-ref.html k="boe-cunliffe" %}. On 28 September it announced purchases of long gilts "on whatever scale is necessary" until 14 October {% include bd-ref.html k="boe-gilt-op" %}, and the 30-year yield fell by more than 100 basis points that day. The purchases peaked at £19.3 billion {% include bd-ref.html k="boe-apf22" %}. The monthly 10-year yield was 2.33 % in August 2022, 3.50 % in September, 4.11 % in October; it was 5.24 % in September 2026, and on 8 September the Debt Management Office sold £4.25 billion of 30-year gilts at 5.8168 %, the highest in its history, with orders above £87 billion {% include bd-ref.html k="ajbell-gilt" %}.

*United States, 2023 to 2026.* On 16 May 2025 Moody's cut the US from Aaa to Aa1 {% include bd-ref.html k="moodys-us" %}. The market barely moved: the monthly 10-year yield was 4.28 % in April, 4.42 % in May and 4.38 % in June. Part of that yield is the compensation for holding long bonds instead of rolling short ones, the term premium (Kim-Wright estimate), which went from $-0.61$ % in July 2020 to $+0.96$ % in September 2026. The daily 10-year close reached 5.31 % on 5 October 2026, the highest in the daily series from 2019 that this article holds. A higher yield reaches the interest bill above only as bonds are refinanced.

*Japan, 2019 to 2026.* The 10-year yield was $-0.28$ % in August 2019, 0.02 % in December 2020, 1.09 % in December 2024, 2.06 % in December 2025 and 3.05 % in September 2026, the highest value of the series, which starts in 2005 at 1.31 %. On 5 October the 30-year yield reached a record 4.235 % {% include bd-ref.html k="standard-hk" %}; the Ministry of Finance sold its 30-year bond on 8 October at an average 4.109 % {% include bd-ref.html k="mof-auction" %}. The interest rate the government assumes in its fiscal 2026 budget was raised from 2.0 % to 3.0 % {% include bd-ref.html k="adnkronos-fy26" %}. Japan's general-government gross debt is 204.8 % of GDP (end of 2025) and it paid an implied 0.72 % on it in 2024, 1.5 % of GDP. Repricing the whole gross debt at 3.05 % would cost about 6.2 % of GDP, an upper bound: gross debt includes holdings inside government, and only the maturing part reprices each year, so the bill rises in steps, not at once.

*France, 2026.* The monthly 10-year yield rose from 3.35 % in February to 4.03 % in August and 4.48 % in September, 1.01 points above Germany's. In August it was above Italy's, 3.99 %, although France's debt (115.5 % of GDP in 2025) is about 22 points below Italy's (137.1 %), the reverse of 2011. As reported, the yield briefly passed 5 % on 1 and 2 October, for the first time since 2002, as the government prepared a 2027 budget aiming at €54 billion of consolidation {% include bd-ref.html k="roic-france" %}; reports of the gap to Germany range from about 120 to more than 150 basis points {% include bd-ref.html k="roic-france" %} {% include bd-ref.html k="te-france" %}.

**What to take away.** A deficit becomes a stream of auctions, and most of each auction is old debt rolled over, so the interest bill follows the market with a lag: the US average rate of 3.518 % on marketable debt tends to rise toward the yields on new issuance as the stock matures (bills reprice faster, inflation-linked bonds carry low coupons, so it need not reach the 10-year yield of about 5 %). What the market charges depends on who holds the bonds as well as on how many there are. And what a yield means for a budget depends on $r - g$, not on the debt ratio alone: the same 124 % of GDP was easy to carry in 2021 and harder in 2025.

{: .da-bridge}
Bonds explain how the sums of the previous sections are financed. Each country has now been seen in pieces; the next section puts the pieces together, one card per country.

<p class="da-part">Part V<strong>Thirty-three countries, and the limits of the data</strong></p>

<h2 id="profiles"><span class="num">20</span>Thirty-three profiles</h2>

Each card below is generated by script from the same data: the size of the state, the three biggest purposes, where the country is first or last, and the IMF's headline numbers. The coloured bar is the eight groups of the first figure. Click a card to open the country in [the deep dive](#deep). India, Mexico and Saudi Arabia get a shorter card because no functional breakdown of their spending exists in the sources used.

{% include budget-article/profiles.html %}

{: .da-bridge}
Every card, every ratio and every chart above shares the same limits.

<h2 id="limits"><span class="num">21</span>What the numbers cannot tell you</h2>

- **Years differ.** The latest year with a breakdown is 2024 for 25 of the 30, but 2023 for Ukraine, South Korea and Indonesia, 2025 for Türkiye and 2020 for Russia, whose breakdown predates the invasion and the very large increase in military spending; the SIPRI series shows 7.5 % for Russia in 2025. The profiles say which year they use.
- **Three countries have no breakdown at all.** India, Mexico and Saudi Arabia report only headline numbers to the IMF, so they appear in the fiscal map and nowhere else; the UAE has a single year of detail (2024).
- **The sources do not always agree.** Spending in the purpose figures is the COFOG total; the IMF World Economic Outlook headline expenditure sometimes differs, and so do its revenue, balance and debt, whose coverage is not always all levels of government. In the latest year the COFOG total differs from the headline expenditure by 1.9 points of GDP or more in eleven of the 30 countries: Singapore (COFOG 25.2 % of GDP, headline 14.2 %), South Africa (40.5 % against 33.0 %), Canada (40.0 % against 44.3 %), the United Kingdom (46.7 % against 43.4 %), Australia (42.0 % against 38.8 %), Japan (40.2 % against 37.2 %), Norway (49.3 % against 46.9 %), Russia (2020: 41.3 % against 39.2 %), Türkiye (2025: 34.4 % against 32.3 %), the United States (39.6 % against 37.6 %) and China (31.0 % against 33.0 %). Where this happens the profile says so, because the profile pairs spending from COFOG with revenue, deficit and debt from the headline series. For South Africa and Saudi Arabia the headline revenue is also visibly narrower than the all-levels statement of operations (South Africa 27.3 % against 36.0 %, Saudi Arabia 26.8 % against 32.0 %). The COFOG total is used for every purpose figure; always compare countries on the same cut.
- **Classification is not uniform.** The United States reports no environmental spending, and the IMF series has no detail below social protection for it; Singapore's "public debt transactions" are 7.5 % of GDP in 2024 and 0.0 % in 2019 and 2021, a break in the series that this article does not explain; Australia and South Korea report no (or almost no) interest in this line of the classification although they pay some, so use the economic-type view for interest.
- **What is not government is not counted.** Switzerland's compulsory health insurance, mandatory private pensions in some countries, spending by state-owned enterprises, and tax breaks (which reduce revenue instead of increasing spending) are outside the picture, although they do economically what a government programme does.
- **GDP is a poor denominator in a few places.** Ireland, as noted, and the oil states, whose GDP moves with the oil price. Ukraine's GDP fell sharply in 2022.
- **Outturn is not the budget law.** Nothing here says what parliaments approved or promised, and nothing about 2025 and 2026 beyond the IMF's estimates and SIPRI's military series. The defence build-up in Europe is mostly ahead of the budget statistics.
- **Bonds are shown where data exist.** Ten-year yields are OECD monthly averages for 22 of the 33 countries (daily peaks were higher); holder splits exist here for four countries and follow each national definition; the dollar bars of debt and interest use the IMF's general-government figures, whose coverage differs between countries, for 2025 and for the latest year with an interest series (2020 to 2025). US debt and interest each have several definitions, listed in section 19; the 2026 figures are federal and fiscal-year.
- **Rankings amplify small differences.** A "#4 of 30" is a ranking of two decimal places in an uncertain table. Read the ranks as groups, not as positions.

For anything that matters, go to the original sources below. All figures here are computed by a script (`bin/budget_article/` in this site's repository), which downloads the data, merges them and writes the files the figures read.

<h2 id="sources"><span class="num">22</span>Sources</h2>

<div class="da-note" markdown="1">
**Data.** All statistics were downloaded on 18 and 19 October 2026 from the original publishers and processed by me with Claude's help; the figures here are that processing, not a publication of the sources. Used under each provider's terms of reuse; where the licence asks for it, credit: Eurostat, OECD, IMF and the World Bank.

- **IMF, Government Finance Statistics, Government Expenditures by Function (GFS_COFOG)** and **Statement of Operations (GFS_SOO)**, IMF Data portal, [data.imf.org](https://data.imf.org): spending by purpose, by economic type, and revenue by source.
- **IMF, World Economic Outlook database (country data of 28–29 September 2026)**, and **Fiscal Monitor**: revenue, expenditure, balance, primary balance, gross debt, GDP at market prices, GDP and GDP per person in PPP dollars, population.
- **Eurostat**, [Government expenditure by function (gov_10a_exp)](https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp) and national accounts (nama_10_gdp), for the EU members in the list (Germany, France, Italy, Spain, the Netherlands, Poland, Sweden, Denmark, Finland, Ireland, Greece). Eurostat reuse is under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **OECD**, National Accounts, Annual government expenditure by function (COFOG), table 11, for South Korea and Australia.
- **SIPRI Military Expenditure Database**, via the **World Bank** indicators MS.MIL.XPND.GD.ZS and MS.MIL.XPND.CD ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
- **UN**, Classification of the Functions of Government (COFOG, 1999), for the ten divisions and their sub-groups.
</div>

<div class="da-note" markdown="1">
**Bonds section (19).** Yields: OECD Main Economic Indicators, long-term government bond yields, via FRED (Federal Reserve Bank of St. Louis); term premium: Kim-Wright estimate, Federal Reserve Board, via FRED; US debt, auctions, interest and defence: US Treasury FiscalData (public data); holders: US Financial Accounts (Z.1), Japan Ministry of Finance, UK Debt Management Office (ONS data), Osservatorio CPI (Banca d'Italia data). Each outside claim in the text is tagged; the list shows how I read each source. *Opened* means I read the page or PDF, *primary* that it is an official source I read, *snippet* that I saw only a search result, *data* that it is a series I downloaded. The script `bin/budget_article/bonds/prose_check.py` prints every figure quoted in the section next to its source value.
</div>

{% include bd-refs.html %}

</article>

<script>
  document.addEventListener('click', function (ev) {
    var card = ev.target.closest && ev.target.closest('.bx-prof');
    if (card && card.dataset.iso) document.dispatchEvent(new CustomEvent('bx:country', { detail: card.dataset.iso }));
  });
</script>
<script defer src="{{ '/assets/js/concepts.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/figure-tools.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/da-guide.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/budget-explorer.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/budget-bonds.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
