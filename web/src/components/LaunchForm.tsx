import { MAX_BOARD, type Direction } from "../lib/api";
import { ARROW, DIRECTIONS } from "../lib/directions";

type Props = {
  maxX: number;
  maxY: number;
  direction: Direction;
  onMaxXChange: (value: number) => void;
  onMaxYChange: (value: number) => void;
  onDirectionChange: (value: Direction) => void;
  onSubmit: (event: React.FormEvent) => void;
  busy: boolean;
};

/** Step 1: pick the board size and the starting direction. */
export default function LaunchForm({
  maxX,
  maxY,
  direction,
  onMaxXChange,
  onMaxYChange,
  onDirectionChange,
  onSubmit,
  busy,
}: Props) {
  return (
    <form onSubmit={onSubmit}>
      <h2>
        <span className="step-badge">1</span> Configurar planalto e lancar
      </h2>
      <label>
        Largura (0..{maxX})
        <input
          type="number"
          min={0}
          max={MAX_BOARD}
          value={maxX}
          onChange={(event) => onMaxXChange(Number(event.target.value))}
        />
      </label>
      <label>
        Altura (0..{maxY})
        <input
          type="number"
          min={0}
          max={MAX_BOARD}
          value={maxY}
          onChange={(event) => onMaxYChange(Number(event.target.value))}
        />
      </label>
      <label>
        Direcao inicial
        <select
          value={direction}
          onChange={(event) => onDirectionChange(event.target.value as Direction)}
        >
          {DIRECTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {ARROW[option.value]} {option.label} ({option.value})
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "Lancando..." : "Lancar sonda"}
      </button>
    </form>
  );
}
