# M3 — Tasks
[← M3](../L1-milestones/M3-backbone-cabling.md) · [← L0](../L0-program.md) · [conventions](../conventions.md)

| ID | Task | Type | Owner | Dur | Predecessors |
|---|---|---|---|---|---|
| M3.1.1 | 🚨 Overhead coordination walk — tray vs. mech vs. elec, resolved on site | PHY | GC | 2d | M1.1.5, M4.1.2 |
| M3.1.2 | Tray & ladder rack install, main runs | PHY | ICT | 8d | M3.1.1 |
| M3.1.3 | Basket / branch pathway to row positions | PHY | ICT | 5d | M3.1.2 |
| M3.1.4 | Pathway fill check against BOM trunk count | DOC | ICT | 1d | M3.1.3 |
| M3.2.1 | MDA cabinet install & anchoring | PHY | ICT | 3d | M4.1.2 |
| M3.2.2 | MDA patch fields & cassettes populated | PHY | ICT | 4d | M3.2.1 |
| M3.2.3 | MDA grounding & bonding | PHY | ICT | 1d | M3.2.2 |
| M3.3.1 | HDA cabinet install per row | PHY | ICT | 5d | M4.1.2 |
| M3.3.2 | HDA patch fields & cassettes populated | PHY | ICT | 5d | M3.3.1 |
| M3.4.1 | Backbone trunk pull MDA → HDA | PHY | ICT | 8d | M3.1.3, M3.2.2, M3.3.2 |
| M3.4.2 | Trunk termination & dressing | PHY | ICT | 5d | M3.4.1 |
| M3.5.1 | Label print & apply per ANSI/TIA-606 | DOC | ICT | 3d | M3.4.2 |
| M3.5.2 | 🚨 Label scheme reconciled to monitoring schema | DOC | NET-R | 1d | M3.5.1 |
| M3.6.1 | Tier 1 insertion loss test, 100% of links | DIG | ICT | 4d | M3.5.1 |
| M3.6.2 | Tier 2 OTDR test, 100% of links | DIG | ICT | 4d | M3.6.1 |
| M3.6.3 | Remediation of failed links | PHY | ICT | 3d | M3.6.2 |
| M3.6.4 | 🚨 Certification package delivered — payment milestone | DOC | ICT | 2d | M3.6.3 |
| M3.6.5 | As-built reconciled to patching matrix | DOC | ICT | 2d | M3.6.4 |

## Parallel lanes

`M3.1` (pathway), `M3.2` (MDA) and `M3.3` (HDA) run **concurrently** — all three gated by M4.1.2
(envelope sealed). They converge at M3.4.1, which cannot start until all three complete.

**M3.1.1 is the seam.** Three trades, one overhead volume. Resolve on site with all three present, or
whoever hangs steel last does it twice.
