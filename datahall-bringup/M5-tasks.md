# M5 — Tasks
[← M5](../L1-milestones/M5-fabric-infrastructure.md) · [← L0](../L0-program.md) · [conventions](../conventions.md)

| ID | Task | Type | Owner | Dur | Predecessors |
|---|---|---|---|---|---|
| M5.1.1 | Network cabinet delivery & staging | PHY | LOG | 2d | M4.7.3 |
| M5.1.2 | Placement, level, anchor | PHY | ICT | 3d | M5.1.1 |
| M5.1.3 | Power termination, dual A/B | PHY | ELEC | 2d | M5.1.2 |
| M5.1.4 | Grounding & bonding | PHY | ICT | 1d | M5.1.3 |
| M5.2.1 | Storage rack delivery, placement, anchor | PHY | ICT | 3d | M4.7.3 |
| M5.2.2 | Storage power & fluid (if liquid-cooled) termination | PHY | ELEC/MECH | 2d | M5.2.1 |
| M5.3.1 | Spine switch install & mount | PHY | NET-F | 3d | M5.1.4 |
| M5.3.2 | Leaf switch install & mount | PHY | NET-F | 4d | M5.1.4 |
| M5.3.3 | Management switch install | PHY | NET-F | 2d | M5.1.4 |
| M5.3.4 | 🚨 Switch firmware baselined to known-good matrix | DIG | NET-R | 2d | M5.3.1, M5.3.2, M5.3.3 |
| M5.4.1 | OOB cabling to console/terminal servers | PHY | ICT | 3d | M5.3.3 |
| M5.4.2 | Management network addressing & config | DIG | NET-R | 2d | M5.4.1 |
| M5.4.3 | 🚨 OOB reachability proven from remote, production path down | DIG | NET-R | 1d | M5.4.2, M2.7.4 |
| M5.5.1 | Spine–leaf trunk install per patching matrix | PHY | ICT | 5d | M5.3.4, M3.6.4 |
| M5.5.2 | Optics seated; light levels verified both ends | HYB | ICT + NET-R | 3d | M5.5.1 |
| M5.5.3 | 100% spine–leaf link certification | DIG | ICT | 2d | M5.5.2 |
| M5.6.1 | Subnet manager (IB) or BGP/EVPN (Eth) control plane config | DIG | NET-R | 3d | M5.5.3 |
| M5.6.2 | 🚨 Topology discovered and **verified against intended design** | DIG | NET-R | 2d | M5.6.1 |
| M5.6.3 | Link error counters baselined | DIG | NET-R | 1d | M5.6.2 |
| M5.6.4 | Leaf ports for compute pre-configured & verified up | DIG | NET-R | 2d | M5.6.3 |

## Parallel lanes

`M5.1` (network racks) and `M5.2` (storage) run concurrently. `M5.3.1/2/3` are concurrent once cabinets
are powered. Everything converges at M5.3.4 (firmware), which is serial and gates the rest.

**M5.4.3 is the prerequisite nobody schedules.** Without proven OOB, every fault in M6–M8 needs a body
on the floor, and remote engineering can't work the problem at all. It is cheap here and priceless later.

**M5.6.2 — health ≠ correctness.** A subnet manager will report a fully converged, healthy fabric that
is wired to the wrong design.
