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
