"""Probe rules. No FastAPI here: everything is pure and testable."""

from app.models import Direction, Probe

# Clockwise order: R moves +1 position in this tuple, L moves -1.
CLOCKWISE = (Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST)

DELTA = {
    Direction.NORTH: (0, 1),
    Direction.EAST: (1, 0),
    Direction.SOUTH: (0, -1),
    Direction.WEST: (-1, 0),
}


class InvalidCommandSequence(ValueError):
    """The probe refuses to run the whole sequence.

    Whoever raises this guarantees the probe kept both position and direction.
    """


def turn(direction: Direction, command: str) -> Direction:
    """R turns 90 degrees clockwise, L counter-clockwise."""
    if command not in ("L", "R"):
        raise ValueError(f"unknown rotation command: {command!r}")
    step = 1 if command == "R" else -1
    return CLOCKWISE[(CLOCKWISE.index(direction) + step) % len(CLOCKWISE)]


def apply_commands(probe: Probe, commands: str) -> Probe:
    """Return a new probe, or raise InvalidCommandSequence without touching the original."""
    x, y, direction = probe.x, probe.y, probe.direction

    for command in commands.upper():
        if command in ("L", "R"):
            direction = turn(direction, command)
        elif command == "M":
            dx, dy = DELTA[direction]
            x, y = x + dx, y + dy
            if not (0 <= x <= probe.max_x and 0 <= y <= probe.max_y):
                raise InvalidCommandSequence(
                    f"probe would leave the board at position ({x}, {y})"
                )
        else:
            raise InvalidCommandSequence(f"unknown command: {command!r}")

    return probe.model_copy(update={"x": x, "y": y, "direction": direction})
