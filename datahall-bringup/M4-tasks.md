# M4 — Tasks
[← M4](../L1-milestones/M4-white-space-accepted.md) · [← L0](../L0-program.md) · [conventions](../conventions.md)

| ID | Task | Type | Owner | Dur | Predecessors |
|---|---|---|---|---|---|
| M4.1.1 | Building envelope weathertight | PHY | GC | — | construction |
| M4.1.2 | 🚨 Hall sealed; construction dust protocol in force | PHY | GC | 3d | M4.1.1 |
| M4.1.3 | Hot/cold aisle containment installed | PHY | GC | 5d | M4.1.2 |
| M4.1.4 | Temp & humidity control stable, logged 72h | DIG | MECH | 3d | M4.1.3 |
| M4.2.1 | Busway install & energization | PHY | ELEC | 10d | M4.1.2 |
| M4.2.2 | RPP / panel install, breaker schedule set | PHY | ELEC | 5d | M4.2.1 |
| M4.2.3 | Whip drops to rack positions | PHY | ELEC | 8d | M4.2.2 |
| M4.2.4 | Metering onboarded to BMS/DCIM | DIG | ELEC | 3d | M4.2.3 |
| M4.2.5 | Phase balance plan verified against rack layout | DOC | ELEC | 1d | M4.2.4 |
| M4.3.1 | CDU set, piped, and powered | PHY | MECH | 8d | M4.1.2 |
| M4.3.2 | Secondary loop piping complete to manifold positions | PHY | MECH | 10d | M4.3.1 |
| M4.3.3 | 🚨 Loop flush — particulate to spec | PHY | MECH | 3d | M4.3.2 |
| M4.3.4 | 🚨 Chemical treatment & fluid chemistry verification | PHY | MECH | 2d | M4.3.3 |
| M4.3.5 | Filtration commissioned, differential pressure baselined | PHY | MECH | 1d | M4.3.4 |
| M4.3.6 | 🚨 Pressure test held per spec duration | PHY | CX | 2d | M4.3.5 |
| M4.3.7 | 🚨 Flow rate & delta-T verified under simulated load | HYB | CX | 3d | M4.3.6 |
| M4.4.1 | Leak detection cable/sensors installed rack & row | PHY | MECH | 4d | M4.3.2 |
| M4.4.2 | 🚨 Leak detection **functionally triggered**, alarm path proven to BMS | HYB | CX | 2d | M4.4.1, M4.3.7 |
| M4.5.1 | Detection & suppression install complete | PHY | GC | — | construction |
| M4.5.2 | VESDA commissioned & sampled | PHY | CX | 3d | M4.5.1 |
| M4.5.3 | 🚨 AHJ inspection passed | DOC | AHJ | 2d | M4.5.2, M4.1.3 |
| M4.6.1 | Cleanliness verification to ISO class | PHY | OPS | 2d | M4.1.4 |
| M4.6.2 | Access control live; badge groups defined | HYB | SEC | 3d | M4.1.2 |
| M4.6.3 | Laydown & storage areas designated **and published** | DOC | LOG | 1d | M4.6.2 |
| M4.7.1 | Punch walk against written handover criteria | DOC | CX + PM | 2d | M4.2.5, M4.4.2, M4.5.3, M4.6.1 |
| M4.7.2 | Punch remediation | PHY | GC | 5d | M4.7.1 |
| M4.7.3 | 🚨 Handover accepted — signed by construction **and** deployment | DOC | CX + PM | 1d | M4.7.2 |

## Parallel lanes

```
Electrical:  M4.2.1 → M4.2.2 → M4.2.3 → M4.2.4 → M4.2.5 ─┐
Mechanical:  M4.3.1 → ... → M4.3.7 → M4.4.2 ─────────────┤
Life safety: M4.5.2 → M4.5.3 ────────────────────────────┼→ M4.7.1 → M4.7.3
Envelope:    M4.1.2 → M4.1.3 → M4.1.4 ───────────────────┤
Ops/sec:     M4.6.1, M4.6.2, M4.6.3 ─────────────────────┘
```

**Five independent lanes converging on one acceptance walk.** The lane that finishes last sets the date,
and it is almost always mechanical — M4.3.3 through M4.3.7 is a serial chain with no compression
available. Start the mechanical lane first.

**M4.6.3 published matters.** An undesignated or unpublished laydown area is how pallets end up in a
corridor and an inspection fails.
