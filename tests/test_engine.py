import pytest

from app.engine import InvalidCommandSequence, apply_commands, turn
from app.models import Direction, Probe

NORTH_AT_ORIGIN = Probe(
    id="p1", x=0, y=0, direction=Direction.NORTH, max_x=5, max_y=5
)


def test_readme_example_mrm_gives_one_one_east():
    result = apply_commands(NORTH_AT_ORIGIN, "MRM")

    assert (result.x, result.y, result.direction) == (1, 1, Direction.EAST)


@pytest.mark.parametrize(
    ("direction", "command", "expected"),
    [
        (Direction.NORTH, "R", Direction.EAST),
        (Direction.EAST, "R", Direction.SOUTH),
        (Direction.SOUTH, "R", Direction.WEST),
        (Direction.WEST, "R", Direction.NORTH),
        (Direction.NORTH, "L", Direction.WEST),
        (Direction.WEST, "L", Direction.SOUTH),
    ],
)
def test_turns(direction, command, expected):
    assert turn(direction, command) == expected


def test_rotating_four_times_returns_to_start():
    result = apply_commands(NORTH_AT_ORIGIN, "RRRR")

    assert result == NORTH_AT_ORIGIN


def test_turn_does_not_move():
    probe = Probe(id="p1", x=2, y=3, direction=Direction.NORTH, max_x=5, max_y=5)

    result = apply_commands(probe, "LLLL")

    assert (result.x, result.y) == (2, 3)


def test_turn_rejects_unknown_rotation():
    with pytest.raises(ValueError):
        turn(Direction.NORTH, "X")


def test_empty_sequence_is_valid_and_changes_nothing():
    assert apply_commands(NORTH_AT_ORIGIN, "") == NORTH_AT_ORIGIN


def test_moves_exactly_to_far_corner():
    result = apply_commands(NORTH_AT_ORIGIN, "MMMMM")

    assert (result.x, result.y) == (0, 5)


def test_leaving_board_raises_and_leaves_probe_untouched():
    with pytest.raises(InvalidCommandSequence):
        apply_commands(NORTH_AT_ORIGIN, "MMMMMM")

    assert NORTH_AT_ORIGIN.x == 0 and NORTH_AT_ORIGIN.y == 0


def test_invalid_character_raises():
    with pytest.raises(InvalidCommandSequence):
        apply_commands(NORTH_AT_ORIGIN, "MXM")


def test_cannot_walk_south_from_bottom_row():
    probe = Probe(id="p1", x=0, y=0, direction=Direction.SOUTH, max_x=5, max_y=5)

    with pytest.raises(InvalidCommandSequence):
        apply_commands(probe, "M")


def test_lowercase_commands_are_accepted():
    result = apply_commands(NORTH_AT_ORIGIN, "mrm")

    assert (result.x, result.y, result.direction) == (1, 1, Direction.EAST)


def test_rectangular_board_limits_each_axis_on_its_own():
    probe = Probe(id="p1", x=0, y=0, direction=Direction.EAST, max_x=2, max_y=0)

    assert apply_commands(probe, "MM").x == 2
    with pytest.raises(InvalidCommandSequence):
        apply_commands(probe, "MMM")
