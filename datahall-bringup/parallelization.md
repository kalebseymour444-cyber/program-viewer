# Parallelization Register
[← README](../README.md) · [← L0](../L0-program.md) · [dependencies](dependencies.md)

> What can run at the same time, what cannot, and what only *looks* parallel until two crews meet in the
> same aisle.

## Program-level swimlanes

```
            wk0   wk4   wk8   wk12  wk16  wk20  wk24  wk28  wk32
            |-----|-----|-----|-----|-----|-----|-----|-----|
M1 Design   ███
M2 WAN      ░████████████████████████████████████░              ← own critical path
M3 Backbone             ░████████░
M4 Whitespace ░██████████████████░
M5 Fabric                       ░██████░
M6 Compute                            ░██████████░
M7 Provision                                    ░████░
M8 Validate                                        ░██████████░
            
███ active    ░ float / dependency wait
```

**M2 spans nearly the whole program.** It shares almost no resources with the construction path, which
is exactly why it gets tracked separately and forgotten — and why it belongs *inside* this model.

---

## Four independent lanes, weeks 0–16

These share no resources and should be staffed to run fully concurrent:

| Lane | Content | Owner | Constraint |
|---|---|---|---|
| **Civil / OSP** | M2.1, M2.2 | GC + ICT | Permitting (external) |
| **Carrier** | M2.3, M2.7 | NET-R | Carrier queue (external) |
| **Building MEP** | M4.2, M4.3, M4.5 | ELEC, MECH, GC | Serial within mechanical |
| **Design / procurement** | M1.4, M1.5 | PM | Vendor allocation |

**Only the third has any internal compression available**, and not much — M4.3.3 → M4.3.7 (flush →
treat → filter → pressure → flow) is strictly serial with no shortcut. Start mechanical first.

---

## The convergence points

Where parallel lanes collapse into a single gate. These are the schedule's pressure points.

| Convergence | Lanes merging | Gate |
|---|---|---|
| **M4.7.1** acceptance walk | Electrical, mechanical, life safety, envelope, ops/security — **5 lanes** | M4.7.3 |
| **M3.4.1** backbone trunks | Pathway, MDA, HDA — 3 lanes | — |
| **M2.8.4** WAN acceptance | Civil/OSP, carrier, OOB, edge equipment — 4 lanes | M2.8.4 |
| **M8.6.2** acceptance | Node, fabric, cluster, soak, break/fix — 5 lanes | M8.6.2 |

**The rule at every convergence: the last lane sets the date.** Managing the average is meaningless.
Track the *slowest* lane in each cluster and staff against it.

---

## Per-rack parallelization (M6)

The most misunderstood parallelism in the program.

```
RACK n:   place ──┬── M6.5 power    (ELEC)
                  ├── M6.6 fluid    (MECH)     ← concurrent, same rack
                  └── M6.7 cabling  (ICT)
```

Three trades on **one** rack, concurrently, is correct. Three trades queued on the **same** rack in
sequence is a stall that consumes a day per rack and is invisible until you're eight racks behind.

**Sequence the floor by rack and publish the sequence.** Without a published order, trades self-organize
into a queue and nobody can reconstruct where the day went.

Throughput: ~8–12 racks/day placement; power, fluid, and cabling trail placement by 1–2 days each.

---

## Physical / digital handoff points

Where a `PHY` task hands to a `DIG` task, or a `HYB` task needs both present simultaneously. These need
scheduled coordination, not just sequencing — and they are the ones that fail on a follow-the-sun team.

| ID | Handoff | Why it needs both |
|---|---|---|
| M2.5.3 | ICT seats cross-connect → NET-R verifies light | Verification while hands are still on site |
| M4.4.2 | MECH triggers leak sensor → CX confirms BMS alarm | Alarm path only provable end-to-end |
| M6.4.1 | OPS reads serial → system records placement | Capture at the moment of placement or not at all |
| M6.6.3 | MECH sets flow → CX measures delta-T under load | Simultaneous by definition |
| M7.1.2 | OPS energizes → NET-R confirms BMC | Rollback needs both |
| M8.5.2 | NET-R isolates fault → OPS/ICT locates physically | The canonical three-party seam |

**M8.5.2 is the one to design for.** Remote engineering sees a link down, the onsite tech can't map it
to a physical cable, and the ICT contractor demobilized last month. A fifteen-minute fix becomes a
three-day investigation. Prevented by three upstream decisions: M1.5.3 retention, M3.5.2 label
reconciliation, M6.8.3 as-built matrix.

---

## What cannot be compressed

| Chain | Why |
|---|---|
| M4.3.3 → M4.3.7 | Fluid commissioning is physically serial — each step needs the prior complete |
| M7.3 → M7.5 | Firmware must precede fabric bring-up or faults are misattributed to hardware |
| M8.3.1 → M8.3.2 → M8.3.3 | NCCL scale ladder — pod failures must be resolved before hall-scale is meaningful |
| M2.1.3 permitting | Externally controlled. No amount of staffing moves it |

**Adding people to any of these makes them slower, not faster.** The only compression available is
starting them earlier.
