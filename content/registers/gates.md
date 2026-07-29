<!-- GENERATED — do not edit. Source: program.yaml -->

# Gate register

[← Program](../L0-program.md) · [gates](gates.md) · [dependencies](dependencies.md) · [parallelization](parallelization.md)

> A **gate** is a task whose exit criteria must be evidenced before any successor begins. Gate
> exit is measured, not asserted. If the criterion is not evidenced the gate is not closed,
> regardless of schedule pressure.

## Gates in sequence (34)

| Gate | Milestone | Criterion | Evidence | Blocks |
|---|---|---|---|---|
| 🚨 `M1.2.3` | `M1` | Patching matrix reviewed as a design artifact — rail alignment, length feasibility, polarity, breakout, pathway fill | Signed review record | `M1.2.4` |
| 🚨 `M1.5.3` | `M1` | ICT contract executed with retention-through-validation | Executed contract | — |
| 🚨 `M1.6.3` | `M1` | Definition of done signed by all five parties | Signed document | — |
| 🚨 `M2.2.6` | `M2` | Physical path diversity verified by field walk | Route survey + photos | — |
| 🚨 `M2.7.4` | `M2` | OOB reachable with primary path down | Test record | `M2.8.4`, `M5.4.3` |
| 🚨 `M2.8.3` | `M2` | A/B failover tested under load | Test record | `M2.8.4` |
| 🚨 `M2.8.4` | `M2` | WAN acceptance signed | Signed acceptance | — |
| 🚨 `M4.1.2` | `M4` | Hall sealed, dust protocol in force | Inspection record | `M3.1.1`, `M3.2.1`, `M3.3.1`, `M4.1.3`, `M4.2.1`, `M4.3.1`, `M4.6.2` |
| 🚨 `M3.1.1` | `M3` | Overhead coordination resolved on site, three trades present | Coordination walk record | `M3.1.2` |
| 🚨 `M3.5.2` | `M3` | Label scheme reconciled to monitoring schema | Schema diff | — |
| 🚨 `M3.6.4` | `M3` | 100% Tier 1 + Tier 2 certification delivered | Certification package | `M3.6.5`, `M5.5.1` |
| 🚨 `M4.3.3` | `M4` | Loop flush — particulate to spec | Fluid sample analysis | `M4.3.4` |
| 🚨 `M4.3.4` | `M4` | Chemical treatment & chemistry verified | Chemistry report | `M4.3.5` |
| 🚨 `M4.3.6` | `M4` | Pressure test held for spec duration | Pressure log | `M4.3.7` |
| 🚨 `M4.3.7` | `M4` | Flow rate & delta-T verified under simulated load | Commissioning record | `M4.4.2` |
| 🚨 `M4.4.2` | `M4` | Leak detection functionally triggered, alarm proven to BMS | Trigger test record | `M4.7.1` |
| 🚨 `M4.5.3` | `M4` | AHJ inspection passed | AHJ sign-off | `M4.7.1` |
| 🚨 `M4.7.3` | `M4` | Handover accepted — signed by construction and deployment | Dual-signed acceptance | `M5.1.1`, `M5.2.1`, `M6.3.1` |
| 🚨 `M5.3.4` | `M5` | Switch firmware baselined to known-good matrix | Version manifest | `M5.5.1` |
| 🚨 `M5.4.3` | `M5` | OOB proven from remote with production down | Test record | `M7.2.1` |
| 🚨 `M5.6.2` | `M5` | Topology verified against intended design | Design diff | `M5.6.3` |
| 🚨 `M6.1.3` | `M6` | Receiving protocol published | Published procedure | `M6.2.1` |
| 🚨 `M6.4.1` | `M6` | Asset capture at placement — serial → rack → slot | Inventory export | `M6.4.2` |
| 🚨 `M6.6.2` | `M6` | Leak check per fluid connection | Per-rack record | `M6.6.3` |
| 🚨 `M6.8.3` | `M6` | Patching matrix updated to as-built | As-built matrix | `M6.8.4`, `M7.4.2` |
| 🚨 `M7.3.2` | `M7` | Firmware baselined fleet-wide | Firmware manifest | `M7.3.3` |
| 🚨 `M7.3.3` | `M7` | Firmware baselined fleet-wide | Firmware manifest | `M7.3.4`, `M7.5.1`, `M7.6.1` |
| 🚨 `M7.4.2` | `M7` | Inventory reconciled, zero unmatched | Reconciliation report | `M7.4.3` |
| 🚨 `M7.5.3` | `M7` | Discovered topology diffed against design | Topology diff | `M7.5.4`, `M7.7.2` |
| 🚨 `M7.9.2` | `M7` | Monitoring live before validation begins | Alert routing test | `M8.1.1`, `M8.2.1` |
| 🚨 `M8.3.3` | `M8` | Full-hall NCCL bandwidth + rail variance analysis | Benchmark results | `M8.3.4` |
| 🚨 `M8.3.4` | `M8` | Full-hall NCCL bandwidth + rail variance analysis | Benchmark results | `M8.4.1` |
| 🚨 `M8.6.2` | `M8` | Acceptance measured against definition of done | Evidence pack + signature | `M8.6.3`, `M8.8.4` |
| 🚨 `M8.8.4` | `M8` | Customer access enabled — clusters live | Access confirmation | — |

_In dependency order. **Blocks** is derived from task predecessors — it is what cannot
begin until this gate closes._
