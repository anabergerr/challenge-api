import threading

import pytest

from app.models import Direction, Probe
from app.store import Store


def test_apply_to_reports_unknown_probe():
    assert Store().apply_to("missing", lambda probe: probe) is None


def test_apply_to_leaves_state_untouched_when_change_raises():
    store = Store()
    probe = store.launch(5, 5, Direction.NORTH)

    def explode(current: Probe) -> Probe:
        raise ValueError("failure halfway through the sequence")

    with pytest.raises(ValueError):
        store.apply_to(probe.id, explode)

    assert store.all() == [probe]


def test_apply_to_holds_the_lock_while_change_runs():
    """Read-modify-write has to be atomic, otherwise two simultaneous moves read the
    same position and the last write discards the other."""
    store = Store()
    probe = store.launch(5, 5, Direction.NORTH)
    first_inside = threading.Event()
    release_first = threading.Event()
    second_inside = threading.Event()

    def slow(current: Probe) -> Probe:
        first_inside.set()
        release_first.wait(timeout=5)
        return current

    def fast(current: Probe) -> Probe:
        second_inside.set()
        return current

    first = threading.Thread(target=store.apply_to, args=(probe.id, slow))
    first.start()
    assert first_inside.wait(timeout=5), "the first call never reached change"

    second = threading.Thread(target=store.apply_to, args=(probe.id, fast))
    second.start()

    assert not second_inside.wait(timeout=0.2), "change ran without holding the lock"

    release_first.set()
    first.join(timeout=5)
    second.join(timeout=5)

    assert second_inside.is_set(), "the second call never finished"
