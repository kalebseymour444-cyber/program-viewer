<!-- GENERATED — do not edit. Source: program.yaml -->

# Dependency register

[← Program](../L0-program.md) · [gates](gates.md) · [dependencies](dependencies.md) · [parallelization](parallelization.md)

> Dependencies **within** a milestone live in that milestone's pages. This register holds the
> cross-milestone ones — the dependencies nobody owns, because they span two owners.

## Cross-milestone edges (21)

| From |  | To |  | Span | Reach |
|---|---|---|---|---|---|
| `M5.2.2` | Storage power & fluid (if liquid-cooled) termination | `M7.8.1` | Storage mounts & throughput spot-check | M5 → M7 | 88d |
| `M6.4.2` | Asset records loaded to inventory system | `M7.4.2` | Reconcile serial ↔ MAC ↔ rack/slot ↔ as-built matrix | M6 → M7 | 63d |
| `M5.6.4` | Leaf ports for compute pre-configured & verified up | `M7.5.1` | Subnet manager / control plane extended to compute leaf ports | M5 → M7 | 51d |
| `M6.8.3` | Patching matrix updated to as-built | `M7.4.2` | Reconcile serial ↔ MAC ↔ rack/slot ↔ as-built matrix | M6 → M7 | 27d |
| `M4.1.2` | Hall sealed; construction dust protocol in force | `M3.1.1` | Overhead coordination walk — tray vs. mech vs. elec, resolved on site | M4 → M3 | 15d |
| `M1.1.5` | Overhead coordination model — tray vs. mech vs. elec | `M3.1.1` | Overhead coordination walk — tray vs. mech vs. elec, resolved on site | M1 → M3 | 5d |
| `M1.1.2` | Floor plan with rack coordinates, aisle containment | `M2.1.1` | Entrance facility siting — A and B, physically separated | M1 → M2 | 3d |
| `M4.1.2` | Hall sealed; construction dust protocol in force | `M3.2.1` | MDA cabinet install & anchoring | M4 → M3 | 3d |
| `M4.1.2` | Hall sealed; construction dust protocol in force | `M3.3.1` | HDA cabinet install per row | M4 → M3 | 3d |
| `M6.6.3` | Flow & delta-T verified per rack | `M7.1.2` | Sequential power-on per plan | M6 → M7 | 3d |
| `M3.6.4` | Certification package delivered — payment milestone | `M5.5.1` | Spine–leaf trunk install per patching matrix | M3 → M5 | 2d |
| `M5.5.3` | 100% spine–leaf link certification | `M6.7.1` | Scale-out cable pull rack → HDA | M5 → M6 | 2d |
| `M2.7.4` | OOB reachability proven with primary path down | `M5.4.3` | OOB reachability proven from remote, production path down | M2 → M5 | 1d |
| `M4.6.3` | Laydown & storage areas designated and published | `M6.1.1` | Delivery schedule built against laydown capacity & crew throughput | M4 → M6 | 1d |
| `M4.7.3` | Handover accepted — signed by construction and deployment | `M5.1.1` | Network cabinet delivery & staging | M4 → M5 | 1d |
| `M4.7.3` | Handover accepted — signed by construction and deployment | `M5.2.1` | Storage rack delivery, placement, anchor | M4 → M5 | 1d |
| `M4.7.3` | Handover accepted — signed by construction and deployment | `M6.3.1` | Path-of-travel survey & floor protection | M4 → M6 | 1d |
| `M5.4.3` | OOB reachability proven from remote, production path down | `M7.2.1` | BMC addressing & DHCP scope live | M5 → M7 | 1d |
| `M6.5.3` | Phase balance verified across row | `M7.1.1` | Energization sequence plan — inrush staged by row | M6 → M7 | 1d |
| `M7.9.2` | Monitoring thresholds & alert routing live before M8 | `M8.1.1` | DCGM diagnostics — short level, full fleet | M7 → M8 | 1d |
| `M7.9.2` | Monitoring thresholds & alert routing live before M8 | `M8.2.1` | Link error counter delta vs. M7.5.4 baseline | M7 → M8 | 1d |

_Sorted by reach, longest first. **Reach** is the distance in days between the two tasks'
earliest starts, pessimistic. The long ones are the ones that fail: a decision made months
earlier surfaces at a point where nobody is looking upstream for a cause._

## Externally controlled

| ID | Task | Owners | Blocks |
|---|---|---|---|
| `M2.1.3` | Permitting — ROW, road crossing, environmental | `GC` | `M2.1.4`, `M2.2.2` |
| `M2.3.3` | Carrier provisioning tracked weekly against their milestones | `NET-R` | `M2.5.1` |
| `M2.7.2` | OOB circuit provisioned | `NET-R` | `M2.7.3` |
| `M4.1.1` | Building envelope weathertight | `GC` | `M4.1.2` |
| `M4.5.1` | Detection & suppression install complete | `GC` | `M4.5.2` |
| `M4.5.3` | AHJ inspection passed | `AHJ` | `M4.7.1` |

_Controlled outside the programme — permits, carriers, vendors, inspection queues. Track these
weekly against the controlling party's own milestones rather than their quoted date._

## Why the long ones are the dangerous ones

A dependency that spans two tasks in the same week is managed by the people doing both. A dependency
that spans months is owned by nobody at the point it bites — the decision was made by a party who has
since moved on, in a document nobody downstream reads, and its consequence surfaces somewhere that
looks like an unrelated failure.

The characteristic shape: a design or procurement decision made cheaply and early, invisible through
every intermediate check, and expensive to reverse by the time anything measures it.

## Cross-organisational seams

These are the dependencies nobody owns, because they span two owners. The table above lists the edges;
these are the *organisational* seams they run across.

| Seam | Parties | Failure mode |
|---|---|---|
| Construction → deployment | GC / PM | "Handover" is an *event* to construction and an *interval* to deployment. Same word, different category |
| Fit-out ↔ construction storage | ICT / GC / LOG | Neither party knows the other's material footprint, and staging is finite |
| Receiving ↔ trades | LOG / ELEC / NET-F | The person at the dock does not recognise the hardware |
| Remote engineering ↔ site ops ↔ cabling | NET-R / OPS / ICT | Remote sees a link down, site cannot map it to a physical cable, the cabling contractor has demobilised |
| Sourcing ↔ deployment | Sourcing / PM | Long-lead risk is owned by neither party at the point it bites |
| Network connectivity ↔ deployment | NET-R / PM | WAN tracked on a separate plan, adjacent to the programme rather than inside it |

Each is prevented upstream, cheaply, by a decision that looks like paperwork at the time: a dual
signature, a published staging area, a receiving protocol, a retention clause, a label scheme
reconciled to the monitoring schema.

## Externally controlled work

Permits, carrier queues, vendor allocation and inspection scheduling are not slow because they are
under-resourced. They are slow because they sit in somebody else's queue, and no amount of staffing on
this side moves them.

Track them weekly against the controlling party's own milestones rather than their quoted date, and
treat any date they give as the earliest plausible outcome rather than the expected one.
