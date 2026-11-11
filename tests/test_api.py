import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import MAX_BOARD, MAX_COMMANDS


@pytest.fixture
def client():
    """App with a clean store for each test."""
    from app import main

    main.store.clear()
    return TestClient(app)


def launch(client, x=5, y=5, direction="NORTH"):
    response = client.post("/probes", json={"x": x, "y": y, "direction": direction})
    assert response.status_code == 201
    return response.json()


def test_launch_starts_at_origin_with_id(client):
    probe = launch(client)

    assert probe["x"] == 0 and probe["y"] == 0
    assert probe["direction"] == "NORTH"
    assert probe["id"]


def test_launch_ignores_any_attempted_start_position(client):
    probe = launch(client, direction="EAST")

    assert (probe["x"], probe["y"]) == (0, 0)


def test_launch_rejects_invalid_direction(client):
    response = client.post("/probes", json={"x": 5, "y": 5, "direction": "UP"})

    assert response.status_code == 422


def test_launch_rejects_negative_board(client):
    response = client.post("/probes", json={"x": -1, "y": 5, "direction": "NORTH"})

    assert response.status_code == 422


def test_ids_are_unique(client):
    assert launch(client)["id"] != launch(client)["id"]


def test_launch_rejects_board_above_the_cap(client):
    response = client.post(
        "/probes", json={"x": MAX_BOARD + 1, "y": 5, "direction": "NORTH"}
    )

    assert response.status_code == 422


def test_launch_rejects_unknown_fields(client):
    response = client.post(
        "/probes",
        json={"x": 5, "y": 5, "direction": "NORTH", "x_inicial": 9, "admin": True},
    )

    assert response.status_code == 422


def test_launch_rejects_types_that_would_be_coerced(client):
    for valor in ("5", True, 5.9):
        response = client.post(
            "/probes", json={"x": valor, "y": 5, "direction": "NORTH"}
        )
        assert response.status_code == 422, f"{valor!r} should not become an integer"


def test_launch_returns_location_header(client):
    response = client.post("/probes", json={"x": 5, "y": 5, "direction": "NORTH"})

    assert response.headers["location"] == f"/probes/{response.json()['id']}"


def test_get_single_probe(client):
    probe = launch(client)

    response = client.get(f"/probes/{probe['id']}")

    assert response.status_code == 200
    assert response.json() == probe


def test_get_unknown_probe_is_404(client):
    assert client.get("/probes/nope").status_code == 404


def test_responses_carry_security_headers(client):
    response = client.get("/probes")

    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


def test_launch_accepts_board_at_the_cap(client):
    assert launch(client, x=MAX_BOARD, y=MAX_BOARD)["x"] == 0


def test_move_matches_readme_example(client):
    probe = launch(client)

    response = client.post(f"/probes/{probe['id']}/commands", json={"commands": "MRM"})

    assert response.status_code == 200
    body = response.json()
    assert (body["x"], body["y"], body["direction"]) == (1, 1, "EAST")
    assert body["id"] == probe["id"]


def test_move_unknown_probe_is_404(client):
    response = client.post("/probes/nope/commands", json={"commands": "M"})

    assert response.status_code == 404


def test_invalid_sequence_is_422_and_probe_does_not_move(client):
    probe = launch(client)

    invalid = client.post(f"/probes/{probe['id']}/commands", json={"commands": "MMMMMM"})
    assert invalid.status_code == 422

    state = client.get("/probes").json()["probes"]
    assert (state[0]["x"], state[0]["y"]) == (0, 0)


def test_unknown_command_is_422(client):
    probe = launch(client)

    response = client.post(f"/probes/{probe['id']}/commands", json={"commands": "MX"})

    assert response.status_code == 422


def test_command_sequence_above_the_cap_is_422(client):
    probe = launch(client)

    response = client.post(
        f"/probes/{probe['id']}/commands",
        json={"commands": "M" * (MAX_COMMANDS + 1)},
    )

    assert response.status_code == 422


def test_validation_error_and_domain_error_have_distinct_shapes(client):
    """422 has two shapes, and that is on purpose.

    Schema failures come from Pydantic as a list (one error per field, with `loc`).
    Domain failures are a single rule message. Unifying them would lose the
    per-field detail, so this is the contract and the client branches on the type.
    """
    schema = client.post("/probes", json={"x": 5, "y": 5, "direction": "UP"}).json()
    assert isinstance(schema["detail"], list)
    assert schema["detail"][0]["loc"] == ["body", "direction"]

    probe = launch(client)
    domain = client.post(
        f"/probes/{probe['id']}/commands", json={"commands": "MMMMMM"}
    ).json()
    assert isinstance(domain["detail"], str)


def test_list_returns_every_probe_with_current_position(client):
    first = launch(client)
    second = launch(client, direction="SOUTH")
    client.post(f"/probes/{first['id']}/commands", json={"commands": "MRM"})

    probes = client.get("/probes").json()["probes"]

    assert len(probes) == 2
    by_id = {probe["id"]: probe for probe in probes}
    assert (by_id[first["id"]]["x"], by_id[first["id"]]["y"]) == (1, 1)
    assert (by_id[second["id"]]["x"], by_id[second["id"]]["y"]) == (0, 0)


def test_each_probe_keeps_its_own_board_limits(client):
    small = launch(client, x=1, y=1)

    # A larger board launched later must not widen the small probe's board.
    launch(client, x=10, y=10)

    response = client.post(f"/probes/{small['id']}/commands", json={"commands": "MM"})

    assert response.status_code == 422


def test_reset_removes_every_probe(client):
    launch(client)
    launch(client, direction="SOUTH")

    response = client.delete("/probes")

    assert response.status_code == 200
    assert response.json() == {"probes": []}
    assert client.get("/probes").json() == {"probes": []}


def test_reset_does_not_break_launching_again(client):
    first = launch(client)
    client.delete("/probes")

    second = launch(client)

    assert second["id"] != first["id"]
    assert client.get("/probes").json()["probes"] == [second]


def test_probe_removed_by_reset_is_gone(client):
    probe = launch(client)
    client.delete("/probes")

    response = client.post(f"/probes/{probe['id']}/commands", json={"commands": "M"})

    assert response.status_code == 404
