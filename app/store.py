import threading
from collections.abc import Callable
from uuid import uuid4

from app.models import Direction, Probe


class Store:
    """In-memory state, with the board living inside each probe.

    ponytail: global lock. A per-probe lock only if this becomes a measured bottleneck.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._probes: dict[str, Probe] = {}

    def launch(self, max_x: int, max_y: int, direction: Direction) -> Probe:
        probe = Probe(
            id=uuid4().hex,
            x=0,
            y=0,
            direction=direction,
            max_x=max_x,
            max_y=max_y,
        )
        with self._lock:
            self._probes[probe.id] = probe
        return probe

    def apply_to(self, probe_id: str, change: Callable[[Probe], Probe]) -> Probe | None:
        """Read, transform and write without releasing the lock.

        The transformation runs inside the critical section on purpose: two
        simultaneous moves on the same probe would read the same position and the
        second write would discard the first. If `change` raises, nothing is written.
        """
        with self._lock:
            probe = self._probes.get(probe_id)
            if probe is None:
                return None
            updated = change(probe)
            self._probes[probe_id] = updated
            return updated

    def find(self, probe_id: str) -> Probe | None:
        with self._lock:
            return self._probes.get(probe_id)

    def all(self) -> list[Probe]:
        with self._lock:
            # A copy, not a view: iterating a live view while another thread
            # mutates the dict raises "dictionary changed size during iteration".
            return list(self._probes.values())

    def clear(self) -> None:
        with self._lock:
            self._probes.clear()
