import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Board from "../components/Board";
import type { Direction, Probe } from "../lib/api";

function probe(
  x: number,
  y: number,
  direction: Direction,
  id = `${x}-${y}-${direction}`,
): Probe {
  return { id, x, y, direction, max_x: 5, max_y: 5 };
}

describe("Board", () => {
  it("draws every cell of a square board", () => {
    const { container } = render(<Board maxX={5} maxY={5} probes={[]} />);

    expect(container.querySelectorAll(".cell")).toHaveLength(36);
  });

  it("draws one limit per axis on a rectangular board", () => {
    const { container } = render(<Board maxX={2} maxY={4} probes={[]} />);

    // 3 columns x 5 rows
    expect(container.querySelectorAll(".cell")).toHaveLength(15);
    expect(container.querySelectorAll(".row")).toHaveLength(6); // 5 board rows + ruler
  });

  it("places each probe in its own cell, pointing the right way", () => {
    render(
      <Board
        maxX={5}
        maxY={5}
        probes={[
          probe(0, 0, "NORTH"),
          probe(5, 5, "EAST"),
          probe(2, 3, "SOUTH"),
          probe(4, 1, "WEST"),
        ]}
      />,
    );

    expect(screen.getByLabelText("Sonda apontando para Norte")).toHaveAttribute(
      "data-direction",
      "NORTH",
    );
    expect(screen.getByLabelText("Sonda apontando para Leste")).toHaveAttribute(
      "data-direction",
      "EAST",
    );
    expect(screen.getByLabelText("Sonda apontando para Sul")).toHaveAttribute(
      "data-direction",
      "SOUTH",
    );
    expect(screen.getByLabelText("Sonda apontando para Oeste")).toHaveAttribute(
      "data-direction",
      "WEST",
    );
  });

  it("rotates the rover with a class instead of inline styles", () => {
    const { container } = render(
      <Board maxX={5} maxY={5} probes={[probe(0, 0, "EAST")]} />,
    );

    expect(container.querySelector(".rover-east")).toBeInTheDocument();
  });

  it("collapses stacked probes into one rover with a counter", () => {
    const probes = Array.from({ length: 20 }, (_, i) => probe(0, 0, "EAST", `s${i}`));
    const { container } = render(<Board maxX={5} maxY={5} probes={probes} />);

    expect(container.querySelectorAll(".rover")).toHaveLength(1);
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("lists the stacked probe ids as the cell tooltip", () => {
    const { container } = render(
      <Board maxX={5} maxY={5} probes={[probe(1, 1, "NORTH", "a"), probe(1, 1, "SOUTH", "b")]} />,
    );

    const occupied = container.querySelector(".cell.occupied");
    expect(occupied).toHaveAttribute("title", "a, b");
  });

  it("is exposed as a labelled region", () => {
    render(<Board maxX={5} maxY={5} probes={[]} />);

    expect(screen.getByRole("region", { name: "Planalto" })).toBeInTheDocument();
  });
});
