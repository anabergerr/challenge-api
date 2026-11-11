import type { Probe } from "../lib/api";
import { COMMAND_KEYS } from "../lib/commands";

type Props = {
  probes: Probe[];
  selectedId: string;
  selected: Probe | undefined;
  commands: string;
  onSelect: (id: string) => void;
  onCommandsChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  busy: boolean;
};

/** Step 2: pick a probe, build a sequence and run it. */
export default function CommandForm({
  probes,
  selectedId,
  selected,
  commands,
  onSelect,
  onCommandsChange,
  onSubmit,
  busy,
}: Props) {
  return (
    <form onSubmit={onSubmit}>
      <h2>
        <span className="step-badge">2</span> Enviar comandos
      </h2>
      <label>
        Sonda
        <select
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
          disabled={busy}
        >
          {probes.length === 0 && <option value="">nenhuma sonda ainda</option>}
          {probes.map((probe) => (
            <option key={probe.id} value={probe.id}>
              {probe.id} · ({probe.x}, {probe.y}) {probe.direction}
            </option>
          ))}
        </select>
      </label>

      <div className="command-buttons">
        {COMMAND_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="command"
            onClick={() => onCommandsChange(commands + key)}
            disabled={busy}
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          className="command ghost"
          onClick={() => onCommandsChange("")}
          disabled={busy}
        >
          Limpar
        </button>
      </div>

      <label>
        Sequencia
        <input
          value={commands}
          placeholder="ex: MRM"
          onChange={(event) => onCommandsChange(event.target.value.toUpperCase())}
          disabled={busy}
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "Executando..." : "Executar sequencia"}
      </button>
      {selected && (
        <p className="hint">
          {selected.id} esta em ({selected.x}, {selected.y}) apontando para{" "}
          {selected.direction}
        </p>
      )}
    </form>
  );
}
