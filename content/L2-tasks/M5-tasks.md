<!-- GENERATED — do not edit. Source: program.yaml -->

# M5 — Tasks

[Program](../L0-program.md) / [M5](../L1-milestones/M5.md) / Tasks

| ID | Task | Type | Owners | Duration | Predecessors | Successors | Float | Status |
|---|---|---|---|---|---|---|---|---|
| `M5.1.1` | Network cabinet delivery & staging | PHY | `LOG` | 2d | `M4.7.3` | `M5.1.2` | 129d | `NOT_STARTED` |
| `M5.1.2` | Placement, level, anchor | PHY | `ICT` | 3d | `M5.1.1` | `M5.1.3` | 129d | `NOT_STARTED` |
| `M5.1.3` | Power termination, dual A/B | PHY | `ELEC` | 2d | `M5.1.2` | `M5.1.4` | 129d | `NOT_STARTED` |
| `M5.1.4` | Grounding & bonding | PHY | `ICT` | 1d | `M5.1.3` | `M5.3.1`, `M5.3.2`, `M5.3.3` | 129d | `NOT_STARTED` |
| `M5.2.1` | Storage rack delivery, placement, anchor | PHY | `ICT` | 3d | `M4.7.3` | `M5.2.2` | 189d | `NOT_STARTED` |
| `M5.2.2` | Storage power & fluid (if liquid-cooled) termination | PHY | `ELEC` + `MECH` | 2d | `M5.2.1` | `M7.8.1` | 189d | `NOT_STARTED` |
| `M5.3.1` | Spine switch install & mount | PHY | `NET-F` | 3d | `M5.1.4` | `M5.3.4` | 130d | `NOT_STARTED` |
| `M5.3.2` | Leaf switch install & mount | PHY | `NET-F` | 4d | `M5.1.4` | `M5.3.4` | 129d | `NOT_STARTED` |
| `M5.3.3` | Management switch install | PHY | `NET-F` | 2d | `M5.1.4` | `M5.3.4`, `M5.4.1` | 131d | `NOT_STARTED` |
| `M5.3.4` | 🚨 Switch firmware baselined to known-good matrix | DIG | `NET-R` | 2d | `M5.3.1`, `M5.3.2`, `M5.3.3` | `M5.5.1` | 129d | `NOT_STARTED` |
| `M5.4.1` | OOB cabling to console/terminal servers | PHY | `ICT` | 3d | `M5.3.3` | `M5.4.2` | 138d | `NOT_STARTED` |
| `M5.4.2` | Management network addressing & config | DIG | `NET-R` | 2d | `M5.4.1` | `M5.4.3` | 138d | `NOT_STARTED` |
| `M5.4.3` | 🚨 OOB reachability proven from remote, production path down | DIG | `NET-R` | 1d | `M5.4.2`, `M2.7.4` | `M7.2.1` | 84d | `NOT_STARTED` |
| `M5.5.1` | Spine–leaf trunk install per patching matrix | PHY | `ICT` | 5d | `M5.3.4`, `M3.6.4` | `M5.5.2` | 129d | `NOT_STARTED` |
| `M5.5.2` | Optics seated; light levels verified both ends | HYB | `ICT` + `NET-R` | 3d | `M5.5.1` | `M5.5.3` | 129d | `NOT_STARTED` |
| `M5.5.3` | 100% spine–leaf link certification | DIG | `ICT` | 2d | `M5.5.2` | `M5.6.1`, `M6.7.1` | 129d | `NOT_STARTED` |
| `M5.6.1` | Subnet manager (IB) or BGP/EVPN (Eth) control plane config | DIG | `NET-R` | 3d | `M5.5.3` | `M5.6.2` | 129d | `NOT_STARTED` |
| `M5.6.2` | 🚨 Topology discovered and verified against intended design | DIG | `NET-R` | 2d | `M5.6.1` | `M5.6.3` | 129d | `NOT_STARTED` |
| `M5.6.3` | Link error counters baselined | DIG | `NET-R` | 1d | `M5.6.2` | `M5.6.4` | 129d | `NOT_STARTED` |
| `M5.6.4` | Leaf ports for compute pre-configured & verified up | DIG | `NET-R` | 2d | `M5.6.3` | `M7.5.1` | 129d | `NOT_STARTED` |

_Rows are in dependency order, not ID order — the table reads in the order the work happens._
_Successors and float are derived. Float is pessimistic; a zero-float task cannot slip at all
without moving the programme finish. `(external)` marks work controlled outside the programme._
