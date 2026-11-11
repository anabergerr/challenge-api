import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import ProbeRow from "../components/ProbeRow";
import type { Probe } from "../lib/api";

export function probe(x: number, y: number, id = "p1"): Probe {
  return { id, x, y, direction: "NORTH", max_x: 5, max_y: 5 };
}

function renderTableRow(selected = false) {
  const onSelect = vi.fn();
  render(
    <table>
      <tbody>
        <ProbeRow probe={probe(1, 1)} selected={selected} onSelect={onSelect} />
      </tbody>
    </table>,
  );
  return { row: screen.getByRole("row"), onSelect };
}

describe("ProbeRow accessibility", () => {
  it("has no axe violations", async () => {
    const { row } = renderTableRow();

    expect(await axe(row.closest("table")!)).toHaveNoViolations();
  });

  it("is reachable with the keyboard", () => {
    const { row } = renderTableRow();

    expect(row).toHaveAttribute("tabindex", "0");
  });

  it("selects with Enter", async () => {
    const user = userEvent.setup();
    const { row, onSelect } = renderTableRow();

    row.focus();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("selects with Space", async () => {
    const user = userEvent.setup();
    const { row, onSelect } = renderTableRow();

    row.focus();
    await user.keyboard(" ");

    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("does not select on unrelated keys", async () => {
    const user = userEvent.setup();
    const { row, onSelect } = renderTableRow();

    row.focus();
    await user.keyboard("a");

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("still selects on click", async () => {
    const user = userEvent.setup();
    const { row, onSelect } = renderTableRow();

    await user.click(row);

    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("exposes the selected state", () => {
    const { row } = renderTableRow(true);

    expect(row).toHaveAttribute("aria-selected", "true");
  });
});
