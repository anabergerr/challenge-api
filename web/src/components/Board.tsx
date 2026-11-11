import { memo } from "react";
import type { Probe } from "../lib/api";
import Rover from "./Rover";

type Props = {
  /** Top-right corner of the board being drawn. */
  maxX: number;
  maxY: number;
  probes: Probe[];
  selectedId?: string;
};

/** Group probes by cell in one pass, so drawing does not filter per cell. */
function indexByCell(probes: Probe[]): Map<string, Probe[]> {
  const cells = new Map<string, Probe[]>();
  for (const probe of probes) {
    const key = `${probe.x},${probe.y}`;
    const here = cells.get(key);
    if (here) here.push(probe);
    else cells.set(key, [probe]);
  }
  return cells;
}

function Board({ maxX, maxY, probes, selectedId }: Props) {
  const byCell = indexByCell(probes);
  const rows = [];

  // Y grows upward, so we draw from the top (maxY) down to 0.
  for (let y = maxY; y >= 0; y--) {
    const cells = [];
    for (let x = 0; x <= maxX; x++) {
      const here = byCell.get(`${x},${y}`) ?? [];
      const selected = here.find((probe) => probe.id === selectedId) ?? here[0];
      cells.push(
        <div
          key={x}
          className={`cell${here.length > 0 ? " occupied" : ""}`}
          title={here.length > 0 ? here.map((probe) => probe.id).join(", ") : undefined}
        >
          {selected && (
            <Rover
              direction={selected.direction}
              selected={selected.id === selectedId}
            />
          )}
          {here.length > 1 && <span className="count">{here.length}</span>}
        </div>,
      );
    }
    rows.push(
      <div key={y} className="row">
        <span className="axis">{y}</span>
        {cells}
      </div>,
    );
  }

  const ruler = [<span key="pad" className="axis" />];
  for (let x = 0; x <= maxX; x++) {
    ruler.push(
      <span key={x} className="axis tick">
        {x}
      </span>,
    );
  }

  return (
    <section className="board" aria-label="Planalto">
      <h2>
        <span className="axis-title">Y</span> Planalto
      </h2>
      <div className="board-inner">
        {rows}
        <div className="row">
          {ruler}
          <span className="axis axis-name">X</span>
        </div>
      </div>
    </section>
  );
}

/**
 * Memoised: the board only depends on the probes and the selection. Typing in the
 * command field re-renders App, but must not rebuild thousands of cells.
 */
export default memo(Board);
