# Dependency Register
[← README](../README.md) · [← L0](../L0-program.md)

> Dependencies **within** a milestone live in that milestone's L1 and L2 files. This register holds the
> cross-milestone and cross-organizational ones — the dependencies nobody owns because they span two
> owners. These are the failures.

## Long-reach dependencies

| From | To | Span | Why it fails |
|---|---|---|---|
| M1.2.2 patching matrix | M8.3.4 rail variance | **~8 months** | Rail misalignment is invisible through cabling and certification. Every link tests green. Only full-hall collective measurement exposes it |
| M1.5.3 ICT retention term | M8.5.4 cabling remediation | ~7 months | A procurement clause written before anyone knows they'll need it. Its absence isn't discovered until burn-in |
| M1.6.3 definition of done | M8.6.2 acceptance | full program | If "done" was never ratified, acceptance becomes a negotiation under deadline pressure |
| M2.1.3 permitting | M8.8.4 clusters live | full program | Externally controlled, invisible on a construction walk, and capable of holding the terminal gate on its own |
| M4.6.3 laydown published | M4.5.3 AHJ inspection | days | Unpublished staging → pallets in a corridor → failed inspection. Two teams each correct |
| M5.4.3 OOB proven | all of M7–M8 | ~6 weeks | Without OOB, every remote fault needs a body on the floor |
| M6.4.1 asset capture | M8.5.2 fault isolation | ~6 weeks | A fault you can't locate physically is a fault you can't fix |

## Cross-organizational seams

| Seam | Parties | Failure mode | Control |
|---|---|---|---|
| **Construction → deployment** | GC / PM | "Handover" is an *event* to construction and an *interval* to deployment. Same word, different category | M4.7.3 dual signature; define which at M1.6 |
| **Fit-out ↔ construction storage** | ICT / GC / LOG | Neither knows the other's material footprint | M4.6.3 published laydown |
| **Receiving ↔ trades** | LOG / ELEC / NET-F | Person at the dock doesn't recognize the hardware | M6.1.3 receiving protocol |
| **Remote eng ↔ site ops ↔ ICT** | NET-R / OPS / ICT | Remote sees link down; site can't map to cable; ICT demobilized | M6.8.3 as-built + M1.5.3 retention + M3.5.2 label reconciliation |
| **Sourcing ↔ deployment** | Sourcing / PM | Long-lead risk owned by neither at the point it bites | M1.4.3 tracker with named owner |
| **Network connectivity ↔ deployment** | NET-R / PM | WAN on a separate critical path, tracked separately, kills the date | M2 modeled **inside** this program, not adjacent to it |

## Resource contention

| Resource | Contested by | Window | Resolution |
|---|---|---|---|
| Overhead volume | ICT tray / mech pipe / elec busway | M3.1, M4.2, M4.3 | M3.1.1 coordination walk, all three present |
| Floor aisle access | ELEC / MECH / ICT per rack | M6.5–M6.7 | Sequence by **rack**, not by trade; publish the sequence |
| Laydown / staging | Construction material vs. IT hardware | M4–M6 | M4.6.3; staging is a constrained resource with its own dependency |
| ICT crew | M3 backbone vs. M6 scale-out | M3, M6 | Crew plan across both; backbone must finish before M5.5.1 |
| Remote network engineering | M5.6, M7.5, M8.2, M8.5 concurrently | M5–M8 | The scarcest resource in M7–M8. Model it explicitly |

## Externally controlled — track weekly, never trust the quoted date

- **M2.1.3** permitting / ROW — AHJ and utility controlled
- **M2.3.3** carrier provisioning — carrier's own construction queue
- **M2.7.2** OOB circuit — second carrier, same problem
- **M1.4** long-lead hardware — vendor allocation, especially optics
- **M4.5.3** AHJ inspection — scheduling queue
