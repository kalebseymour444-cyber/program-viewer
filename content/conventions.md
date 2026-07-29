<!-- GENERATED — do not edit. Source: program.yaml -->

# Conventions

[← Program](L0-program.md)

## Identifier scheme

```
M1              Milestone      (L0)
M1.1            Work package   (L1)
M1.1.1          Task           (L2)
```

Every ID carries its own path upward, which is what makes traversal mechanical rather than a
matter of someone remembering. **IDs are permanent** — if work is removed the ID is retired,
never reused, because renumbering breaks every reference that ever pointed at it.

## Task types

| Tag | Tasks |
|---|---|
| `PHY` | 70 |
| `DIG` | 59 |
| `DOC` | 60 |
| `HYB` | 15 |

## Status

| State | Severity rank | Aging displayed |
|---|---|---|
| `BLOCKED` | 1 | **always shown** |
| `AT_RISK` | 2 | **always shown** |
| `IN_PROGRESS` | 3 | — |
| `NOT_STARTED` | 4 | — |
| `COMPLETE` | 5 | — |

_A package or milestone takes the **worst** status among its tasks — never an average,
never rounded toward optimism. `AT_RISK` and `IN_PROGRESS` are distinct states: a mitigation
plan does not restore green. Where aging is shown it cannot be suppressed — the schema
requires a date on any task in those states._

_All 5 states: `NOT_STARTED`, `IN_PROGRESS`, `AT_RISK`, `BLOCKED`, `COMPLETE`._

## Owner roles

| Role | Name | Tasks owned | Milestones approved |
|---|---|---|---|
| `PM` | Program management | 18 | 2 |
| `GC` | General contractor | 12 | — |
| `MECH` | Mechanical | 14 | — |
| `ELEC` | Electrical | 14 | — |
| `ICT` | Structured cabling contractor | 47 | 1 |
| `NET-R` | Remote network engineering | 71 | 3 |
| `NET-F` | Field network | 6 | — |
| `OPS` | Site operations | 15 | — |
| `LOG` | Logistics/receiving | 9 | — |
| `SEC` | Security | 1 | — |
| `AHJ` | Authority having jurisdiction | 1 | — |
| `VEN` | Vendor/OEM | 2 | — |
| `CX` | Commissioning agent | 7 | 1 |
| `CUST` | Customer | 3 | 1 |

_Roles, never names, so the model survives staffing changes. A task may have several
owners — work needing two parties present at once is a coordination dependency, not just
a work item._

## Durations

_Every duration is a range. The whole schedule is computed twice, from the optimistic and
the pessimistic end, and **the critical path can be a different path in each**. A figure
without a scenario label is not an answer. A task with no duration is continuous or
externally paced; it renders as `—`, never as `0d`._
