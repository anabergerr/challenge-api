import type { Direction } from "../lib/api";
import { LABEL } from "../lib/directions";

type Props = {
  direction: Direction;
  selected: boolean;
};

/** Rover seen from above, drawn pointing NORTH and rotated via CSS. */
export default function Rover({ direction, selected }: Props) {
  return (
    <svg
      className={`rover rover-${direction.toLowerCase()}${selected ? " rover-selected" : ""}`}
      viewBox="0 0 24 24"
      role="img"
      aria-label={`Sonda apontando para ${LABEL[direction]}`}
      data-direction={direction}
    >
      <g className="rover-wheels">
        <rect x="2.2" y="4.8" width="3.2" height="3.5" rx="1.1" />
        <rect x="2.2" y="10.2" width="3.2" height="3.5" rx="1.1" />
        <rect x="2.2" y="15.6" width="3.2" height="3.5" rx="1.1" />
        <rect x="18.6" y="4.8" width="3.2" height="3.5" rx="1.1" />
        <rect x="18.6" y="10.2" width="3.2" height="3.5" rx="1.1" />
        <rect x="18.6" y="15.6" width="3.2" height="3.5" rx="1.1" />
      </g>

      <rect className="rover-body" x="6" y="3.6" width="12" height="16.8" rx="3.2" />

      <rect className="rover-panel" x="8.3" y="8.6" width="7.4" height="6.2" rx="1.2" />
      <path className="rover-panel-line" d="M12 8.6v6.2M8.3 11.7h7.4" />

      <path className="rover-nose" d="M12 2.2 14.8 6.4H9.2Z" />
      <circle className="rover-lens" cx="12" cy="5.2" r="1.05" />
    </svg>
  );
}
