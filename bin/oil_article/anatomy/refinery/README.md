# refinery — crude distillation unit (anatomy figure)

A bench model of an atmospheric crude distillation unit for the oil-market long read. The reader picks a crude
barrel (Brent, Oman, Canadian heavy Synbit); five product sight glasses fill to that crude's straight-run yield.
A heavy crude visibly gives a tall residue column and little naphtha, while straight-run gasoil (diesel) stays at
23–29 % for every grade.

## Files

| File | What it is |
|---|---|
| `model.mjs` | The truth: cut points, yields (one table), furnace and column figures, the readout string. Every number on the page comes from here. |
| `build.mjs` | Geometry (anatomy kit: `iso-kit`, `lathe`, `tube`, `audit`), card, page. Writes both themes. |
| `live.js` | Picking, eased sight-glass levels, valve levers, crude tint of the feed lines, idle tour, the WebGL burner flames (SVG fallback without WebGL), height `postMessage` to the post. |
| `shots/` | Headless checks (desktop, phone, light, close-ups, fallback, flame contact sheet, line-end rings, `audit.txt`). |

Build: `node build.mjs` (dark) and `node build.mjs --light`, written to
`assets/oil-article/anatomy/refinery.html` and `refinery-light.html`. `--audit` runs the geometry audit
(must end `audit passed`); `--fig="Fig 4"` changes the card's figure number. Line-end check:
`node ~/.claude/skills/anatomy/scripts/lines.mjs <page>` (must print `line ends: 0`).

## Numbers and where they come from

| Quantity | Value | Source |
|---|---|---|
| Atmospheric heater outlet | 343–371 °C (650–700 °F); vacuum heater ~399 °C | OSHA Technical Manual, Sec. IV Ch. 2, Petroleum Refining Processes |
| Column pressure, trays | ~1–2 bar(g), ~30–50 trays (40 drawn) | Typical values, Gary, Handwerk & Kaiser, *Petroleum Refining*, ch. 4 |
| Cut points (TBP) | LPG C1–C4; naphtha 15–150 °C; kerosene/jet 150–230; gasoil/diesel 230–375; atmospheric residue > 375 (VGO 375–550, vacuum residue > 550) | TotalEnergies crude assays |
| Brent | 38.1 °API, ~0.4 % S; naphtha 21.2, kero 13.3, gasoil 26.1, residue 36.7 (> 550: 13.6) wt % | TotalEnergies assay, `trading.totalenergies.com/wp-content/uploads/2025/11/BRENT.pdf` |
| Oman | 33.2 °API, ~1.1 % S; 13.3 / 12.0 / 23.3 / 50.1 (> 550: 24.4) wt % | TotalEnergies assay (same URL pattern) |
| Canadian heavy Synbit | 19.0 °API, 2.97 % S; 5.5 / 8.3 / 28.7 / 57.5 (> 550: ~28) wt % | TotalEnergies assay (same URL pattern) |
| LPG | remainder to 100: Brent 2.7, Oman 1.3, Synbit 0.0 wt % | computed in `model.mjs` |
| Murban (not drawn) | 40.5 °API, 0.79 % S; 20.7 / 18.3 / 27.6 / 32.3 (> 550: 9.7) | TotalEnergies assay, kept as a comment |

Yields are **weight %**, and the glasses share one 0–60 wt % scale (ticks every 5, major every 10), so levels
compare across glasses and crudes. The residue glass shows vacuum residue (> 550 °C, dark) under vacuum gasoil.

## The object

- **Feed:** three drums on a skid (painted bands in each crude's colour), each with a saddle pad, ball valve and
  lever (along the pipe = open) into a manifold; charge pump (casing, bearing housing, coupling guard, finned motor,
  terminal box) on its own skid; riser to the convection section.
- **Fired heater:** box furnace on four legs with base plates, four burners on a fuel-gas header from a regulator
  box, cut-away window (refractory hearth, burner tiles, radiant coil, firelight, flames), peep doors, panel seams,
  convection bank with return-bend boxes, hood, stack with damper ring, platform with railing and a ladder.
- **Transfer line** with bellows, band and a support post with a shoe, into the flash-zone nozzle.
- **Column:** base ring with anchor bolts, skirt with access opening, seven shell courses, 2:1 head, cut-away
  window over eight trays (downcomers, outlet weirs, valve caps), two manways, a pressure gauge and three
  thermowells; radial draw nozzles to two side strippers (kerosene, diesel; each with steam stub, head and skirt);
  overhead line to a shell-and-tube condenser on a frame, condenser drop to the reflux drum on saddles, reflux
  back to the column, deck on beams clipped to the shell, handrail.
- **Products:** five sight glasses on a rack (base and cap blocks, guard rods, graduated scale plates, lit level
  mark), rundown lines on a sleeper, residue stub to a residue-coloured blind flange (toward a vacuum unit / cracker).

Colour is used only for streams: crude orange (light amber Brent to dark brown Synbit), naphtha green, jet pale,
diesel blue, residue brown (vacuum residue darker), LPG grey-blue, fire in the firebox.

## Checks (26 Oct 2026)

- `node build.mjs --audit`: `audit passed` (33 tubes, 252 solids, 326 items; clearance, terminals, support,
  depth order, folds, self-overlap, wobble, crowding, stand-in shapes all 0).
- `lines.mjs`: `line ends: 0` on dark and light, and in the no-WebGL fallback.
- Console clean on desktop, 390 px phone, reduced motion, no-WebGL; the flame contact sheet shows continuous
  flicker with no pops.
