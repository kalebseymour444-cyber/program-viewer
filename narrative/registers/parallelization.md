## The rule at every convergence

**The last lane sets the date.** Managing the average of a convergence is meaningless — track the
slowest feeder and staff against it. A convergence where four lanes are early and one is late is a
late convergence.

## Per-rack parallelism is the most misunderstood in the programme

Power, fluid and cabling on **one** rack, concurrently, is correct and is where the throughput comes
from. The same three trades queued on the **same** rack in sequence is a stall — it costs about a day
per rack and is invisible until you are several racks behind.

**Sequence the floor by rack and publish the sequence.** Without a published order the trades
self-organise into a queue, and afterwards nobody can reconstruct where the day went.

## Physical / digital handoffs need scheduled coordination, not sequencing

Where physical work hands to digital work — or where a task needs both present simultaneously — putting
them in order is not enough. Somebody has to be on the floor at the same time somebody else is on the
console, and on a follow-the-sun team that does not happen by accident.

The recurring ones: a technician seating a cross-connect while an engineer confirms light; a
technician triggering a leak sensor while a commissioning agent confirms the alarm reached the building
management system; an operator reading a serial at the moment the system records placement; an
operator energising a rack while an engineer confirms the management controller answers.

The canonical three-party version is fault isolation during burn-in: remote engineering sees a link
down, the onsite technician cannot map it to a physical cable, and the cabling contractor demobilised
last month. A fifteen-minute fix becomes a three-day investigation. It is prevented by three decisions
made much earlier — the retention clause, the label scheme reconciled to the monitoring schema, and the
as-built patching matrix.

## What cannot be compressed

Some chains are serial for physical reasons rather than scheduling ones.

- **Fluid commissioning** — flush, treat, filter, pressure test, flow. Each step needs the prior one
  genuinely complete.
- **Firmware before fabric bring-up** — otherwise faults are misattributed to hardware.
- **The collective scale ladder** — rack, then pod, then full hall. Failures at small scale must be
  resolved before hall-scale measurement means anything.
- **Permitting and carrier provisioning** — externally controlled queues.

**Adding people to any of these makes them slower, not faster.** The only compression available is
starting them earlier.

## Owner contention

The schedule assumes a role can do everything asked of it simultaneously. It does not know how many
crews or engineers a role actually has, so a high peak is a place to check rather than a finding.

Remote network engineering is the scarcest resource in the back half of the programme, and it is
scarce at exactly the point where several validation activities want it at once.
