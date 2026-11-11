import type { Direction } from "./api";

/** Arrow used wherever the direction appears as text. */
export const ARROW: Record<Direction, string> = {
  NORTH: "\u2191",
  EAST: "\u2192",
  SOUTH: "\u2193",
  WEST: "\u2190",
};

/** Direction name in Portuguese, for labels and screen readers. */
export const LABEL: Record<Direction, string> = {
  NORTH: "Norte",
  EAST: "Leste",
  SOUTH: "Sul",
  WEST: "Oeste",
};

/** Order in which directions appear in a select: clockwise, starting north. */
export const DIRECTIONS = (Object.keys(ARROW) as Direction[]).map((value) => ({
  value,
  label: LABEL[value],
}));
