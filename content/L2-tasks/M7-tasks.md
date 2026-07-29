<!-- GENERATED — do not edit. Source: program.yaml -->

# M7 — Tasks

[Program](../L0-program.md) / [M7](../L1-milestones/M7.md) / Tasks

| ID | Task | Type | Owners | Duration | Predecessors | Successors | Float | Status |
|---|---|---|---|---|---|---|---|---|
| `M7.1.1` | Energization sequence plan — inrush staged by row | DOC | `ELEC` | 1d | `M6.5.3` | `M7.1.2` | 99d | `NOT_STARTED` |
| `M7.1.2` | Sequential power-on per plan | HYB | `OPS` + `ELEC` | 3d | `M7.1.1`, `M6.6.3` | `M7.1.3`, `M7.2.2` | 97d | `NOT_STARTED` |
| `M7.1.3` | Idle draw verified vs. design; thermals confirmed | HYB | `OPS` + `MECH` | 2d | `M7.1.2` | — | 138d | `NOT_STARTED` |
| `M7.2.1` | BMC addressing & DHCP scope live | DIG | `NET-R` | 1d | `M5.4.3` | `M7.2.2` | 48d | `NOT_STARTED` |
| `M7.2.2` | BMC reachability verified, all 64 racks | DIG | `NET-R` | 2d | `M7.2.1`, `M7.1.2` | `M7.2.3`, `M7.3.2`, `M7.4.1` | 48d | `NOT_STARTED` |
| `M7.2.3` | Serial console access verified | DIG | `NET-R` | 1d | `M7.2.2` | — | 88d | `NOT_STARTED` |
| `M7.3.1` | Known-good firmware matrix published & version-pinned | DOC | `NET-R` | 1d | — | `M7.3.2` | 169d | `NOT_STARTED` |
| `M7.3.2` | 🚨 BIOS / BMC baseline applied fleet-wide | DIG | `NET-R` | 2d | `M7.3.1`, `M7.2.2` | `M7.3.3` | 48d | `NOT_STARTED` |
| `M7.3.3` | 🚨 NIC & NVLink switch firmware baselined | DIG | `NET-R` | 2d | `M7.3.2` | `M7.3.4`, `M7.5.1`, `M7.6.1` | 48d | `NOT_STARTED` |
| `M7.3.4` | Firmware manifest recorded per asset | DOC | `NET-R` | 1d | `M7.3.3` | `M7.7.1` | 48d | `NOT_STARTED` |
| `M7.4.1` | PXE / inventory sweep across fleet | DIG | `NET-R` | 1d | `M7.2.2` | `M7.4.2` | 84d | `NOT_STARTED` |
| `M7.4.2` | 🚨 Reconcile serial ↔ MAC ↔ rack/slot ↔ as-built matrix | DIG | `NET-R` | 2d | `M7.4.1`, `M6.8.3`, `M6.4.2` | `M7.4.3` | 84d | `NOT_STARTED` |
| `M7.4.3` | Exceptions investigated to zero unmatched assets | HYB | `NET-R` + `OPS` | 2d | `M7.4.2` | — | 84d | `NOT_STARTED` |
| `M7.5.1` | Subnet manager / control plane extended to compute leaf ports | DIG | `NET-R` | 1d | `M7.3.3`, `M5.6.4` | `M7.5.2` | 48d | `NOT_STARTED` |
| `M7.5.2` | Full topology discovery | DIG | `NET-R` | 1d | `M7.5.1` | `M7.5.3` | 48d | `NOT_STARTED` |
| `M7.5.3` | 🚨 Discovered topology diffed against intended design | DIG | `NET-R` | 2d | `M7.5.2` | `M7.5.4`, `M7.7.2` | 48d | `NOT_STARTED` |
| `M7.5.4` | Link error counters & optical power baselined fleet-wide | DIG | `NET-R` | 1d | `M7.5.3` | — | 80d | `NOT_STARTED` |
| `M7.6.1` | NVLink domain enumeration — 72 GPUs present per rack | DIG | `NET-R` | 1d | `M7.3.3` | `M7.6.2` | 82d | `NOT_STARTED` |
| `M7.6.2` | Partition state & NVLink bandwidth spot-check | DIG | `NET-R` | 2d | `M7.6.1` | — | 82d | `NOT_STARTED` |
| `M7.7.1` | Image build & pin — OS, driver, CUDA, NCCL, DOCA | DIG | `NET-R` | 3d | `M7.3.4` | `M7.7.2` | 48d | `NOT_STARTED` |
| `M7.7.2` | Bare-metal provisioning fleet-wide | DIG | `NET-R` | 2d | `M7.7.1`, `M7.5.3` | `M7.7.3` | 48d | `NOT_STARTED` |
| `M7.7.3` | Post-image health sweep | DIG | `NET-R` | 1d | `M7.7.2` | `M7.8.1`, `M7.9.1` | 48d | `NOT_STARTED` |
| `M7.8.1` | Storage mounts & throughput spot-check | DIG | `NET-R` | 2d | `M7.7.3`, `M5.2.2` | `M7.8.2` | 74d | `NOT_STARTED` |
| `M7.8.2` | Scheduler integration — Slurm or Kubernetes | DIG | `NET-R` | 2d | `M7.8.1` | — | 74d | `NOT_STARTED` |
| `M7.9.1` | Telemetry agents deployed; metrics flowing | DIG | `OPS` | 2d | `M7.7.3` | `M7.9.2` | 48d | `NOT_STARTED` |
| `M7.9.2` | 🚨 Monitoring thresholds & alert routing live before M8 | DIG | `OPS` | 1d | `M7.9.1` | `M8.1.1`, `M8.2.1` | 48d | `NOT_STARTED` |

_Rows are in dependency order, not ID order — the table reads in the order the work happens._
_Successors and float are derived. Float is pessimistic; a zero-float task cannot slip at all
without moving the programme finish. `(external)` marks work controlled outside the programme._
