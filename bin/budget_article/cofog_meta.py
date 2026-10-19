"""COFOG (UN Classification of the Functions of Government, 1999): the ten divisions and their groups, and the
eight colour groups of the figures (the palette order is fixed: slot 1 first)."""
FUNCS = {
    "GF01": ("General public services", "Parliament, ministries of finance and foreign affairs, tax collection, basic research, and the interest on public debt"),
    "GF02": ("Defence", "Armed forces, military aid to other countries, civil defence, defence research"),
    "GF03": ("Public order and safety", "Police, fire brigades, courts, prisons"),
    "GF04": ("Economic affairs", "Roads, rail, energy, agriculture, industry policy, labour-market administration, R&D in those fields"),
    "GF05": ("Environmental protection", "Waste, waste water, pollution abatement, protection of nature"),
    "GF06": ("Housing and community amenities", "Housing development, water supply, street lighting, community development"),
    "GF07": ("Health", "Hospitals, doctors, pharmaceuticals and medical products, public health programmes"),
    "GF08": ("Recreation, culture and religion", "Sport, museums, libraries, public broadcasting, support to religious bodies"),
    "GF09": ("Education", "Schools, universities, subsidiary services such as school transport and meals"),
    "GF10": ("Social protection", "Pensions, sickness and disability benefits, family allowances, unemployment benefits, social assistance"),
}
SUBS = {
    "GF0101": "Executive and legislative organs, financial and fiscal affairs, external affairs", "GF0102": "Foreign economic aid",
    "GF0103": "General services", "GF0104": "Basic research", "GF0105": "R&D in general public services",
    "GF0106": "General public services n.e.c.", "GF0107": "Public debt transactions (interest)",
    "GF0108": "Transfers between levels of government",
    "GF0201": "Military defence", "GF0202": "Civil defence", "GF0203": "Foreign military aid", "GF0204": "R&D in defence", "GF0205": "Defence n.e.c.",
    "GF0301": "Police", "GF0302": "Fire protection", "GF0303": "Law courts", "GF0304": "Prisons", "GF0305": "R&D in public order", "GF0306": "Public order n.e.c.",
    "GF0401": "General economic, commercial and labour affairs", "GF0402": "Agriculture, forestry, fishing, hunting", "GF0403": "Fuel and energy",
    "GF0404": "Mining, manufacturing, construction", "GF0405": "Transport", "GF0406": "Communication", "GF0407": "Other industries",
    "GF0408": "R&D in economic affairs", "GF0409": "Economic affairs n.e.c.",
    "GF0501": "Waste management", "GF0502": "Waste water management", "GF0503": "Pollution abatement", "GF0504": "Protection of biodiversity and landscape",
    "GF0505": "R&D in environmental protection", "GF0506": "Environmental protection n.e.c.",
    "GF0601": "Housing development", "GF0602": "Community development", "GF0603": "Water supply", "GF0604": "Street lighting",
    "GF0605": "R&D in housing", "GF0606": "Housing n.e.c.",
    "GF0701": "Medical products and equipment", "GF0702": "Outpatient services", "GF0703": "Hospital services", "GF0704": "Public health services",
    "GF0705": "R&D in health", "GF0706": "Health n.e.c.",
    "GF0801": "Recreational and sporting services", "GF0802": "Cultural services", "GF0803": "Broadcasting and publishing", "GF0804": "Religious and community services",
    "GF0805": "R&D in recreation and culture", "GF0806": "Recreation and culture n.e.c.",
    "GF0901": "Pre-primary and primary education", "GF0902": "Secondary education", "GF0903": "Post-secondary non-tertiary education", "GF0904": "Tertiary education",
    "GF0905": "Education not defined by level", "GF0906": "Subsidiary services to education", "GF0907": "R&D in education", "GF0908": "Education n.e.c.",
    "GF1001": "Sickness and disability", "GF1002": "Old age (pensions)", "GF1003": "Survivors", "GF1004": "Family and children", "GF1005": "Unemployment",
    "GF1006": "Housing allowances", "GF1007": "Social exclusion n.e.c.", "GF1008": "R&D in social protection", "GF1009": "Social protection n.e.c.",
}
# colour groups in palette-slot order
GROUPS = [
    ("soc", "Social protection", ["GF10"]), ("hea", "Health", ["GF07"]), ("edu", "Education", ["GF09"]),
    ("env", "Environment, housing, culture", ["GF05", "GF06", "GF08"]), ("ord", "Public order", ["GF03"]),
    ("eco", "Economic affairs", ["GF04"]), ("gen", "General public services", ["GF01"]), ("def", "Defence", ["GF02"]),
]
