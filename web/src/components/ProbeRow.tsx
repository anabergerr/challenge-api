import type { KeyboardEvent } from "react";
import type { Probe } from "../lib/api";
import { ARROW } from "../lib/directions";

type Props = {
  probe: Probe;
  selected: boolean;
  onSelect: (id: string) => void;
};

/** A table row that can also be selected with the keyboard. */
export default function ProbeRow({ probe, selected, onSelect }: Props) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(probe.id);
    }
  }

  return (
    <tr
      className={selected ? "selected" : undefined}
      tabIndex={0}
      aria-selected={selected}
      onClick={() => onSelect(probe.id)}
      onKeyDown={handleKeyDown}
    >
      <td>{probe.id}</td>
      <td>{probe.x}</td>
      <td>{probe.y}</td>
      <td>
        {ARROW[probe.direction]} {probe.direction}
      </td>
    </tr>
  );
}
