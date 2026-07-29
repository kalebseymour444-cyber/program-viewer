# Conventions

[← README](README.md)

---

## Identifier scheme

```
M4              Milestone            (L0)
M4.3            Work package         (L1)
M4.3.2          Task                 (L2)
```

Every ID carries its own path upward. `M4.3.2` is unambiguously task 2 of work package 3 of milestone 4.
This is what makes traversal mechanical rather than a matter of someone remembering.

**IDs are permanent.** If work is removed, the ID is retired, never reused. Renumbering breaks every
reference that ever pointed at it.

---

## Task type

| Tag | Meaning |
|---|---|
| **PHY** | Physical work — trades, rigging, terminations, mechanical, electrical |
| **DIG** | Digital work — configuration, provisioning, testing, software |
| **DOC** | Documentation, contractual, or approval work |
| **HYB** | Requires physical and digital in the same task, usually with two owners present |

**HYB is where the seams live.** A task requiring both an onsite tech and a remote engineer, at the same
time, is a coordination dependency, not just a work item. These are the ones that fail.

---

## Status states

| State | Meaning |
|---|---|
| `NOT STARTED` | Predecessors not cleared |
| `IN PROGRESS` | Active, tracking to plan |
| `AT RISK` | Will miss without intervention. **A mitigation plan does NOT return this to green** |
| `BLOCKED` | Stopped, waiting on a named dependency |
| `COMPLETE` | Exit criteria met and evidenced |

**The rule that matters:** *at risk with a plan* and *on track* are different states. Collapsing them is
how reporting becomes structurally incapable of delivering bad news — every step defensible, aggregate
dishonest. Nobody lies; the system just can't say anything is wrong.

**Aging is displayed by default.** Any item `AT RISK` or `BLOCKED` shows days in state. Problems survive
by quietly staying open.

---

## Gates

A **gate** is a task whose exit criteria must be evidenced before any successor begins. Gates are marked
🚨 and listed in [registers/gates.md](registers/gates.md). Gate exit is *measured*, not asserted — if the
criterion isn't evidenced, the gate isn't closed regardless of schedule pressure.

---

## Owner roles

Roles, never names, so the model survives staffing changes.

`PM` program management · `GC` general contractor · `MECH` mechanical · `ELEC` electrical ·
`ICT` structured cabling contractor · `NET-R` remote network engineering · `NET-F` field network ·
`OPS` site operations · `LOG` logistics/receiving · `SEC` security · `AHJ` authority having jurisdiction ·
`VEN` vendor/OEM · `CX` commissioning agent · `CUST` customer

---

## Sign-off

Each **milestone** carries a named approver and named consulted parties. A definition without a
signature recorded against it is a suggestion. Version the criteria — a standard that changes without a
change record is worse than one never written, because people keep trusting it.
