# M6 — Tasks
[← M6](../L1-milestones/M6-compute-deployed.md) · [← L0](../L0-program.md) · [conventions](../conventions.md)

*64 racks. Tasks M6.2–M6.8 repeat per rack; durations below are for the full hall.*

| ID | Task | Type | Owner | Dur | Predecessors |
|---|---|---|---|---|---|
| M6.1.1 | Delivery schedule built against laydown capacity & crew throughput | DOC | LOG | 2d | M4.6.3 |
| M6.1.2 | Carrier/freight booking, delivery windows confirmed | DOC | LOG | 3d | M6.1.1 |
| M6.1.3 | 🚨 Receiving protocol published — notification, identification, routing | DOC | LOG | 1d | M6.1.1 |
| M6.2.1 | Delivery notification to site 24h ahead | DOC | LOG | — | M6.1.3 |
| M6.2.2 | Receive, verify against manifest, photograph | PHY | LOG | 6d | M6.2.1 |
| M6.2.3 | Damage inspection; DOA claim window preserved | PHY | LOG | — | M6.2.2 |
| M6.2.4 | Stage to laydown in installation sequence | PHY | LOG | — | M6.2.3 |
| M6.3.1 | Path-of-travel survey & floor protection | PHY | GC | 2d | M4.7.3 |
| M6.3.2 | De-crate & ramp | PHY | VEN | 6d | M6.2.4, M6.3.1 |
| M6.3.3 | Position, level, anchor per seismic detail | PHY | VEN | 6d | M6.3.2 |
| M6.4.1 | 🚨 Serial capture → rack → slot, at placement | HYB | OPS | 4d | M6.3.3 |
| M6.4.2 | Asset records loaded to inventory system | DIG | OPS | 2d | M6.4.1 |
| M6.5.1 | Busway tap & whip land to rack PDU, A/B | PHY | ELEC | 6d | M6.3.3 |
| M6.5.2 | Torque verification & thermographic scan | PHY | ELEC | 2d | M6.5.1 |
| M6.5.3 | Phase balance verified across row | DIG | ELEC | 1d | M6.5.2 |
| M6.6.1 | Manifold connection & QD seating | PHY | MECH | 6d | M6.3.3 |
| M6.6.2 | 🚨 Leak check per connection | PHY | MECH | 3d | M6.6.1 |
| M6.6.3 | Flow & delta-T verified per rack | HYB | MECH + CX | 3d | M6.6.2 |
| M6.7.1 | Scale-out cable pull rack → HDA | PHY | ICT | 10d | M6.3.3, M5.5.3 |
| M6.7.2 | Termination & optic seating | PHY | ICT | 6d | M6.7.1 |
| M6.7.3 | Management / BMC copper, OOB drops | PHY | ICT | 4d | M6.7.1 |
| M6.7.4 | Storage fabric cabling | PHY | ICT | 3d | M6.7.1 |
| M6.7.5 | Labeling applied per matrix | DOC | ICT | 3d | M6.7.2 |
| M6.8.1 | 100% link certification — loss, OTDR, optical power | DIG | ICT | 5d | M6.7.5 |
| M6.8.2 | Remediation of failures | PHY | ICT | 3d | M6.8.1 |
| M6.8.3 | 🚨 Patching matrix updated to **as-built** | DOC | ICT | 3d | M6.8.2 |
| M6.8.4 | Certification package delivered | DOC | ICT | 1d | M6.8.3 |

## Parallel lanes — sequence by rack, not by trade

```
per rack:  place → ┬ power   (M6.5)
                   ├ fluid   (M6.6)
                   └ cabling (M6.7)      ← all three concurrent on the SAME rack
```

Three crews in one aisle on different racks is throughput. Three crews queued on the same rack is a
stall. **Sequence the floor by rack, and publish the sequence** — otherwise trades self-organize into a
queue and nobody can explain where the day went.

**M6.7 carries the rail-alignment risk from M1.2.3.** Nothing in M6 detects it — M6.8.1 will certify
every link as good. It surfaces at M8.3.
