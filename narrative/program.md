## The design principle

> A **summary** is lossy and terminal — someone compressed the detail and the compression discarded
> the path back. An **abstraction** is lossless and traversable — a view of the underlying material
> where every element resolves downward.

Most program reporting is the first pretending to be the second. That is why *"why is this red?"*
produces a three-day investigation instead of an answer.

These are views of one dataset, not three documents. If a question cannot be answered by traversing
down, that gap is the finding. A number nobody can trace is a number nobody can be held to.

## Why the WAN is the one that kills dates

On power-first sites the WAN is not a provisioning exercise, it is a construction project — permitting,
right-of-way, trenching, splicing, carrier provisioning. It has its own permitting authority and sits
in the carrier's own construction queue, so it can slip entirely independently of the building.

It is also invisible on a construction walk, because nothing about it happens inside the building. The
construction path is what gets reported on precisely because it is the part you can see.

**A data hall that is energized, racked, cabled, and validated but has one WAN path is not
deliverable.** Lease commencement does not care that the inside is finished.

## Definition of done — the contract this whole model serves

> X clusters of X GPUs, at ≥XX% fault-free nodes, ≥XX% uptime sustained over an XX-hour soak,
> ≥XX GB/s bus bandwidth on the XX fabric, accessible to the customer via XX.

Agreed and signed **before** design freeze closes, and measured at acceptance. Every task in this model
exists to make that statement true or false — if a task cannot be traced to it, question why it is here.

## Scope assumptions

64 × GB300 NVL72 · 4,608 GPUs · ~9 MW compute, ~10 MW hall · 100% liquid cooled · scale-out on
ConnectX-8 800G to InfiniBand or Spectrum-X · ~5,000–6,000 field-terminated links · NVLink scale-up
factory-integrated, **not** field work.

Durations are illustrative for a practiced team on a repeat design. First-of-a-kind runs materially
longer, and the delta is almost entirely first-time discovery of things a playbook would have caught.
