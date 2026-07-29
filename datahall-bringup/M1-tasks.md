# M1 — Tasks
[← M1](../L1-milestones/M1-design-freeze.md) · [← L0](../L0-program.md) · [conventions](../conventions.md)

| ID | Task | Type | Owner | Dur | Predecessors |
|---|---|---|---|---|---|
| M1.1.1 | Rack elevation drawings issued | DOC | PM | 3d | — |
| M1.1.2 | Floor plan with rack coordinates, aisle containment | DOC | PM | 3d | M1.1.1 |
| M1.1.3 | Power layout — busway runs, RPP placement, whip schedule | DOC | ELEC | 4d | M1.1.2 |
| M1.1.4 | Fluid layout — CDU placement, manifold runs, QD schedule | DOC | MECH | 4d | M1.1.2 |
| M1.1.5 | Overhead coordination model — tray vs. mech vs. elec | DOC | GC | 5d | M1.1.3, M1.1.4 |
| M1.2.1 | Fabric topology design — rail assignment, oversubscription | DOC | NET-R | 5d | M1.1.2 |
| M1.2.2 | Patching matrix generated — src/dst, media, length, polarity, label | DOC | NET-R | 5d | M1.2.1 |
| M1.2.3 | 🚨 Matrix design review — rail alignment, length feasibility, breakout, pathway fill | DOC | NET-R | 2d | M1.2.2 |
| M1.2.4 | ICT cutsheets issued from matrix | DOC | NET-R | 2d | M1.2.3 |
| M1.3.1 | BOM derived from matrix — cable, cassettes, panels, optics | DOC | ICT | 3d | M1.2.4 |
| M1.3.2 | OFCI/CFCI split decided; delay-risk allocation written | DOC | PM | 2d | M1.3.1 |
| M1.4.1 | Optics & trunk PO released | DOC | PM | 1d | M1.3.2 |
| M1.4.2 | Switch & cabinet PO released | DOC | PM | 1d | M1.3.2 |
| M1.4.3 | Long-lead tracker established with vendor milestone dates | DOC | PM | 2d | M1.4.1, M1.4.2 |
| M1.5.1 | ICT scope of work drafted from BOM | DOC | PM | 3d | M1.3.1 |
| M1.5.2 | Prequalification — BICSI certs, manufacturer cert, DC references | DOC | PM | 5d | M1.5.1 |
| M1.5.3 | 🚨 Contract executed **with retention-through-validation term** | DOC | PM | 5d | M1.5.2 |
| M1.6.1 | Draft definition of done in measurable terms | DOC | PM | 2d | — |
| M1.6.2 | Vocabulary alignment session — construction, deployment, network, ops, account | DOC | PM | 1d | M1.6.1 |
| M1.6.3 | 🚨 Definition of done signed by all five parties | DOC | CUST | 3d | M1.6.2 |

## Parallel lanes

`M1.1 → M1.2 → M1.3 → M1.4` is the design→procurement chain.
`M1.5` branches after M1.3.1. `M1.6` runs fully independent — start it day one, it gates nothing
upstream and everything downstream.
