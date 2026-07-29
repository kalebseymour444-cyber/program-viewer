<!-- GENERATED — do not edit. Source: program.yaml -->

# Parallelization register

[← Program](../L0-program.md) · [gates](gates.md) · [dependencies](dependencies.md) · [parallelization](parallelization.md)

> What can run at the same time, what cannot, and where parallel lanes collapse into a single
> point. Every figure is derived from the pessimistic schedule.

## Convergence points

| Task |  | Lanes | Merging |
|---|---|---|---|
| `M4.7.1` | Punch walk against written handover criteria | 4 | `M4.2`, `M4.4`, `M4.5`, `M4.6` |
| `M3.4.1` | Backbone trunk pull MDA → HDA | 3 | `M3.1`, `M3.2`, `M3.3` |
| `M2.5.1` | Cross-connect requests submitted per circuit | 2 | `M2.3`, `M2.4` |
| `M3.1.1` | Overhead coordination walk — tray vs. mech vs. elec, resolved on site | 2 | `M1.1`, `M4.1` |
| `M5.5.1` | Spine–leaf trunk install per patching matrix | 2 | `M3.6`, `M5.3` |
| `M6.7.1` | Scale-out cable pull rack → HDA | 2 | `M5.5`, `M6.3` |
| `M7.4.2` | Reconcile serial ↔ MAC ↔ rack/slot ↔ as-built matrix | 2 | `M6.4`, `M6.8` |
| `M7.5.1` | Subnet manager / control plane extended to compute leaf ports | 2 | `M5.6`, `M7.3` |
| `M7.8.1` | Storage mounts & throughput spot-check | 2 | `M5.2`, `M7.7` |
| `M8.3.1` | NCCL all_reduce — single rack | 2 | `M8.1`, `M8.2` |

_A task fed **directly** by two or more other packages. **The last lane sets the date** —
managing the average of a convergence is meaningless; track the slowest feeder and staff
against it._

_Counted on immediate predecessors only. A lane that reaches a task through an intermediate
package is real but is not counted here, so this list is narrower than an eye-judged one._

## Concurrent packages

| Milestone | Packages | Count | Window |
|---|---|---|---|
| `M1` | `M1.1`, `M1.2` | 2 | day 0–20 |
| `M1` | `M1.1`, `M1.2`, `M1.6` | 3 | day 0–20 |
| `M1` | `M1.1`, `M1.6` | 2 | day 0–15 |
| `M1` | `M1.3`, `M1.4`, `M1.5` | 3 | day 20–36 |
| `M1` | `M1.3`, `M1.5` | 2 | day 20–36 |
| `M1` | `M1.4`, `M1.5` | 2 | day 23–36 |
| `M2` | `M2.1`, `M2.2`, `M2.3`, `M2.4`, `M2.6`, `M2.7` | 6 | day 6–206 |
| `M2` | `M2.1`, `M2.2`, `M2.3`, `M2.7` | 4 | day 6–186 |
| `M2` | `M2.2`, `M2.3`, `M2.4`, `M2.5`, `M2.6` | 5 | day 9–206 |
| `M2` | `M2.4`, `M2.5`, `M2.6` | 3 | day 129–206 |
| `M3` | `M3.1`, `M3.4` | 2 | day 15–43 |
| `M3` | `M3.2`, `M3.3` | 2 | day 3–13 |
| `M3` | `M3.5`, `M3.6` | 2 | day 43–61 |
| `M4` | `M4.1`, `M4.2`, `M4.3`, `M4.4`, `M4.5`, `M4.6` | 6 | day 0–34 |
| `M4` | `M4.1`, `M4.2`, `M4.3`, `M4.5`, `M4.6` | 5 | day 0–32 |
| `M4` | `M4.2`, `M4.3`, `M4.4` | 3 | day 3–34 |
| `M5` | `M5.1`, `M5.2` | 2 | day 42–50 |
| `M5` | `M5.3`, `M5.4` | 2 | day 50–119 |
| `M5` | `M5.3`, `M5.4`, `M5.5`, `M5.6` | 4 | day 50–119 |
| `M5` | `M5.4`, `M5.5` | 2 | day 52–119 |
| `M5` | `M5.4`, `M5.6` | 2 | day 52–119 |
| `M6` | `M6.1`, `M6.2` | 2 | day 7–16 |
| `M6` | `M6.4`, `M6.5`, `M6.6` | 3 | day 56–68 |
| `M7` | `M7.1`, `M7.2`, `M7.3`, `M7.4`, `M7.5`, `M7.6` | 6 | day 0–131 |
| `M7` | `M7.1`, `M7.3` | 2 | day 0–127 |
| `M7` | `M7.2`, `M7.3`, `M7.4` | 3 | day 0–127 |
| `M7` | `M7.2`, `M7.3`, `M7.4`, `M7.5`, `M7.6` | 5 | day 0–131 |
| `M7` | `M7.3`, `M7.4`, `M7.5`, `M7.6`, `M7.7` | 5 | day 0–133 |
| `M7` | `M7.5`, `M7.6`, `M7.7` | 3 | day 126–133 |
| `M7` | `M7.8`, `M7.9` | 2 | day 133–137 |
| `M8` | `M8.1`, `M8.2`, `M8.3`, `M8.5` | 4 | day 136–145 |
| `M8` | `M8.1`, `M8.2`, `M8.3`, `M8.5`, `M8.7` | 5 | day 136–145 |
| `M8` | `M8.1`, `M8.3`, `M8.7` | 3 | day 136–145 |
| `M8` | `M8.4`, `M8.6`, `M8.8` | 3 | day 145–163 |
| `M8` | `M8.4`, `M8.8` | 2 | day 145–163 |
| `M8` | `M8.6`, `M8.8` | 2 | day 145–163 |

_Packages whose scheduled windows overlap, so they can be staffed concurrently._

## Owner contention

| Owner | Peak concurrent tasks | Overlapping pairs | Peak window |
|---|---|---|---|
| `NET-R` | 5 | 91 | day 126–127 |
| `ICT` | 3 | 24 | day 20–23 |
| `MECH` | 3 | 5 | day 8–10 |
| `NET-F` | 3 | 3 | day 50–52 |
| `PM` | 3 | 8 | day 25–26 |
| `ELEC` | 2 | 1 | day 6–10 |
| `GC` | 2 | 5 | day 10–14 |
| `LOG` | 2 | 2 | day 9–10 |

_The schedule assumes a role can do everything asked of it at once. **There is no capacity
figure in the model**, so this is not a finding on its own — a role with a peak of five may
have five crews or one. It is the list of places to check._

## The rule at every convergence

**The last lane sets the date.** Managing the average of a convergence is meaningless — track the
slowest feeder and staff against it. A convergence where four lanes are early and one is late is a
late convergence.

## Per-rack parallelism is the most misunderstood in the programme

Power, fluid and cabling on **one** rack, concurrently, is correct and is where the throughput comes
from. The same three trades queued on the **same** rack in sequence is a stall — it costs about a day
per rack and is invisible until you are several racks behind.

**Sequence the floor by rack and publish the sequence.** Without a published order the trades
self-organise into a queue, and afterwards nobody can reconstruct where the day went.

## Physical / digital handoffs need scheduled coordination, not sequencing

Where physical work hands to digital work — or where a task needs both present simultaneously — putting
them in order is not enough. Somebody has to be on the floor at the same time somebody else is on the
console, and on a follow-the-sun team that does not happen by accident.

The recurring ones: a technician seating a cross-connect while an engineer confirms light; a
technician triggering a leak sensor while a commissioning agent confirms the alarm reached the building
management system; an operator reading a serial at the moment the system records placement; an
operator energising a rack while an engineer confirms the management controller answers.

The canonical three-party version is fault isolation during burn-in: remote engineering sees a link
down, the onsite technician cannot map it to a physical cable, and the cabling contractor demobilised
last month. A fifteen-minute fix becomes a three-day investigation. It is prevented by three decisions
made much earlier — the retention clause, the label scheme reconciled to the monitoring schema, and the
as-built patching matrix.

## What cannot be compressed

Some chains are serial for physical reasons rather than scheduling ones.

- **Fluid commissioning** — flush, treat, filter, pressure test, flow. Each step needs the prior one
  genuinely complete.
- **Firmware before fabric bring-up** — otherwise faults are misattributed to hardware.
- **The collective scale ladder** — rack, then pod, then full hall. Failures at small scale must be
  resolved before hall-scale measurement means anything.
- **Permitting and carrier provisioning** — externally controlled queues.

**Adding people to any of these makes them slower, not faster.** The only compression available is
starting them earlier.

## Owner contention

The schedule assumes a role can do everything asked of it simultaneously. It does not know how many
crews or engineers a role actually has, so a high peak is a place to check rather than a finding.

Remote network engineering is the scarcest resource in the back half of the programme, and it is
scarce at exactly the point where several validation activities want it at once.
