# Data Hall Bring-Up Sequence — GB300 NVL72
### Meet-me room to clusters live

*Reference draft, 2026-07-28. Illustrative sizing and durations — real designs vary substantially by
host, fabric choice, and customer spec. The **sequence and the gates** are the transferable part.*

---

## Assumed footprint

| | |
|---|---|
| Compute racks | 64 × GB300 NVL72 |
| GPUs | 4,608 Blackwell Ultra (72/rack); 2,304 Grace CPUs |
| Rack power | ~130–140 kW each → **~9 MW compute** |
| Hall total | ~10 MW critical IT with network, storage, management |
| Rack weight | ~1.3–1.5 t each, factory-integrated (Oberon) |
| Cooling | 100% liquid, rack manifold + CDU on secondary loop |
| Scale-up | NVLink 5 — **factory-integrated copper spine, not field-cabled** |
| Scale-out | ConnectX-8 800G per GPU → InfiniBand Quantum-X800 or Spectrum-X Ethernet |
| Field-terminated links | **~5,000–6,000** across scale-out, storage, management, OOB |

---

## PHASE 0 — Design freeze and pre-mobilization
*Weeks to months ahead. Everything downstream inherits errors made here.*

- Rack elevations, floor plan, power layout, containment strategy
- **Patching matrix / ICT cutsheets issued** — source/dest, media, length, polarity, label, breakout
- BOM derived from the matrix; **OFCI vs. CFCI split decided and written**
- Long-lead released: optics, MPO trunks, switches, cabinets, PDUs
- ICT/LV contractor onboarded — BICSI-certified, manufacturer-certified if a system warranty is required
- **⚠️ Contract term: retain the ICT contractor through validation, not to cable-complete**

---

## PHASE 1 — Meet-me room / entrance facility
*Often the longest pole and on a different critical path than the building.*

1. **Entrance facilities, diverse A/B** — separate conduit paths, ideally separate building entries
2. OSP fiber terminated: splice enclosures → MMR patch fields
3. Carrier circuits accepted — OTDR traces, insertion loss, light levels against budget
4. Edge/border routers, DWDM transponders or muxponders for DCI
5. WAN acceptance: throughput, latency, jitter, failover between A and B paths
6. Out-of-band WAN path proven independently — you need reachability when the primary is down

> **Gate:** diverse, tested WAN presence. On power-first sites this is a **construction project** —
> permitting, ROW, trenching, splicing — and it can slip independently of the building. A finished data
> hall with one path or no path is not deliverable.

---

## PHASE 2 — Backbone: MDA → HDA
*Runs in parallel with white space construction; competes for overhead space.*

1. **Pathway first** — tray, ladder rack, basket. Coordinate with mechanical and electrical overhead
   *before* anyone pulls cable. Pathway conflicts discovered late are re-work at the worst time.
2. Main Distribution Area built: core/spine, DCI handoff, OOB aggregation
3. Backbone trunks MDA → HDA per row/pod. Singlemode, MPO-12/16/24 per design
4. Patch fields and cassettes; labeling per ANSI/TIA-606
5. **Tier 1 (insertion loss) + Tier 2 (OTDR) certification, 100% of links**, results delivered as a
   payment milestone

---

## PHASE 3 — White space readiness
*The prerequisite gate stack. Nothing energizes until all of it clears.*

- Envelope sealed; containment installed; temp/humidity under control
- Floor loading verified; seismic anchoring points set
- **Electrical:** busway energized, breakers set, RPPs/whips landed, metering live, phase plan verified
- **Mechanical — the hard gate:** CDU commissioned, secondary loop **flushed, chemically treated,
  filtered, pressure-tested**; manifolds set; QDs verified; leak detection functionally tested at rack
  and row
- Fire detection/suppression and VESDA commissioned; AHJ inspection passed
- Cleanliness protocol in force (ISO class), construction dust controlled
- Physical security and access control live

> **🚨 The rule that doesn't bend:** cooling loop proven before IT energizes. At 140 kW/rack there is no
> air-cooled fallback and no grace period. This gate is where construction hands the room over.

---

## PHASE 4 — Network and storage rows first
*Sequencing insight most people get backwards.*

Fabric infrastructure lands **before** compute. Leaf/spine racks, management switching, OOB, storage.
Switch config baselined and reachable. You want the fabric ready to receive compute, not the reverse —
otherwise racks sit idle burning schedule while someone configures switches.

---

## PHASE 5 — Compute rack receipt and placement
*~8–12 racks/day with good logistics. Call it 6–8 working days for 64.*

1. Delivery scheduled against **laydown capacity** — staging is a constrained resource with its own
   dependency
2. Receiving: who's at the dock, and do they know what's on the truck
3. Damage inspection, DOA claim window preserved
4. Rigging: path-of-travel survey, dock height, floor protection. Freight elevators are usually
   disqualifying at this weight
5. De-crate, ramp, position, level, anchor
6. **Asset capture at placement: serial → rack → slot.** This becomes the genealogy for the whole
   lifecycle. Capturing it later costs ten times more

---

## PHASE 6 — Power termination

Busway tap → whip → rack PDU, dual A/B. Torque verification, phase balance across the row, metering
onboarded. Verify actual draw at idle against design before trusting the design.

---

## PHASE 7 — Fluid connection

Manifold to rack, quick disconnects seated, leak check at each connection, flow rate and delta-T
verified against spec under load. Leak detection re-tested with the rack in place.

---

## PHASE 8 — Structured cabling to rack
*~2–3 weeks for the hall. The largest single field-labor scope.*

- Scale-out: rack → HDA leaf, per the patching matrix
- **Rail alignment is the failure that hides.** In rail-optimized topologies GPU *n* in every rack must
  land on leaf *n*. Get it wrong and every link tests green while collective bandwidth collapses —
  invisible until NCCL testing, brutally expensive to fix after the fact
- Management/BMC copper, OOB, storage
- Labeling per the matrix, matching what monitoring will report
- **100% link certification** — insertion loss, OTDR, optical power in/out
- **As-built the matrix.** A patching matrix that isn't maintained as as-built turns every future fault
  into an investigation

---

## PHASE 9 — Power-on and firmware baseline

1. Sequential energization — manage inrush, don't wake the row at once
2. BMC reachable; console access verified
3. **Firmware baseline to a known-good matrix:** BIOS, BMC, NIC, NVLink switch, fabric switch OS.
   Version drift across a fleet is a top source of phantom faults that burn days
4. Thermal telemetry confirmed live before load

---

## PHASE 10 — Discovery and inventory reconciliation

DHCP/PXE, inventory sweep, then reconcile **serial ↔ MAC ↔ rack/slot ↔ patching matrix**. Do it now.
Every hour saved here costs a day during break/fix, because a fault you can't locate physically is a
fault you can't fix.

---

## PHASE 11 — Fabric bring-up

- **InfiniBand:** subnet manager up (UFM), topology discovery, verify discovered topology **against the
  intended design**, not just against itself. Baseline link error counters
- **Ethernet:** BGP/EVPN, RoCE tuning, PFC/ECN configuration, congestion control validated
- **NVLink domain verification in-rack** — confirm all 72 GPUs present in the domain, partition state
  correct
- Optical power and error counters captured as a baseline for later comparison

---

## PHASE 12 — Provisioning

Bare-metal imaging, driver and CUDA/NCCL/DOCA stack to a pinned version, storage mounts, scheduler
integration (Slurm or Kubernetes), telemetry and monitoring onboarded **before** validation — so
burn-in data is actually captured.

---

## PHASE 13 — Validation and burn-in
*~2–4 weeks. Where committed dates are won or lost.*

**Node level**
- DCGM diagnostics, escalating levels
- HBM/ECC checks, memory tests
- Thermal soak at sustained load — cooling defects surface here or in production, and you want here
- Power draw against envelope

**Fabric level**
- Link error counters, symbol errors, retransmits, flapping links
- Transceiver optical power against thresholds
- Congestion and incast behavior

**Cluster level**
- **NCCL bus bandwidth — all_reduce, all_gather at increasing scale: rack → pod → full hall.** This is
  the test that exposes rail misalignment and marginal optics
- NVLink bandwidth and latency
- Sustained synthetic training run across the full footprint over a defined soak window

---

## PHASE 14 — Break/fix and RMA loop
*Runs concurrent with Phase 13 and gates exit.*

Failure distribution at scale: **optics and cables dominate by count**, then GPU/HBM, then switches,
then power and cooling. Stock spares accordingly — people over-stock GPUs and under-stock transceivers.

```
detect → classify (node / link / switch / thermal / power)
  → isolate (device? optic? cable? config?)
  → replace from onsite spares → re-validate → close
  → RMA tracked to credit → spares replenished
```

Track **mean time to repair, spares depletion rate, and repeat-fault rate by rack** — the last one
distinguishes a systemic problem (bad cable lot, thermal hot spot, one crew's terminations) from
unrelated one-offs.

---

## PHASE 15 — Acceptance and handover

- Measure against the **contractual definition of done**, agreed before install:
  > *X clusters of X GPUs, ≥XX% fault-free nodes, ≥XX% uptime over an XX-hour soak, ≥XX GB/s bus
  > bandwidth on the XX fabric, accessible to the customer via XX*
- Documentation package: as-built patching matrix, 100% test results, asset records, firmware manifest
- Ops turnover: runbooks, monitoring thresholds, escalation model, spares location and ownership
- Customer access enabled → **clusters live**

---

## Critical path and parallelism

```
MMR / OSP ────────────────────────┐  (own critical path — start earliest)
Pathway → Backbone ──────┐        │
White space (power+fluid)─┤        │
                          ├─ Network rows ─┐
Rack delivery ────────────┘                ├─ Cable ─ Power-on ─ Fabric ─ Provision ─ Validate ─ Accept
                                           │
Spares + RMA staged ───────────────────────┘
```

**Realistic duration, construction handover → clusters live: 6–10 weeks** for a practiced team on a
repeat design. First-of-a-kind on a new site runs materially longer — the delta is almost entirely
first-time discovery of things a playbook would have caught.

---

## The seven gates worth naming out loud

1. **Cooling proven before IT energize.** Non-negotiable at this density.
2. **WAN diversity accepted.** Different critical path, capable of killing the date alone.
3. **Pathway coordinated before cable pull.** Late conflicts are pure re-work.
4. **Network rows before compute rows.**
5. **Firmware baselined before fabric bring-up.** Drift creates faults that look like hardware.
6. **Inventory reconciled before validation.** A fault you can't locate is a fault you can't fix.
7. **ICT contractor retained through validation.** Otherwise burn-in finds two hundred marginal links
   and nobody is on site to fix them — a procurement decision made months earlier.
