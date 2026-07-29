# M2 — Tasks
[← M2](../L1-milestones/M2-network-live.md) · [← L0](../L0-program.md) · [conventions](../conventions.md)

| ID | Task | Type | Owner | Dur | Predecessors |
|---|---|---|---|---|---|
| M2.1.1 | Entrance facility siting — A and B, physically separated | DOC | NET-R | 3d | M1.1.2 |
| M2.1.2 | Conduit path design, route survey | DOC | GC | 5d | M2.1.1 |
| M2.1.3 | Permitting — ROW, road crossing, environmental | DOC | GC | **20–90d** | M2.1.2 |
| M2.1.4 | Entrance conduit construction, both paths | PHY | GC | 15d | M2.1.3 |
| M2.1.5 | Entrance room build — grounding, fire-stop, racks | PHY | GC | 10d | M2.1.4 |
| M2.2.1 | OSP route engineering to carrier POP / meet point | DOC | ICT | 10d | M2.1.2 |
| M2.2.2 | Trenching / boring / aerial per route | PHY | ICT | **20–60d** | M2.1.3 |
| M2.2.3 | Cable placement, both diverse paths | PHY | ICT | 10d | M2.2.2 |
| M2.2.4 | Splicing — field splices, splice enclosures | PHY | ICT | 7d | M2.2.3 |
| M2.2.5 | OTDR testing end-to-end, both paths | DIG | ICT | 3d | M2.2.4 |
| M2.2.6 | 🚨 Physical diversity verification — field walk, not paperwork | PHY | NET-R | 2d | M2.2.5 |
| M2.3.1 | Carrier selection & pricing | DOC | NET-R | 10d | M2.1.1 |
| M2.3.2 | Circuit orders placed; LOA/CFA issued | DOC | NET-R | 3d | M2.3.1 |
| M2.3.3 | Carrier provisioning tracked weekly against **their** milestones | DOC | NET-R | **30–120d** | M2.3.2 |
| M2.4.1 | MMR rack & cabinet install | PHY | ICT | 5d | M2.1.5 |
| M2.4.2 | Splice enclosures & patch fields terminated | PHY | ICT | 5d | M2.4.1, M2.2.4 |
| M2.4.3 | Demarcation rack build — carrier side / Fluidstack side | PHY | ICT | 3d | M2.4.2 |
| M2.4.4 | Grounding & bonding verified | PHY | ICT | 2d | M2.4.3 |
| M2.5.1 | Cross-connect requests submitted per circuit | DOC | NET-R | 2d | M2.3.3, M2.4.3 |
| M2.5.2 | Cross-connects placed carrier demarc → DC demarc rack | PHY | ICT | 5d | M2.5.1 |
| M2.5.3 | Light levels verified at demarc, each circuit | HYB | ICT + NET-R | 2d | M2.5.2 |
| M2.6.1 | Border router install & rack | PHY | NET-F | 3d | M2.4.1 |
| M2.6.2 | DWDM transponder / muxponder install | PHY | NET-F | 3d | M2.6.1 |
| M2.6.3 | Edge config — routing, BGP sessions, ACLs | DIG | NET-R | 5d | M2.6.2, M2.5.3 |
| M2.6.4 | DCI turn-up to peer sites | DIG | NET-R | 3d | M2.6.3 |
| M2.7.1 | OOB carrier selection — **different carrier, different path** | DOC | NET-R | 5d | M2.3.1 |
| M2.7.2 | OOB circuit provisioned | DOC | NET-R | **30–90d** | M2.7.1 |
| M2.7.3 | OOB terminal server / console infrastructure install | PHY | NET-F | 3d | M2.7.2 |
| M2.7.4 | 🚨 OOB reachability proven **with primary path down** | DIG | NET-R | 1d | M2.7.3 |
| M2.8.1 | Throughput test, each path independently | DIG | NET-R | 2d | M2.6.4 |
| M2.8.2 | Latency & jitter baseline captured | DIG | NET-R | 1d | M2.8.1 |
| M2.8.3 | 🚨 A/B failover tested **under load** | DIG | NET-R | 1d | M2.8.2 |
| M2.8.4 | 🚨 WAN acceptance signed | DOC | NET-R | 1d | M2.8.3, M2.7.4 |

## Parallel lanes

```
Lane A (civil):    M2.1.1 → M2.1.2 → M2.1.3 ──permitting── → M2.1.4 → M2.1.5 → M2.4.x
Lane B (OSP):      M2.2.1 ──────────────────┘ → M2.2.2 → M2.2.3 → M2.2.4 → M2.2.5 → M2.2.6
Lane C (carrier):  M2.3.1 → M2.3.2 → M2.3.3 ──────────────────────────────────┐
Lane D (OOB):      M2.7.1 → M2.7.2 ───────────────────────────────────────────┤
                                                          M2.5.x → M2.6.x → M2.8.x
```

**M2.1.3 (permitting) and M2.3.3 (carrier provisioning) are the two variance monsters.** Both are
externally controlled, both are quoted optimistically, and both are invisible on a construction walk.
Start Lane C on day one — it has no physical predecessor and the longest tail.
