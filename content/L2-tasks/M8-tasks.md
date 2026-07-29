<!-- GENERATED — do not edit. Source: program.yaml -->

# M8 — Tasks

[Program](../L0-program.md) / [M8](../L1-milestones/M8.md) / Tasks

| ID | Task | Type | Owners | Duration | Predecessors | Successors | Float | Status |
|---|---|---|---|---|---|---|---|---|
| `M8.1.1` | DCGM diagnostics — short level, full fleet | DIG | `NET-R` | 1d | `M7.9.2` | `M8.1.2` | 48d | `NOT_STARTED` |
| `M8.1.2` | DCGM diagnostics — extended level, full fleet | DIG | `NET-R` | 3d | `M8.1.1` | `M8.1.3`, `M8.3.1`, `M8.5.1` | 48d | `NOT_STARTED` |
| `M8.1.3` | HBM / ECC error sweep & threshold check | DIG | `NET-R` | 1d | `M8.1.2` | `M8.1.4` | 66d | `NOT_STARTED` |
| `M8.1.4` | Thermal soak at sustained node load | HYB | `NET-R` + `MECH` | 3d | `M8.1.3` | `M8.1.5` | 66d | `NOT_STARTED` |
| `M8.1.5` | Power draw vs. envelope, per rack and per row | HYB | `NET-R` + `ELEC` | 1d | `M8.1.4` | — | 66d | `NOT_STARTED` |
| `M8.2.1` | Link error counter delta vs. M7.5.4 baseline | DIG | `NET-R` | 1d | `M7.9.2` | `M8.2.2` | 49d | `NOT_STARTED` |
| `M8.2.2` | Optical power sweep against thresholds; flag marginals | DIG | `NET-R` | 1d | `M8.2.1` | `M8.2.3` | 49d | `NOT_STARTED` |
| `M8.2.3` | Retransmit / symbol error analysis; flapping link identification | DIG | `NET-R` | 1d | `M8.2.2` | `M8.2.4`, `M8.3.1` | 49d | `NOT_STARTED` |
| `M8.2.4` | Congestion & incast behavior test | DIG | `NET-R` | 2d | `M8.2.3` | — | 70d | `NOT_STARTED` |
| `M8.3.1` | NCCL all_reduce — single rack | DIG | `NET-R` | 1d | `M8.1.2`, `M8.2.3` | `M8.3.2` | 48d | `NOT_STARTED` |
| `M8.3.2` | NCCL all_reduce / all_gather — pod scale | DIG | `NET-R` | 1d | `M8.3.1` | `M8.3.3` | 48d | `NOT_STARTED` |
| `M8.3.3` | 🚨 NCCL bus bandwidth — full hall, 4,608 GPUs | DIG | `NET-R` | 2d | `M8.3.2` | `M8.3.4` | 48d | `NOT_STARTED` |
| `M8.3.4` | 🚨 Bandwidth variance analysis by rail — rail misalignment detection | DIG | `NET-R` | 1d | `M8.3.3` | `M8.4.1` | 48d | `NOT_STARTED` |
| `M8.4.1` | Sustained synthetic training run, full footprint | DIG | `NET-R` | 5–14d | `M8.3.4` | `M8.4.2` | 48d | `NOT_STARTED` |
| `M8.4.2` | Fault rate tracked against SLA threshold during soak | DIG | `NET-R` | — | `M8.4.1` | `M8.4.3` | 48d | `NOT_STARTED` |
| `M8.4.3` | Uptime measured across the soak window | DIG | `NET-R` | — | `M8.4.2` | `M8.6.1` | 48d | `NOT_STARTED` |
| `M8.5.1` | Fault triage & classification — node / link / switch / thermal / power | HYB | `OPS` + `NET-R` | — | `M8.1.2` | `M8.5.2` | 61d | `NOT_STARTED` |
| `M8.5.2` | Isolate: device vs. optic vs. cable vs. config | HYB | `OPS` + `NET-R` | — | `M8.5.1` | `M8.5.3`, `M8.5.4` | 61d | `NOT_STARTED` |
| `M8.5.3` | Replace from onsite spares | PHY | `OPS` | — | `M8.5.2` | `M8.5.5` | 61d | `NOT_STARTED` |
| `M8.5.4` | ICT remediation of cabling faults (requires M1.5.3 retention) | PHY | `ICT` | — | `M8.5.2` | `M8.5.5` | 61d | `NOT_STARTED` |
| `M8.5.5` | Re-validate repaired units | DIG | `NET-R` | — | `M8.5.3`, `M8.5.4` | `M8.5.6` | 61d | `NOT_STARTED` |
| `M8.5.6` | RMA raised, tracked to credit; spares replenished | DOC | `OPS` | — | `M8.5.5` | `M8.5.7` | 61d | `NOT_STARTED` |
| `M8.5.7` | Repeat-fault-by-rack analysis — systemic vs. one-off | DIG | `PM` | 1d | `M8.5.6` | `M8.7.1` | 61d | `NOT_STARTED` |
| `M8.6.1` | Compile evidence against each acceptance criterion | DOC | `PM` | 2d | `M8.4.3` | `M8.6.2` | 48d | `NOT_STARTED` |
| `M8.6.2` | 🚨 Customer acceptance review | DOC | `CUST` + `PM` | 1d | `M8.6.1` | `M8.6.3`, `M8.8.4` | 48d | `NOT_STARTED` |
| `M8.6.3` | Exceptions & conditional acceptance items logged with owners | DOC | `PM` | 1d | `M8.6.2` | — | 48d | `NOT_STARTED` |
| `M8.7.1` | As-built patching matrix finalized | DOC | `ICT` | 1d | `M8.5.7` | `M8.7.2` | 61d | `NOT_STARTED` |
| `M8.7.2` | Test result package — all tiers, all links, all nodes | DOC | `ICT` + `NET-R` | 2d | `M8.7.1` | `M8.7.3` | 61d | `NOT_STARTED` |
| `M8.7.3` | Asset register & firmware manifest final | DOC | `OPS` | 1d | `M8.7.2` | `M8.8.1` | 61d | `NOT_STARTED` |
| `M8.8.1` | Runbooks & escalation model handed to ops | DOC | `PM` | 2d | `M8.7.3` | `M8.8.2` | 61d | `NOT_STARTED` |
| `M8.8.2` | Spares location, ownership, and replenishment trigger assigned | DOC | `OPS` | 1d | `M8.8.1` | `M8.8.3` | 61d | `NOT_STARTED` |
| `M8.8.3` | Monitoring thresholds transitioned to steady-state | DIG | `OPS` | 1d | `M8.8.2` | `M8.8.4` | 61d | `NOT_STARTED` |
| `M8.8.4` | 🚨 Customer access enabled — clusters live | HYB | `NET-R` + `CUST` | 1d | `M8.6.2`, `M8.8.3` | — | 48d | `NOT_STARTED` |

_Rows are in dependency order, not ID order — the table reads in the order the work happens._
_Successors and float are derived. Float is pessimistic; a zero-float task cannot slip at all
without moving the programme finish. `(external)` marks work controlled outside the programme._
