"""Hand-curated facts of the AI-money long read. Every record carries `ref`, a key of _data/ai_article/refs.yml.
Numbers are as REPORTED by the cited page on the date given (US dollars, billions unless stated); where a source gives
a range or an "up to", that is kept in `note`. Nothing here is audited. Edit here, rerun build.py."""

# ---------------------------------------------------------------- capex (Platformonomics scoreboard, 31 Jul 2026)
CAPEX = {
    'companies': ['Amazon', 'Alphabet', 'Microsoft', 'Meta'],
    # guidance for calendar 2026, [low, high] in $bn, as given at the January, April and July 2026 earnings
    'guidance': {
        'Amazon': {'Jan': [200, 200], 'Apr': [200, 200], 'Jul': [220, 220]},
        'Alphabet': {'Jan': [175, 185], 'Apr': [180, 190], 'Jul': [195, 205]},
        'Microsoft': {'Jan': [140, 140], 'Apr': [190, 190], 'Jul': [175, 175]},
        'Meta': {'Jan': [115, 135], 'Apr': [125, 145], 'Jul': [130, 145]},
    },
    'q2': {'Amazon': 54.77, 'Alphabet': 44.9, 'Microsoft': 41.0, 'Meta': 31.08},
    'q2_yoy': {'Amazon': 65, 'Alphabet': 100, 'Microsoft': 69, 'Meta': 83},
    'note': {'Microsoft': 'January figure is "$140B+"; the July figure is lower because $15B was reclassified from finance leases to operating leases.'},
    'total_2025': 410, 'h1_2026': 305, 'ref': 'platformonomics',
}

# ---------------------------------------------------------------- labs
LABS = [
    {'id': 'openai', 'name': 'OpenAI', 'valuation': 852, 'raised': 122, 'rev': 36, 'rev_basis': '2026 forecast (FT, Sep 2026)',
     'when': 'round closed 31 Mar 2026, post-money', 'burn': 278, 'burn_basis': 'forecast negative free cash flow 2026-2030',
     'ref': 'cnbc-openai', 'ref2': 'lds-openai'},
    {'id': 'anthropic', 'name': 'Anthropic', 'valuation': 965, 'raised': 65, 'rev': 65, 'rev_basis': 'annualised run rate, end of July 2026',
     'when': 'Series H, May 2026, post-money', 'burn': None, 'burn_basis': 'not disclosed',
     'ref': 'anthropic-seriesH', 'ref2': 'anthropic-seriesH'},
    {'id': 'xai', 'name': 'xAI (inside SpaceX)', 'valuation': 250, 'raised': None, 'rev': 3.3, 'rev_basis': 'Q1 2026 revenue of $0.818B, annualised',
     'when': 'valued in the February 2026 merger with SpaceX', 'burn': None, 'burn_basis': 'Q1 2026 operating loss $2.47B',
     'ref': 'yahoo-xai', 'ref2': 'spacex-ipo'},
]

# ---------------------------------------------------------------- the web of deals: nodes and edges
NODES = [
    ('nvidia', 'Nvidia', 'supplier'), ('amd', 'AMD', 'supplier'), ('broadcom', 'Broadcom', 'supplier'),
    ('msft', 'Microsoft', 'hyper'), ('amzn', 'Amazon', 'hyper'), ('goog', 'Alphabet', 'hyper'), ('meta', 'Meta', 'hyper'),
    ('orcl', 'Oracle', 'cloud'), ('crwv', 'CoreWeave', 'cloud'), ('openai', 'OpenAI', 'lab'), ('anth', 'Anthropic', 'lab'),
    ('xai', 'xAI / SpaceX', 'lab'), ('sbg', 'SoftBank', 'investor'), ('credit', 'Bond and credit investors', 'finance'),
    ('banks', 'Banks', 'finance'),
]
# type: equity | compute (a customer's contract or spending commitment) | chips | debt (money lent) ; amt in $bn or None if unpriced
# basis words matter: 'up to', 'contract', 'stake', 'LOI', 'reported'.
EDGES = [
    # equity into the labs
    ('nvidia', 'openai', 'equity', 30, 'Nvidia put $30B into the 2026 round; Huang later said the earlier "$100B" was "never a commitment"', 'the-decoder'),
    ('amzn', 'openai', 'equity', 50, 'Up to $50B, of which $35B conditional on milestones', 'cnbc-openai'),
    ('sbg', 'openai', 'equity', 30, '$30B in three instalments (1 Apr, 1 Jul, 1 Oct 2026); $64.6B cumulative for about 13 %', 'tnw-softbank'),
    ('msft', 'openai', 'equity', 135, 'About 27 % of OpenAI valued at $135B in the October 2025 recapitalisation (a stake, not new cash)', 'msft-openai'),
    ('goog', 'anth', 'equity', 40, 'Up to $40B: $10B up front, $30B if targets are met', 'multiples-anthropic'),
    ('amzn', 'anth', 'equity', 33, 'Up to $33B in total ($8B earlier plus up to $25B more, $20B tied to milestones)', 'decrypt-amzn-anth'),
    ('nvidia', 'anth', 'equity', 10, 'Up to $10B committed November 2025', 'multiples-anthropic'),
    ('msft', 'anth', 'equity', 5, 'Up to $5B committed November 2025', 'multiples-anthropic'),
    ('nvidia', 'xai', 'equity', 2, 'Up to $2B of the equity portion of a planned $20B raise', 'the-decoder'),
    ('nvidia', 'crwv', 'equity', None, 'Equity stake in CoreWeave (size not stated in the sources read)', 'the-decoder'),
    ('amd', 'openai', 'equity', None, 'AMD gave OpenAI warrants for up to 160 million AMD shares (about 10 %) at one cent each, vesting with 6 GW of deployment and share-price milestones', 'xpu-amd'),
    # compute contracts: the labs' spending commitments
    ('openai', 'orcl', 'compute', 300, '$300B of cloud capacity over five years from 2027, paid as used', 'dcd-oracle'),
    ('openai', 'msft', 'compute', 250, 'An additional $250B of Azure services (October 2025)', 'msft-openai'),
    ('openai', 'amzn', 'compute', 138, '$38B (2025) plus $100B more over eight years; 2 GW of Trainium', 'cnbc-openai'),
    ('openai', 'broadcom', 'compute', None, '10 GW of custom accelerators co-developed with Broadcom', 'xpu-amd'),
    ('openai', 'amd', 'compute', None, '6 GW of AMD GPUs from the second half of 2026', 'xpu-amd'),
    ('openai', 'nvidia', 'chips', None, 'Letter of intent for 10 GW of Nvidia systems; Huang: the $100B "was never a commitment"', 'bs-huang'),
    ('anth', 'amzn', 'compute', 100, 'More than $100B of AWS spending through 2036, up to 5 GW', 'decrypt-amzn-anth'),
    ('anth', 'msft', 'compute', 30, '$30B of Azure capacity (November 2025)', 'multiples-anthropic'),
    ('anth', 'goog', 'compute', None, 'About 1 GW of TPUs in 2026 and about 3.5 GW more from 2027 via Broadcom', 'anthropic-broadcom'),
    ('anth', 'xai', 'compute', 45, '$1.25B a month for Colossus capacity to May 2029 (about $45B), terminable on 90 days notice', 'hothardware-spacex'),
    ('anth', 'crwv', 'compute', None, 'Reported customer of CoreWeave; contract value not stated', 'energymag-crwv'),
    # chips: who buys the GPUs
    ('orcl', 'nvidia', 'chips', 40, 'About $40B of Nvidia chips for the Abilene site that serves OpenAI', 'sdx-abilene'),
    ('crwv', 'nvidia', 'chips', None, 'GPU purchases financed with delayed-draw term loans', 'energymag-crwv'),
    ('xai', 'nvidia', 'chips', 40, 'A chip order for which SpaceX is reported to seek $40B of debt', 'investinglive-spacex'),
    ('nvidia', 'crwv', 'compute', 6.3, 'Nvidia agreed to buy CoreWeave\'s unsold capacity through 2032 for up to $6.3B', 'kavout-crwv'),
    # debt: money lent
    ('credit', 'meta', 'debt', 55, 'Two jumbo bonds: $30B (Oct 2025) and $25B (Apr 2026)', 'ifre-meta'),
    ('credit', 'goog', 'debt', 32, 'February 2026: $20B in dollars plus sterling and Swiss-franc bonds, including a 100-year tranche', 'streetinsider-alphabet'),
    ('credit', 'amzn', 'debt', 25, 'July 2026 $25B in eight tranches (and a $37B sale in March, plus euro and sterling bonds)', 'investing-amzn'),
    ('credit', 'orcl', 'debt', 30, 'February 2026: $25B of bonds plus mandatory convertible preferred, part of a $50B plan', 'ifre-oracle'),
    ('credit', 'meta', 'debt', 27.3, 'Hyperion: $27.3B of secured notes, 6.581 %, 2049, issued through a Blue Owl joint venture (Pimco $18B, BlackRock $3B+)', 'marcellus'),
    ('credit', 'xai', 'debt', 7, 'Apollo: about $7B of xAI GPU debt, the first $3.5B at a 10 % coupon', 'techleap-apollo'),
    ('credit', 'sbg', 'debt', 11.1, 'September 2026 bonds at 8.625 to 9.75 % (BB+)', 'tnw-softbank'),
    ('banks', 'sbg', 'debt', 40, 'A $40B loan facility signed March 2026; plus a margin loan on Arm', 'tnw-softbank'),
    ('banks', 'orcl', 'debt', 9.6, 'JPMorgan\'s two construction loans ($2.3B + $7.1B) for the Abilene campus Oracle leases', 'commercialobserver'),
    ('banks', 'crwv', 'debt', 2.6, 'August 2026 delayed-draw term loan at SOFR + 5.5 %, 97 cents on the dollar', 'energymag-crwv'),
]

# ---------------------------------------------------------------- commitments vs revenue
COMMIT = [
    {'lab': 'OpenAI', 'revenue': 36, 'revenue_basis': '2026 forecast', 'equity': 122, 'items': [
        ['Oracle', 300, 'five years from 2027', 'dcd-oracle'], ['Microsoft Azure', 250, 'incremental', 'msft-openai'], ['Amazon AWS', 138, '$38B + $100B over eight years', 'cnbc-openai']],
     'unpriced': 'Plus 10 GW from Nvidia (letter of intent), 6 GW from AMD and 10 GW from Broadcom, none priced in the sources read.'},
    {'lab': 'Anthropic', 'revenue': 65, 'revenue_basis': 'run rate, July 2026', 'equity': 65, 'items': [
        ['Amazon AWS', 100, 'through 2036', 'decrypt-amzn-anth'], ['SpaceX / xAI', 45, '$15B a year to May 2029', 'hothardware-spacex'], ['Microsoft Azure', 30, 'Nov 2025', 'multiples-anthropic']],
     'unpriced': 'Plus about 4.5 GW of Google TPUs (1 GW in 2026, about 3.5 GW from 2027) and a $50B US data-centre pledge, none priced as a contract.'},
]

# ---------------------------------------------------------------- spread curves: new-issue spreads over Treasuries (bp) and coupons (%)
CURVES = [
    {'id': 'meta25', 'label': 'Meta, 30 Oct 2025 ($30B)', 'color': '#0b4fc0', 'ref': 'ifre-meta', 'pts': [
        {'t': 5, 'sp': 50, 'cpn': 4.200, 'mat': 2030}, {'t': 7, 'sp': 70, 'cpn': 4.600, 'mat': 2032}, {'t': 10, 'sp': 78, 'cpn': 4.875, 'mat': 2035},
        {'t': 20, 'sp': 88, 'cpn': 5.500, 'mat': 2045}, {'t': 30, 'sp': 98, 'cpn': 5.625, 'mat': 2055}, {'t': 40, 'sp': 110, 'cpn': 5.750, 'mat': 2065}]},
    {'id': 'goog26', 'label': 'Alphabet, 9 Feb 2026 ($20B)', 'color': '#138374', 'ref': 'streetinsider-alphabet', 'pts': [
        {'t': 3, 'sp': 27, 'cpn': 3.700, 'mat': 2029}, {'t': 5, 'sp': None, 'cpn': 4.100, 'mat': 2031}, {'t': 7, 'sp': None, 'cpn': 4.400, 'mat': 2033},
        {'t': 10, 'sp': None, 'cpn': 4.800, 'mat': 2036}, {'t': 20, 'sp': None, 'cpn': 5.500, 'mat': 2046}, {'t': 30, 'sp': None, 'cpn': 5.650, 'mat': 2056},
        {'t': 40, 'sp': 95, 'cpn': 5.750, 'mat': 2066}]},
    {'id': 'amzn26', 'label': 'Amazon, 7 Jul 2026 ($25B)', 'color': '#b4552f', 'ref': 'investing-amzn', 'pts': [
        {'t': 3, 'sp': 40, 'cpn': None, 'mat': 2029}, {'t': 5, 'sp': 55, 'cpn': None, 'mat': 2031}, {'t': 7, 'sp': 70, 'cpn': None, 'mat': 2033},
        {'t': 10, 'sp': 80, 'cpn': None, 'mat': 2036}, {'t': 20, 'sp': 100, 'cpn': None, 'mat': 2046}, {'t': 30, 'sp': 110, 'cpn': None, 'mat': 2056},
        {'t': 40, 'sp': 125, 'cpn': None, 'mat': 2066}]},
]

# ---------------------------------------------------------------- the cost-of-money ladder
# rate in % per year; kind 'coupon' (fixed at issue), 'yield' (market, today), 'floating' (SOFR + margin, SOFR 3.89 % on 15 Oct 2026)
LADDER = [
    {'id': 'ust10', 'name': 'US Treasury, 10-year', 'tier': 'The state', 'rate': 5.10, 'kind': 'yield', 'asof': '15 Oct 2026', 'ref': 'fred'},
    {'id': 'ust30', 'name': 'US Treasury, 30-year', 'tier': 'The state', 'rate': 5.43, 'kind': 'yield', 'asof': '15 Oct 2026', 'ref': 'fred'},
    {'id': 'goog40', 'name': 'Alphabet 2066 (40-year)', 'tier': 'Hyperscaler, on its own name', 'rate': 5.75, 'kind': 'coupon', 'asof': 'Feb 2026', 'ref': 'streetinsider-alphabet'},
    {'id': 'meta40', 'name': 'Meta 2065 (40-year)', 'tier': 'Hyperscaler, on its own name', 'rate': 5.75, 'kind': 'coupon', 'asof': 'Oct 2025', 'rating': 'AA-', 'ref': 'ifre-meta'},
    {'id': 'amzn40', 'name': 'Amazon 2066 (40-year), implied', 'tier': 'Hyperscaler, on its own name', 'rate': 6.30, 'kind': 'yield', 'asof': '7 Jul 2026: 30-year Treasury 5.05 % + 125 bp', 'rating': 'AA', 'ref': 'investing-amzn', 'computed': True},
    {'id': 'hyp_i', 'name': 'Hyperion (Meta/Blue Owl) 2049, at issue', 'tier': 'Off balance sheet', 'rate': 6.581, 'kind': 'coupon', 'asof': 'Oct 2025', 'rating': 'A+', 'ref': 'marcellus'},
    {'id': 'hyp_n', 'name': 'Hyperion 2049, today (91 cents)', 'tier': 'Off balance sheet', 'rate': 7.55, 'kind': 'yield', 'asof': '19 Oct 2026', 'rating': 'A+', 'ref': 'edge-oct19', 'pair': 'hyp_i'},
    {'id': 'qts', 'name': 'QTS data-centre bond tied to Microsoft', 'tier': 'Off balance sheet', 'rate': 7.4, 'kind': 'yield', 'asof': 'Apr 2026, reported as "low to mid 7 %"; 7.4 is my midpoint', 'approx': True, 'rating': 'investment grade', 'ref': 'briefs-qts'},
    {'id': 'ddtl', 'name': 'CoreWeave delayed-draw loan, SOFR + 5.50 %', 'tier': 'Neocloud and lab-adjacent', 'rate': 9.39, 'kind': 'floating', 'asof': 'Aug 2026, SOFR 3.89 %', 'ref': 'energymag-crwv'},
    {'id': 'crwv31i', 'name': 'CoreWeave 2031 notes, at issue (par)', 'tier': 'Neocloud and lab-adjacent', 'rate': 9.75, 'kind': 'coupon', 'asof': 'Apr 2026, $1.75B', 'ref': 'coreweave-pr'},
    {'id': 'crwv31', 'name': 'CoreWeave 2031 notes, today', 'tier': 'Neocloud and lab-adjacent', 'rate': 14.0, 'kind': 'yield', 'asof': '15 Oct 2026 (touched 16 %)', 'ref': 'investing-cds', 'pair': 'crwv31i'},
    {'id': 'xai', 'name': 'xAI GPU debt to Apollo', 'tier': 'Neocloud and lab-adjacent', 'rate': 10.0, 'kind': 'coupon', 'asof': 'Dec 2025, 99 cents', 'ref': 'techleap-apollo'},
    {'id': 'sbg35', 'name': 'SoftBank 3.5-year dollar bond', 'tier': 'Neocloud and lab-adjacent', 'rate': 8.625, 'kind': 'coupon', 'asof': 'Sep 2026', 'rating': 'BB+', 'ref': 'tnw-softbank'},
    {'id': 'sbg75', 'name': 'SoftBank 7.5-year dollar bond', 'tier': 'Neocloud and lab-adjacent', 'rate': 9.75, 'kind': 'coupon', 'asof': 'Sep 2026', 'rating': 'BB+', 'ref': 'tnw-softbank'},
]

# ---------------------------------------------------------------- the deals table
DEALS = [
    ('2025-10-16', 'Beignet Investor (Meta / Blue Owl Hyperion)', 'Secured notes, 2049', 27.3, '6.581 %, A+; spread about T+185 at issue', 'Largest single-tranche corporate bond on record; Pimco $18B', 'off', 'marcellus'),
    ('2025-10-30', 'Meta', 'Senior notes, 6 tranches 2030-2065', 30, 'T+50 (5y) to T+110 (40y); coupons 4.2 to 5.75 %', 'Orders about $125B', 'ig', 'ifre-meta'),
    ('2026-02-02', 'Oracle', 'Senior notes, 8 tranches (part of a $50B debt-and-equity plan)', 25, 'concession to the existing curve', 'Orders above $125B, the largest book ever', 'ig', 'ifre-oracle'),
    ('2026-02-09', 'Alphabet', 'Senior notes, 7 tranches 2029-2066', 20, 'T+27 (3y) to T+95 (40y); coupons 3.7 to 5.75 %', 'Orders above $100B', 'ig', 'streetinsider-alphabet'),
    ('2026-02-10', 'Alphabet', 'Sterling and Swiss-franc notes incl. £1B 100-year', 12, '6.125 % coupon on the 100-year, yield about 6.05 %', '£9.5B of bids for the £1B century tranche', 'ig', 'techloy-alphabet'),
    ('2026-03', 'Amazon', 'Dollar bond (and a €14.5B eight-tranche euro deal)', 37, 'n/a', 'Larger book than July', 'ig', 'investing-amzn'),
    ('2026-03', 'SoftBank', 'Dollar loan facility', 40, 'n/a', 'Largest dollar loan in its history', 'loan', 'tnw-softbank'),
    ('2026-04-30', 'Meta', 'Senior notes, 6 tranches', 25, 'priced wider than the October 2025 deal', 'Orders $96B at the peak, against $125B', 'ig', 'bgov-meta'),
    ('2026-04-06', 'QTS (Blackstone), Microsoft-tied campus', 'Data-centre bonds', 3.9, 'yields low to mid 7 %', 'Peak demand $12.5B', 'off', 'briefs-qts'),
    ('2026-07-07', 'Amazon', 'Senior notes, 8 tranches 2029-2066', 25, 'T+40 (3y) to T+125 (40y)', 'Peak orders $62B, later $41B; cooler than March', 'ig', 'investing-amzn'),
    ('2026-08-11', 'CoreWeave', 'Delayed-draw term loan, 2031', 2.6, 'SOFR + 5.50 %, price 97, secured on contracts', 'Pitched at SOFR + 4.25-4.5 % and 99', 'neo', 'energymag-crwv'),
    ('2026-09-24', 'SoftBank', 'Dollar and euro bonds, 3.5 to 7.5 years', 11.1, '8.625 / 9.25 / 9.75 %; € 7.125 / 8 %; BB+', 'Funds the October OpenAI instalment', 'neo', 'tnw-softbank'),
    ('2026', 'SpaceX (xAI)', 'Debt to buy Nvidia chips: $10B bank loans + $30B investment-grade', 40, 'not priced', 'Apollo-led; Pimco a prospective lender (FT)', 'neo', 'investinglive-spacex'),
    ('2025-12', 'xAI', 'GPU-backed debt', 3.5, '10 % coupon, 99 cents', 'Apollo, $7B in total', 'neo', 'techleap-apollo'),
]

EVENTS = [  # for the rates chart
    ('2025-10-16', 'Hyperion bonds ($27B)'), ('2025-10-30', 'Meta $30B'), ('2026-02-02', 'Oracle $25B'),
    ('2026-02-09', 'Alphabet incl. 100-year'), ('2026-04-30', 'Meta $25B'), ('2026-07-07', 'Amazon $25B'),
    ('2026-09-16', 'Fed hikes to 3.75-4.00 %'), ('2026-10-15', 'CDS records'),
]

CDS = [  # five-year CDS, bp, on the date given
    ('Oracle', 288, '15 Oct 2026 (about 300 in the Reuters version)', 'securitas-oracle'),
    ('Oracle', 203, 'July 2026 (from 144 at the start of the year)', 'aiweekly-cds'),
    ('SoftBank', 424, '15 Oct 2026', 'investing-cds'),
    ('CoreWeave', 1100, 'above 1,000 on 15 Oct 2026', 'investing-cds'),
    ('Nvidia', 79, 'July 2026, a record at the time', 'aiweekly-cds'),
    ('Meta', 100, 'nearing 100, above July\'s peak (19 Oct 2026)', 'edge-oct19'),
]
