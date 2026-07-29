<!-- GENERATED — do not edit. Source: program.yaml -->

# M6 — Tasks

[Program](../L0-program.md) / [M6](../L1-milestones/M6.md) / Tasks

| ID | Task | Type | Owners | Duration | Predecessors | Successors | Float | Status |
|---|---|---|---|---|---|---|---|---|
| `M6.1.1` | Delivery schedule built against laydown capacity & crew throughput | DOC | `LOG` | 2d | `M4.6.3` | `M6.1.2`, `M6.1.3` | 125d | `NOT_STARTED` |
| `M6.1.2` | Carrier/freight booking, delivery windows confirmed | DOC | `LOG` | 3d | `M6.1.1` | — | 199d | `NOT_STARTED` |
| `M6.1.3` | 🚨 Receiving protocol published — notification, identification, routing | DOC | `LOG` | 1d | `M6.1.1` | `M6.2.1` | 125d | `NOT_STARTED` |
| `M6.2.1` | Delivery notification to site 24h ahead | DOC | `LOG` | — | `M6.1.3` | `M6.2.2` | 125d | `NOT_STARTED` |
| `M6.2.2` | Receive, verify against manifest, photograph | PHY | `LOG` | 6d | `M6.2.1` | `M6.2.3` | 125d | `NOT_STARTED` |
| `M6.2.3` | Damage inspection; DOA claim window preserved | PHY | `LOG` | — | `M6.2.2` | `M6.2.4` | 125d | `NOT_STARTED` |
| `M6.2.4` | Stage to laydown in installation sequence | PHY | `LOG` | — | `M6.2.3` | `M6.3.2` | 125d | `NOT_STARTED` |
| `M6.3.1` | Path-of-travel survey & floor protection | PHY | `GC` | 2d | `M4.7.3` | `M6.3.2` | 97d | `NOT_STARTED` |
| `M6.3.2` | De-crate & ramp | PHY | `VEN` | 6d | `M6.2.4`, `M6.3.1` | `M6.3.3` | 97d | `NOT_STARTED` |
| `M6.3.3` | Position, level, anchor per seismic detail | PHY | `VEN` | 6d | `M6.3.2` | `M6.4.1`, `M6.5.1`, `M6.6.1`, `M6.7.1` | 97d | `NOT_STARTED` |
| `M6.4.1` | 🚨 Serial capture → rack → slot, at placement | HYB | `OPS` | 4d | `M6.3.3` | `M6.4.2` | 145d | `NOT_STARTED` |
| `M6.4.2` | Asset records loaded to inventory system | DIG | `OPS` | 2d | `M6.4.1` | `M7.4.2` | 145d | `NOT_STARTED` |
| `M6.5.1` | Busway tap & whip land to rack PDU, A/B | PHY | `ELEC` | 6d | `M6.3.3` | `M6.5.2` | 99d | `NOT_STARTED` |
| `M6.5.2` | Torque verification & thermographic scan | PHY | `ELEC` | 2d | `M6.5.1` | `M6.5.3` | 99d | `NOT_STARTED` |
| `M6.5.3` | Phase balance verified across row | DIG | `ELEC` | 1d | `M6.5.2` | `M7.1.1` | 99d | `NOT_STARTED` |
| `M6.6.1` | Manifold connection & QD seating | PHY | `MECH` | 6d | `M6.3.3` | `M6.6.2` | 97d | `NOT_STARTED` |
| `M6.6.2` | 🚨 Leak check per connection | PHY | `MECH` | 3d | `M6.6.1` | `M6.6.3` | 97d | `NOT_STARTED` |
| `M6.6.3` | Flow & delta-T verified per rack | HYB | `MECH` + `CX` | 3d | `M6.6.2` | `M7.1.2` | 97d | `NOT_STARTED` |
| `M6.7.1` | Scale-out cable pull rack → HDA | PHY | `ICT` | 10d | `M6.3.3`, `M5.5.3` | `M6.7.2`, `M6.7.3`, `M6.7.4` | 108d | `NOT_STARTED` |
| `M6.7.2` | Termination & optic seating | PHY | `ICT` | 6d | `M6.7.1` | `M6.7.5` | 108d | `NOT_STARTED` |
| `M6.7.3` | Management / BMC copper, OOB drops | PHY | `ICT` | 4d | `M6.7.1` | — | 128d | `NOT_STARTED` |
| `M6.7.4` | Storage fabric cabling | PHY | `ICT` | 3d | `M6.7.1` | — | 129d | `NOT_STARTED` |
| `M6.7.5` | Labeling applied per matrix | DOC | `ICT` | 3d | `M6.7.2` | `M6.8.1` | 108d | `NOT_STARTED` |
| `M6.8.1` | 100% link certification — loss, OTDR, optical power | DIG | `ICT` | 5d | `M6.7.5` | `M6.8.2` | 108d | `NOT_STARTED` |
| `M6.8.2` | Remediation of failures | PHY | `ICT` | 3d | `M6.8.1` | `M6.8.3` | 108d | `NOT_STARTED` |
| `M6.8.3` | 🚨 Patching matrix updated to as-built | DOC | `ICT` | 3d | `M6.8.2` | `M6.8.4`, `M7.4.2` | 108d | `NOT_STARTED` |
| `M6.8.4` | Certification package delivered | DOC | `ICT` | 1d | `M6.8.3` | — | 111d | `NOT_STARTED` |

_Rows are in dependency order, not ID order — the table reads in the order the work happens._
_Successors and float are derived. Float is pessimistic; a zero-float task cannot slip at all
without moving the programme finish. `(external)` marks work controlled outside the programme._
