## The two that never bend

**Leak detection functionally triggered, before IT energises.** At this power density there is no
air-cooled fallback and no grace period. A rack energised into an unproven loop is a total-loss event,
not a schedule problem. "Installed" is not "triggered", and the alarm path has to be proven end to end
to the building management system rather than at the sensor.

**Acceptance measured against the definition of done.** The definition exists precisely so that "done"
is not a matter of anyone's opinion under deadline pressure.

## Gate anti-patterns

- **Conditional closure** — "closed pending X". Either the criterion is evidenced or the gate is open.
  Conditional closure is how gates become decorative.
- **Closed by the party who benefits** — the reason the construction-to-deployment handover requires
  both signatures on the same document.
- **Criteria written after the work** — a criterion authored once the result is known is not a
  criterion, it is a description.
- **Undated evidence** — evidence without a timestamp cannot be tied to a configuration state, so it
  cannot show that the thing was true *when it mattered*.
- **Evidence nobody can find** — a criterion whose evidence lives in somebody's mailbox is closed only
  as long as that person answers.
