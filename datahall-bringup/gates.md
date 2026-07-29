# Gate Register
[← README](../README.md) · [← L0](../L0-program.md) · [conventions](../conventions.md)

> A **gate** is a task whose exit criteria must be **evidenced** before any successor begins. Gate exit
> is measured, not asserted. If the criterion isn't evidenced, the gate isn't closed — regardless of
> schedule pressure. That is the entire point of naming them.

## Program gates, in order

| Gate | Criterion — what must be evidenced | Blocks | Evidence |
|---|---|---|---|
| **M1.2.3** | Patching matrix reviewed as a design artifact — rail alignment, length feasibility, polarity, breakout, pathway fill | M1.2.4 → all cabling | Signed review record |
| **M1.5.3** | ICT contract executed **with retention-through-validation** | M8.5.4 | Executed contract |
| **M1.6.3** | Definition of done signed by all five parties | M8.6 | Signed document |
| **M2.2.6** | Physical path diversity verified by field walk | M2.8.4 | Route survey + photos |
| **M2.7.4** | OOB reachable with primary path **down** | M2.8.4, M5.4.3 | Test record |
| **M2.8.3** | A/B failover tested **under load** | M2.8.4 | Test record |
| **M2.8.4** | WAN acceptance signed | M7 | Signed acceptance |
| **M3.1.1** | Overhead coordination resolved on site, three trades present | M3.1.2 | Coordination walk record |
| **M3.5.2** | Label scheme reconciled to monitoring schema | M3.6 | Schema diff |
| **M3.6.4** | 100% Tier 1 + Tier 2 certification delivered | M5.5.1 | Certification package |
| **M4.1.2** | Hall sealed, dust protocol in force | M3, M4.2, M4.3 | Inspection record |
| **M4.3.3** | Loop flush — particulate to spec | M4.3.4 | Fluid sample analysis |
| **M4.3.4** | Chemical treatment & chemistry verified | M4.3.6 | Chemistry report |
| **M4.3.6** | Pressure test held for spec duration | M4.3.7 | Pressure log |
| **M4.3.7** | Flow rate & delta-T verified under simulated load | M4.4.2 | Commissioning record |
| **M4.4.2** | 🚨🚨 Leak detection **functionally triggered**, alarm proven to BMS | M4.7 | Trigger test record |
| **M4.5.3** | AHJ inspection passed | M4.7.1 | AHJ sign-off |
| **M4.7.3** | Handover accepted — signed by construction **and** deployment | M5, M6 | Dual-signed acceptance |
| **M5.3.4** | Switch firmware baselined to known-good matrix | M5.4, M5.5 | Version manifest |
| **M5.4.3** | OOB proven from remote with production down | M6, M7 | Test record |
| **M5.6.2** | Topology verified **against intended design** | M5.6.4 | Design diff |
| **M6.1.3** | Receiving protocol published | M6.2 | Published procedure |
| **M6.4.1** | Asset capture at placement — serial → rack → slot | M7.4.2 | Inventory export |
| **M6.6.2** | Leak check per fluid connection | M7.1.2 | Per-rack record |
| **M6.8.3** | Patching matrix updated to as-built | M7.4.2 | As-built matrix |
| **M7.3.2/3** | Firmware baselined fleet-wide | M7.5 | Firmware manifest |
| **M7.4.2** | Inventory reconciled, zero unmatched | M7.5 | Reconciliation report |
| **M7.5.3** | Discovered topology diffed against design | M7.7 | Topology diff |
| **M7.9.2** | Monitoring live **before** validation begins | M8 | Alert routing test |
| **M8.3.3/4** | Full-hall NCCL bandwidth + rail variance analysis | M8.4 | Benchmark results |
| **M8.6.2** | Acceptance measured against definition of done | M8.8.4 | Evidence pack + signature |
| **M8.8.4** | 🚨🚨 Customer access enabled — **clusters live** | revenue | Access confirmation |

---

## The two that never bend

**M4.4.2 — cooling proven before IT energizes.** At 130–140 kW/rack there is no air-cooled fallback and
no grace period. A rack energized into an unproven loop is a total-loss event, not a schedule problem.

**M8.6.2 — acceptance is measured, not asserted.** The definition of done exists precisely so that
"done" is not a matter of anyone's opinion under deadline pressure.

---

## Gate anti-patterns

- **Conditional gate closure** — "closed pending X." Either the criterion is evidenced or the gate is
  open. Conditional closure is how gates become decorative.
- **Gate closed by the party who benefits** — M4.7.3 requires both construction *and* deployment
  signatures for exactly this reason.
- **Criteria written after the work** — a criterion authored once the result is known is not a criterion.
- **Undated evidence** — evidence without a timestamp can't be tied to a configuration state.
