"""Hand-curated facts behind the oil-market long read: every number that is not a downloaded series, each with the key of
its entry in _data/oil_article/refs.yml. build.py writes them into oil.json under "curated"; the figures read only oil.json.
"""

# EIA, "Refining crude oil: inputs and outputs" (2023 data): gallons of product per 42-gallon barrel of crude, US refineries.
YIELDS = {
    'source': 'EIA, US refinery yields 2023', 'date': '2023', 'ref': 'eia-yields',
    'items': [  # bottom to top in the stack
        {'k': 'other', 'name': 'Coke, asphalt, other', 'gal': 2.06 + 0.84 + 0.38 + 0.34 + 0.21 + 0.21 + 0.08 + 0.04 + 0.04, 'c': '#7a5c45'},
        {'k': 'resid', 'name': 'Fuel oil', 'gal': 0.71, 'c': '#4e3b2c'},
        {'k': 'diesel', 'name': 'Diesel and heating oil', 'gal': 12.47, 'c': '#6a47c2'},
        {'k': 'jet', 'name': 'Jet fuel', 'gal': 4.41, 'c': '#8a93a6'},
        {'k': 'gas', 'name': 'Gasoline', 'gal': 19.57, 'c': '#138374'},
        {'k': 'lpg', 'name': 'Still gas and LPG', 'gal': 1.68 + 1.55, 'c': '#c99a1e'},
    ],
}

# numbered markers on the long price charts (date, number, text)
HISTORY = [
    {'d': '1990-08-02', 'n': 'A', 't': 'Iraq invades Kuwait: Brent spot from $15 in early July to $41 in late September.'},
    {'d': '1998-12-10', 'n': 'B', 't': 'Asian crisis and an OPEC output rise: Brent near $10.'},
    {'d': '2008-07-03', 'n': 'C', 't': 'The all-time nominal high: Brent spot $143.95 on 3 July 2008, then the financial crisis.'},
    {'d': '2014-11-27', 'n': 'D', 't': 'OPEC decides not to cut against US shale: prices halve into 2016.'},
    {'d': '2020-04-20', 'n': 'E', 't': 'Covid: with Cushing filling up, WTI spot closes at −$36.98 a barrel (the May future at −$37.63).'},
    {'d': '2022-03-08', 'n': 'F', 't': 'Russia invades Ukraine (24 Feb 2022); Brent spot reaches $133 on 8 March.'},
    {'d': '2026-03-02', 'n': 'G', 't': 'War with Iran; traffic through the Strait of Hormuz collapses.'},
]

# 2026 events, filled from the research notes (010_chronology_2026.md); placeholder until verified
EVENTS = [  # 2026, numbered markers on the war-year charts (research note 010_chronology_2026.md)
    {'d': '2026-02-28', 'n': '1', 't': 'US–Israeli strikes on Iran; the Revolutionary Guard declares the Strait of Hormuz closed.'},
    {'d': '2026-03-11', 'n': '2', 't': 'IEA members agree the largest stock release ever, 400 million barrels (426 pledged by 19 March).'},
    {'d': '2026-04-07', 'n': '3', 't': 'Physical Brent at an all-time high ($144.68 Dated, Argus); a ceasefire that evening, futures fall $20 the next day.'},
    {'d': '2026-04-13', 'n': '4', 't': 'US naval blockade of Iranian ports begins.'},
    {'d': '2026-05-01', 'n': '5', 't': 'The UAE leaves OPEC and OPEC+.'},
    {'d': '2026-06-17', 'n': '6', 't': 'Islamabad Memorandum signed; both blockades lifted; Ras Tanura loads again from 29 June.'},
    {'d': '2026-07-08', 'n': '7', 't': 'The memorandum collapses after attacks on ships; the US blockade returns on 14 July; Houthi blockade of the Red Sea from 20 July.'},
    {'d': '2026-09-11', 'n': '8', 't': 'Drones shut the Saudi East–West pipeline; Yanbu loadings stop until a partial restart on 22 September.'},
    {'d': '2026-09-21', 'n': '9', 't': 'US retail diesel record, $6.529 a gallon (EIA weekly).'},
    {'d': '2026-10-02', 'n': '10', 't': 'G7 agrees to release up to 100 million barrels, diesel first; EIA Brent spot $135.51.'},
]
GAP_EVENTS = [
    {'d': '2011-09-06', 'n': 'A', 't': 'Cushing glut: the Permian and Bakken boom fills the Oklahoma hub before pipelines to the Gulf exist; Brent spot trades up to $29.59 over WTI (23 Sep 2011).'},
    {'d': '2015-12-18', 'n': 'B', 't': 'The US lifts its 40-year ban on crude exports.'},
    {'d': '2023-06-01', 'n': 'C', 't': 'WTI Midland enters the Dated Brent basket (cargoes from June 2023).'},
    {'d': '2026-10-06', 'n': 'D', 't': 'Record tanker rates: the futures gap reaches about $13.80.'},
]
US_EVENTS = [
    {'d': '2008-01-01', 'n': 'A', 't': 'Horizontal drilling and fracking spread from gas to oil (Bakken, then Eagle Ford and the Permian).'},
    {'d': '2015-12-18', 'n': 'B', 't': 'The crude export ban ends.'},
    {'d': '2020-04-20', 'n': 'C', 't': 'Covid: negative WTI; output falls by about 2 mb/d within weeks.'},
]


# ------------------------------------------------------------------ maps
# EIA, World Oil Transit Chokepoints (updated 3 Mar 2026, first half of 2025), mb/d; lat, lon
CHOKEPOINTS = [
    {'k': 'malacca', 'name': 'Strait of Malacca', 'mbd': 23.2, 'lat': 2.5, 'lon': 101.5, 'ref': 'eia-choke'},
    {'k': 'hormuz', 'name': 'Strait of Hormuz', 'mbd': 20.9, 'lat': 26.6, 'lon': 56.5, 'ref': 'eia-choke'},
    {'k': 'cape', 'name': 'Cape of Good Hope', 'mbd': 9.1, 'lat': -34.9, 'lon': 18.5, 'ref': 'eia-choke'},
    {'k': 'suez', 'name': 'Suez Canal and SUMED', 'mbd': 4.9, 'lat': 30.7, 'lon': 32.34, 'ref': 'eia-choke'},
    {'k': 'danish', 'name': 'Danish Straits', 'mbd': 4.9, 'lat': 56.0, 'lon': 11.0, 'ref': 'eia-choke'},
    {'k': 'babel', 'name': 'Bab el-Mandeb', 'mbd': 4.2, 'lat': 12.58, 'lon': 43.33, 'ref': 'eia-choke'},
    {'k': 'turkish', 'name': 'Turkish Straits', 'mbd': 3.7, 'lat': 41.12, 'lon': 29.07, 'ref': 'eia-choke'},
    {'k': 'panama', 'name': 'Panama Canal', 'mbd': 2.3, 'lat': 9.12, 'lon': -79.75, 'ref': 'eia-choke'},
]
# sea lanes as lon/lat waypoints (schematic, drawn by hand along the usual tanker routes)
LANE = {
    'gulf_out': [[50.05, 26.7], [52.5, 26.6], [55.2, 26.4], [56.5, 26.55], [57.5, 25.6], [59.0, 24.0], [61.5, 21.5]],
    'arab_to_malacca': [[61.5, 21.5], [70.0, 12.0], [80.5, 5.6], [90.0, 5.8], [96.5, 5.6], [99.5, 3.6], [102.5, 1.8], [104.2, 1.3]],
    'malacca_to_ningbo': [[104.2, 1.3], [108.5, 6.0], [113.5, 14.0], [118.5, 21.2], [121.0, 25.5], [122.3, 29.9]],
    'arab_to_jamnagar': [[61.5, 21.5], [66.0, 22.0], [69.4, 22.4]],
    'malacca_to_japan': [[118.5, 21.2], [123.5, 26.0], [128.5, 31.5], [134.0, 33.6], [139.7, 35.2]],
    'arab_to_redsea': [[61.5, 21.5], [57.0, 15.5], [51.0, 13.0], [45.5, 12.4], [43.4, 12.7], [41.5, 15.0], [38.6, 20.0], [35.5, 25.5], [33.2, 28.5], [32.4, 29.9], [32.34, 31.3]],
    'yanbu_south': [[38.06, 24.09], [38.8, 20.0], [41.5, 15.0], [43.4, 12.7], [45.5, 12.4], [51.0, 13.0], [57.0, 15.5], [61.5, 21.5]],
    'med_to_rotterdam': [[32.34, 31.3], [28.0, 33.5], [20.0, 35.0], [12.0, 37.2], [6.0, 37.8], [-1.0, 36.4], [-5.6, 35.95], [-9.8, 37.5], [-9.9, 43.5], [-6.0, 48.3], [-2.0, 49.9], [1.5, 51.0], [4.1, 51.95]],
    'arab_to_cape': [[61.5, 21.5], [58.0, 10.0], [50.0, -5.0], [41.0, -20.0], [33.0, -32.0], [24.0, -36.0], [18.5, -35.2], [13.0, -30.0], [5.0, -18.0], [-6.0, -2.0], [-15.0, 10.0], [-19.0, 22.0], [-16.0, 32.0], [-11.0, 39.5], [-9.9, 43.5]],
    'usgc_to_rotterdam': [[-95.0, 29.2], [-90.0, 27.0], [-84.0, 24.6], [-80.0, 25.5], [-74.0, 32.0], [-60.0, 39.0], [-40.0, 44.0], [-20.0, 47.5], [-8.0, 48.8], [-2.0, 49.9], [1.5, 51.0], [4.1, 51.95]],
    'usgc_to_asia': [[-95.0, 29.2], [-90.0, 27.0], [-84.0, 24.6], [-80.0, 25.5], [-70.0, 22.0], [-50.0, 12.0], [-30.0, -5.0], [-10.0, -22.0], [10.0, -34.5], [18.5, -36.0], [33.0, -33.0], [55.0, -20.0], [80.0, -5.0], [95.0, 2.0], [99.5, 3.6], [102.5, 1.8], [104.2, 1.3]],
    'baltic_out': [[28.6, 60.3], [24.0, 59.8], [20.0, 58.5], [17.0, 56.0], [12.8, 55.4], [11.0, 56.0], [10.6, 57.7], [8.0, 57.5], [4.0, 55.5], [2.5, 52.5], [1.5, 51.0], [-2.0, 49.9], [-6.0, 48.3], [-9.9, 43.5], [-9.8, 37.5], [-5.6, 35.95], [-1.0, 36.4], [6.0, 37.8], [12.0, 37.2], [20.0, 35.0], [28.0, 33.5], [32.34, 31.3]],
    'suez_south': [[32.34, 31.3], [32.4, 29.9], [33.2, 28.5], [35.5, 25.5], [38.6, 20.0], [41.5, 15.0], [43.4, 12.7], [45.5, 12.4], [51.0, 13.0], [60.0, 15.0], [66.0, 20.0], [69.4, 22.4]],
    'blacksea_out': [[37.77, 44.72], [34.0, 43.6], [29.5, 41.6], [29.07, 41.12], [26.5, 40.2], [25.0, 38.5], [24.5, 36.5], [28.0, 33.5], [32.34, 31.3]],
    'wafrica_to_europe': [[7.0, 4.2], [2.0, 2.0], [-10.0, 4.0], [-18.5, 15.0], [-19.0, 22.0], [-16.0, 32.0], [-11.0, 39.5], [-9.9, 43.5], [-6.0, 48.3], [-2.0, 49.9], [1.5, 51.0], [4.1, 51.95]],
    'wafrica_to_asia': [[7.0, 4.2], [5.0, -10.0], [10.0, -30.0], [18.5, -36.0], [33.0, -33.0], [55.0, -20.0], [80.0, -5.0], [95.0, 2.0], [99.5, 3.6], [102.5, 1.8], [104.2, 1.3]],
    'brazil_to_asia': [[-45.0, -24.5], [-30.0, -30.0], [-5.0, -36.0], [18.5, -36.5], [33.0, -33.0], [55.0, -20.0], [80.0, -5.0], [95.0, 2.0], [99.5, 3.6], [102.5, 1.8], [104.2, 1.3]],
    'canada_us': [[-111.3, 52.7], [-104.0, 49.5], [-97.5, 44.0], [-96.8, 36.0], [-95.4, 29.8]],
    'russia_china_pipe': [[105.0, 56.0], [115.0, 54.0], [123.5, 53.9], [124.5, 50.0], [125.1, 46.6]],
}
# 2025 crude flows (Energy Institute Statistical Review 2026, inter-area crude trade, Mt converted to mb/d) drawn on lanes
FLOWS = [
    {'from': 'Middle East', 'to': 'China, Korea, Japan', 'mbd': 6.6 + 4.4 + 2.2, 'lanes': ['gulf_out', 'arab_to_malacca', 'malacca_to_ningbo'], 'c': 'crude', 'hormuz': True},
    {'from': 'Middle East', 'to': 'India', 'mbd': 2.5, 'lanes': ['gulf_out', 'arab_to_jamnagar'], 'c': 'crude', 'hormuz': True},
    {'from': 'Middle East', 'to': 'Europe', 'mbd': 1.3, 'lanes': ['gulf_out', 'arab_to_redsea', 'med_to_rotterdam'], 'c': 'crude', 'hormuz': True},
    {'from': 'United States', 'to': 'Europe', 'mbd': 1.84, 'lanes': ['usgc_to_rotterdam'], 'c': 'wti'},
    {'from': 'United States', 'to': 'Asia', 'mbd': 1.47, 'lanes': ['usgc_to_asia'], 'c': 'wti'},
    {'from': 'Russia (Baltic)', 'to': 'India', 'mbd': 1.7, 'lanes': ['baltic_out', 'suez_south'], 'c': 'urals'},
    {'from': 'Russia (Black Sea), Kazakhstan', 'to': 'Europe', 'mbd': 1.58 + 0.57, 'lanes': ['blacksea_out', 'med_to_rotterdam'], 'c': 'urals'},
    {'from': 'Russia (ESPO)', 'to': 'China', 'mbd': 2.0, 'lanes': ['russia_china_pipe'], 'c': 'urals', 'pipe': True},
    {'from': 'West Africa', 'to': 'Europe', 'mbd': 1.02, 'lanes': ['wafrica_to_europe'], 'c': 'crude'},
    {'from': 'West Africa', 'to': 'China', 'mbd': 1.04, 'lanes': ['wafrica_to_asia'], 'c': 'crude'},
    {'from': 'Brazil and South America', 'to': 'China', 'mbd': 1.37, 'lanes': ['brazil_to_asia'], 'c': 'crude'},
    {'from': 'Canada', 'to': 'United States', 'mbd': 3.91, 'lanes': ['canada_us'], 'c': 'wti', 'pipe': True},
]
PLACES = [  # Wikipedia geodata unless marked approx. in the research note
    {'n': 'Ras Tanura', 'lat': 26.706, 'lon': 50.053, 'role': 'Saudi Gulf terminal'}, {'n': 'Abqaiq', 'lat': 25.935, 'lon': 49.666, 'role': 'Saudi processing, start of the East–West line'},
    {'n': 'Yanbu', 'lat': 24.089, 'lon': 38.062, 'role': 'Red Sea end of the East–West line'}, {'n': 'Kharg Island', 'lat': 29.245, 'lon': 50.31, 'role': 'about 90 % of Iran\'s crude exports'},
    {'n': 'Jask', 'lat': 25.653, 'lon': 57.782, 'role': 'Iran\'s bypass terminal'}, {'n': 'Basra (ABOT)', 'lat': 29.783, 'lon': 48.807, 'role': 'Iraq\'s southern exports'},
    {'n': 'Mina al-Ahmadi', 'lat': 29.07, 'lon': 48.15, 'role': 'Kuwait'}, {'n': 'Habshan', 'lat': 23.825, 'lon': 53.617, 'role': 'start of the UAE bypass line'},
    {'n': 'Fujairah', 'lat': 25.122, 'lon': 56.334, 'role': 'end of the UAE bypass line, bunkering hub'}, {'n': 'Ras Laffan', 'lat': 25.92, 'lon': 51.58, 'role': 'Qatar, LNG'},
    {'n': 'Cushing', 'lat': 35.98, 'lon': -96.761, 'role': 'WTI delivery hub'}, {'n': 'Midland', 'lat': 31.997, 'lon': -102.074, 'role': 'Permian Basin, WTI Midland'},
    {'n': 'Houston', 'lat': 29.757, 'lon': -95.365, 'role': 'export hub'}, {'n': 'Corpus Christi', 'lat': 27.743, 'lon': -97.402, 'role': 'largest US crude export port'},
    {'n': 'Rotterdam', 'lat': 51.943, 'lon': 4.143, 'role': 'Europe\'s main crude port'}, {'n': 'Sullom Voe', 'lat': 60.467, 'lon': -1.275, 'role': 'Brent system terminal'},
]
# the Gulf in 2026, stage by stage: Hormuz flow (mb/d, crude and products, trackers differ), bypass use, state of the Red Sea
HORMUZ_STAGES = [  # oil through the strait (IEA; Kpler for Oct), Gulf exports by all routes (IEA; The National/Kpler for Oct)
    {'k': 'prewar', 'd': 'Feb 2026', 'title': 'Before the war', 'hormuz': 20.0, 'exports': 24.0, 'ships': 'about 80', 'ew': '2–2.5 mb/d (of 7)', 'red': 'open',
     'text': 'About 80 ships a day; some 20 mb/d of crude and products through the strait, a fifth of world consumption. Gulf exports by all routes about 24 mb/d.'},
    {'k': 'mar', 'd': 'Mar 2026', 'title': 'The strait closes', 'hormuz': 2.3, 'exports': 8.7, 'ships': 'about 3', 'ew': 'filling to 7 mb/d', 'red': 'open: Yanbu loads',
     'text': 'Strikes on Iran on 28 February; the Revolutionary Guard closes the strait. Gulf producers shut in more than 10 mb/d within two weeks. Saudi Arabia pushes crude west through the East–West line to Yanbu, the UAE fills its line to Fujairah.'},
    {'k': 'apr', 'd': 'Apr 2026', 'title': 'Bypasses at full stretch', 'hormuz': 2.7, 'exports': 10.5, 'ships': 'about 7', 'ew': 'full, 7 mb/d', 'red': 'Red Sea loadings 4.2 mb/d',
     'text': 'Bypass exports reach 7.8 mb/d, total Gulf exports 10.5 mb/d, 14 mb/d below February. A ceasefire on 7 April crashes futures by $20; the US blockades Iranian ports from 13 April.'},
    {'k': 'jun', 'd': 'Jun 2026', 'title': 'The memorandum', 'hormuz': None, 'exports': 16.1, 'ships': 'tankers return', 'ew': 'easing', 'red': 'open',
     'text': 'The Islamabad Memorandum is signed on 17 June and both blockades are lifted; Ras Tanura loads again from 29 June. Gulf exports climb to 16.1 mb/d.'},
    {'k': 'aug', 'd': 'Aug 2026', 'title': 'Blockades again', 'hormuz': 7.6, 'exports': 13.0, 'ships': 'about 5', 'ew': 'Yanbu under fire', 'red': 'Houthi blockade',
     'text': 'The memorandum collapses on 7–8 July; the US blockade returns on 14 July and the Houthis declare a blockade of the Red Sea. Hormuz carries 7.6 mb/d; Gulf exports by all routes fall to about 13 mb/d.'},
    {'k': 'oct', 'd': 'Oct 2026', 'title': 'Dark transits', 'hormuz': 11.6, 'exports': 24.5, 'ships': 'about 4 counted', 'ew': 'partly restarted 22 Sep', 'red': '2.6 mb/d (Sep)',
     'text': 'Drones shut the East–West line on 11 September. In October PortWatch counts about four transits a day, yet Kpler sees 11.6 mb/d leave through the strait: most tankers sail with their transponders off, and non-Iranian Middle East exports are back at their pre-war level.'},
]

# Energy Institute Statistical Review 2026: 2025 production (crude + condensate + NGLs) and consumption (total liquids), kb/d,
# with a map anchor (lon, lat) per country
COUNTRIES = [
    # iso, name, production, consumption, lon, lat
    ['USA', 'United States', 21065, 20610, -99, 39], ['SAU', 'Saudi Arabia', 11408, 3862, 45, 24], ['RUS', 'Russia', 10737, 3657, 60, 58],
    ['CAN', 'Canada', 6164, 2491, -110, 56], ['IRN', 'Iran', 5184, 2008, 54, 32], ['IRQ', 'Iraq', 4396, None, 44, 33],
    ['CHN', 'China', 4340, 17447, 104, 34], ['ARE', 'UAE', 4207, None, 54, 23.8], ['BRA', 'Brazil', 3881, 3496, -52, -11],
    ['KWT', 'Kuwait', 2820, None, 47.6, 29.3], ['KAZ', 'Kazakhstan', 2088, None, 67, 48], ['NOR', 'Norway', 2045, None, 9, 61],
    ['QAT', 'Qatar', 1838, None, 51.2, 25.3], ['MEX', 'Mexico', 1780, 1800, -102, 23.5], ['NGA', 'Nigeria', 1760, None, 8, 9.5],
    ['DZA', 'Algeria', 1517, None, 3, 28], ['ARG', 'Argentina', 1427, None, -65, -35], ['LBY', 'Libya', 1400, None, 18, 27],
    ['VEN', 'Venezuela', 1104, None, -66, 7], ['AGO', 'Angola', 1098, None, 17.5, -12.5], ['OMN', 'Oman', 1002, None, 57, 21],
    ['GUY', 'Guyana', 716, None, -59, 5], ['IND', 'India', None, 5837, 79, 22], ['JPN', 'Japan', None, 3329, 138, 36.5],
    ['KOR', 'South Korea', None, 2849, 128, 36], ['DEU', 'Germany', None, 2113, 10.4, 51.2], ['IDN', 'Indonesia', None, 1929, 114, -1],
    ['SGP', 'Singapore', None, 1483, 103.8, 1.35],
]
WORLD = {'production': 100590, 'consumption': 106519, 'eu_consumption': 11072}
# IEA OMR Feb 2026: world demand by product, 2025, kb/d
PRODUCTS = [['Diesel and gasoil', 28857, '#6a47c2'], ['Gasoline', 27786, '#138374'], ['LPG and ethane', 15244, '#c99a1e'], ['Other products', 10917, '#a3acbd'],
            ['Jet fuel and kerosene', 7718, '#8a93a6'], ['Naphtha', 7203, '#b39ddb'], ['Fuel oil', 6297, '#7a5c45']]
# barrels per person per year, 2024 (EIA international statistics, computed in the research note)
PERCAP = [['Saudi Arabia', 38.2], ['Canada', 22.4], ['United States', 22.0], ['South Korea', 17.9], ['Russia', 9.6], ['Japan', 9.3],
          ['European Union', 9.0], ['Germany', 8.9], ['Brazil', 5.6], ['World', 4.6], ['China', 4.2], ['India', 1.4]]
# breakeven Brent prices of new supply (Rystad, Sep 2024, full-cycle) and the US shale survey (Dallas Fed, Mar 2026, WTI);
# width = rough volume of 2025 supply in mb/d for the cost curve, from EI 2025 and the research note (approximate)
COSTS = [
    {'n': 'Onshore Middle East', 'be': 27, 'mbd': 26.0, 'ref': 'rystad'}, {'n': 'Offshore shelf', 'be': 37, 'mbd': 16.0, 'ref': 'rystad'},
    {'n': 'Deepwater', 'be': 43, 'mbd': 10.0, 'ref': 'rystad'}, {'n': 'Shale, new well (Rystad)', 'be': 45, 'mbd': 9.0, 'ref': 'rystad'},
    {'n': 'Oil sands', 'be': 57, 'mbd': 3.4, 'ref': 'rystad'}, {'n': 'Shale, new well (Dallas Fed survey)', 'be': 66, 'mbd': 0, 'ref': 'dallasfed'},
]
FISCAL = [['UAE', 45.2], ['Qatar', 43.2], ['Oman', 53.5], ['Kuwait', 76.7], ['Iraq', 79.1], ['Saudi Arabia', 86.6], ['Bahrain', 138.6], ['Iran', 164.8]]
# IEA OMR Mar 2026: OPEC+ effective spare capacity, February 2026, mb/d
SPARE = [['Saudi Arabia', 1.7, True], ['UAE', 0.6, True], ['Iraq', 0.4, True], ['Kazakhstan', 0.4, False], ['Kuwait', 0.3, True], ['Nigeria', 0.1, False], ['Venezuela', 0.1, False], ['Others', 0.3, False]]
# EIA STEO Oct 2026, Table 1: Gulf crude shut-ins, kb/d
SHUTINS = {'cols': ['Feb output', 'Mar–Jul avg shut in', 'Aug', 'Sep'], 'rows': [
    ['Saudi Arabia', 10500, 2750, 3270, 1700], ['Iraq', 4400, 2646, 780, 760], ['Kuwait', 2560, 1466, 630, 930], ['UAE', 3600, 740, 0, 0],
    ['Iran', 3390, 424, 900, 1200], ['Qatar', 557, 350, 100, 100], ['Bahrain', 193, 136, 80, 80]]}
# TotalEnergies TBP assays, weight %: naphtha 15-150 C, kerosene 150-230, gasoil 230-375, VGO 375-550, vacuum residue > 550; LPG = rest
ASSAYS = [
    {'n': 'Murban', 'api': 40.5, 's': 0.79, 'cuts': [20.7, 18.3, 27.6, 22.6, 9.7]},
    {'n': 'Brent', 'api': 38.1, 's': 0.4, 'cuts': [21.2, 13.3, 26.1, 23.1, 13.6]},
    {'n': 'Bonny Light', 'api': 34.9, 's': None, 'cuts': [19.1, 14.5, 35.8, 21.8, 7.4]},
    {'n': 'Oman', 'api': 33.2, 's': None, 'cuts': [13.3, 12.0, 23.3, 25.7, 24.4]},
    {'n': 'Johan Sverdrup', 'api': 28.7, 's': None, 'cuts': [10.9, 10.2, 26.5, 28.1, 22.2]},
    {'n': 'Canadian heavy (Synbit)', 'api': 19.0, 's': 2.97, 'cuts': [5.5, 8.3, 28.7, 26.9, 28.0]},
]
# North Sea: the Dated Brent basket, loadings in kb/d, September 2026 programmes (Reuters via LSE, snippet), Brent field 2026 average
NORTHSEA = [
    {'n': 'Brent', 'lat': 61.05, 'lon': 1.71, 'kbd': 23, 'term': 'Sullom Voe', 'tlat': 60.467, 'tlon': -1.275},
    {'n': 'Forties', 'lat': 57.717, 'lon': 1.017, 'kbd': 163, 'term': 'Hound Point', 'tlat': 56.006, 'tlon': -3.359},
    {'n': 'Oseberg', 'lat': 60.5, 'lon': 2.8, 'kbd': 47, 'term': 'Sture', 'tlat': 60.62, 'tlon': 4.85},
    {'n': 'Ekofisk', 'lat': 56.549, 'lon': 3.21, 'kbd': 163, 'term': 'Teesside', 'tlat': 54.62, 'tlon': -1.15},
    {'n': 'Troll', 'lat': 60.64, 'lon': 3.72, 'kbd': 70, 'term': 'Mongstad', 'tlat': 60.81, 'tlon': 5.03},
]
MIDLAND_NL = 459   # kb/d of US crude into the Netherlands, Sep 2026 (S&P Commodities at Sea)
# Brent futures curve, $ per barrel by months ahead (Dec26 105.92, Jun27 93.20, Dec27 85.08 on 15 Oct 2026)
CURVES = {
    'oct2026': {'label': 'Brent futures, 15 Oct 2026 settlements', 'pts': [[0, 105.92], [6, 93.20], [12, 85.08]]},  # CME bulletin #199 via Baratelli
    'apr2020': {'label': 'WTI, 17 Apr 2020 (super-contango)', 'pts': [[0, 18.27], [1, 25.03], [2, 27.06], [3, 28.21], [6, 31.0], [12, 33.5]]},
}
# what a litre / gallon costs, October 2026 (own calc in the research note)
PUMP = {
    'de_diesel': {'price': 2.255, 'unit': '€ per litre', 'date': '21 Oct 2026', 'parts': [['Crude (Brent ≈ $110)', 0.617, '#b4552f'], ['Refining spread', 0.496, '#d98a52'], ['Distribution, stocks, retail', 0.278, '#a3acbd'], ['CO₂ price', 0.174, '#5fb3a5'], ['Energy tax (cut)', 0.330, '#0b4fc0'], ['VAT 19 %', 0.360, '#b39ddb']]},
    'us_diesel': {'price': 6.276, 'unit': '$ per gallon', 'date': '19 Oct 2026', 'parts': [['Crude', 2.64, '#b4552f'], ['Refining', 1.57, '#d98a52'], ['Distribution and marketing', 1.44, '#a3acbd'], ['Taxes', 0.69, '#0b4fc0']]},
}

CURATED = {'yields': YIELDS, 'history': HISTORY, 'events': EVENTS, 'gapEvents': GAP_EVENTS, 'usEvents': US_EVENTS,
           'chokepoints': CHOKEPOINTS, 'lanes': LANE, 'flows': FLOWS, 'places': PLACES, 'hormuz': HORMUZ_STAGES,
           'countries': COUNTRIES, 'world': WORLD, 'products': PRODUCTS, 'percap': PERCAP, 'costs': COSTS, 'fiscal': FISCAL, 'spare': SPARE,
           'shutins': SHUTINS, 'assays': ASSAYS, 'northsea': NORTHSEA, 'midlandNL': MIDLAND_NL, 'curves': CURVES, 'pump': PUMP}
