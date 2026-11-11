import { useCallback, useEffect, useState } from "react";
import {
  type Direction,
  type Probe,
  launchProbe,
  listProbes,
  resetProbes,
  sendCommands,
} from "./lib/api";
import Board from "./components/Board";
import CommandForm from "./components/CommandForm";
import HowToPlay from "./components/HowToPlay";
import LaunchForm from "./components/LaunchForm";
import ResetBar from "./components/ResetBar";
import ProbeRow from "./components/ProbeRow";

export default function App() {
  const [maxX, setMaxX] = useState(5);
  const [maxY, setMaxY] = useState(5);
  const [direction, setDirection] = useState<Direction>("NORTH");
  const [probes, setProbes] = useState<Probe[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [commands, setCommands] = useState("MRM");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { probes } = await listProbes();
      setProbes(probes);
      setSelectedId((current) => current || probes[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao listar sondas");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleLaunch(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const probe = await launchProbe(maxX, maxY, direction);
      setStatus(`Sonda ${probe.id} lancada em (0, 0) olhando para ${probe.direction}`);
      setSelectedId(probe.id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao lancar sonda");
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!selectedId) {
      setError("Lance uma sonda antes de enviar comandos");
      return;
    }
    setBusy(true);
    try {
      const probe = await sendCommands(selectedId, commands);
      setStatus(
        `Sonda ${probe.id} agora em (${probe.x}, ${probe.y}) olhando para ${probe.direction}`,
      );
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sequencia invalida");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await resetProbes();
      setProbes([]);
      setSelectedId("");
      setConfirmingReset(false);
      setStatus("Todas as sondas foram recolhidas. Planalto livre para uma nova missao.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao reiniciar a missao");
    } finally {
      setBusy(false);
    }
  }

  const selected = probes.find((probe) => probe.id === selectedId);

  // The grid shows the selected probe's board. When another probe sits outside
  // it, the grid grows so that probe stays visible.
  const boardMaxX = Math.max(selected?.max_x ?? maxX, ...probes.map((p) => p.x));
  const boardMaxY = Math.max(selected?.max_y ?? maxY, ...probes.map((p) => p.y));

  return (
    <main>
      <header className="hero">
        <p className="mission">Missao Ares · Planalto Xanthe</p>
        <h1>Sonda em Marte</h1>
        <p className="tagline">
          Comande sondas por um planalto retangular. Cada sonda anda e gira num grid, e nunca
          pode sair da beirada.
        </p>
      </header>

      <HowToPlay />

      {/* The live region stays mounted so screen readers announce later updates.
          Content is only rendered when there is something to say. */}
      <div aria-live="polite">
        {error ? (
          <p className="message error" role="alert">
            {error}
          </p>
        ) : status ? (
          <p className="message ok">{status}</p>
        ) : null}
      </div>

      <div className="panels">
        <LaunchForm
          maxX={maxX}
          maxY={maxY}
          direction={direction}
          onMaxXChange={setMaxX}
          onMaxYChange={setMaxY}
          onDirectionChange={setDirection}
          onSubmit={handleLaunch}
          busy={busy}
        />
        <CommandForm
          probes={probes}
          selectedId={selectedId}
          selected={selected}
          commands={commands}
          onSelect={setSelectedId}
          onCommandsChange={setCommands}
          onSubmit={handleMove}
          busy={busy}
        />
      </div>

      <Board maxX={boardMaxX} maxY={boardMaxY} probes={probes} selectedId={selectedId} />

      <ResetBar
        probeCount={probes.length}
        confirming={confirmingReset}
        onAskConfirmation={() => setConfirmingReset(true)}
        onCancel={() => setConfirmingReset(false)}
        onConfirm={handleReset}
        busy={busy}
      />

      <h2>Todas as sondas</h2>
      {probes.length === 0 ? (
        <p className="empty">Nenhuma sonda lancada ainda. Comece pelo passo 1.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>X</th>
              <th>Y</th>
              <th>Direcao</th>
            </tr>
          </thead>
          <tbody>
            {probes.map((probe) => (
              <ProbeRow
                key={probe.id}
                probe={probe}
                selected={probe.id === selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
