from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from app.engine import InvalidCommandSequence, apply_commands
from app.models import CommandSequence, LaunchRequest, Probe
from app.store import Store

app = FastAPI(title="Mars Probe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


store = Store()


@app.post("/probes", status_code=201, response_model=Probe)
def launch_probe(body: LaunchRequest, response: Response) -> Probe:
    probe = store.launch(body.x, body.y, body.direction)
    response.headers["Location"] = f"/probes/{probe.id}"
    return probe


@app.get("/probes", response_model=dict[str, list[Probe]])
def list_probes() -> dict[str, list[Probe]]:
    return {"probes": store.all()}


@app.get("/probes/{probe_id}", response_model=Probe)
def get_probe(probe_id: str) -> Probe:
    probe = store.find(probe_id)
    if probe is None:
        raise HTTPException(status_code=404, detail=f"probe {probe_id} not found")
    return probe


@app.post("/probes/{probe_id}/commands", response_model=Probe)
def move_probe(probe_id: str, body: CommandSequence) -> Probe:
    try:
        moved = store.apply_to(
            probe_id, lambda probe: apply_commands(probe, body.commands)
        )
    except InvalidCommandSequence as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    if moved is None:
        raise HTTPException(status_code=404, detail=f"probe {probe_id} not found")
    return moved


@app.delete("/probes")
def reset_probes() -> dict[str, list[Probe]]:
    store.clear()
    return {"probes": []}
