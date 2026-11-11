from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, StrictInt

# Board ceiling. The spec defines no limit; this exists so an absurd request
# cannot create a grid that is impossible to draw in the interface.
MAX_BOARD = 100
MAX_COMMANDS = 1000


class Direction(StrEnum):
    NORTH = "NORTH"
    EAST = "EAST"
    SOUTH = "SOUTH"
    WEST = "WEST"


class Probe(BaseModel):
    """A probe and the board it was launched on.

    The board travels with the probe because each one keeps its own limits:
    launching a probe on a larger board later must not widen the older ones.
    """

    id: str
    x: int
    y: int
    direction: Direction
    max_x: int
    max_y: int


class LaunchRequest(BaseModel):
    """Body of POST /probes. x and y are the board's top-right corner.

    `extra="forbid"` rejects fields the contract does not define, and `StrictInt`
    rejects `"5"`, `5.9` and `true`, which Pydantic would silently coerce to int.
    """

    model_config = ConfigDict(extra="forbid")

    x: StrictInt = Field(ge=0, le=MAX_BOARD)
    y: StrictInt = Field(ge=0, le=MAX_BOARD)
    direction: Direction


class CommandSequence(BaseModel):
    """Body of POST /probes/{id}/commands."""

    model_config = ConfigDict(extra="forbid")

    commands: str = Field(max_length=MAX_COMMANDS)
