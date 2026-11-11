import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Probe } from "./lib/api";

const probe = (id: string, direction: Probe["direction"] = "NORTH"): Probe => ({
  id,
  x: 0,
  y: 0,
  direction,
  max_x: 5,
  max_y: 5,
});

/** Route each fetch call to a fake response, keyed by method + path. */
function mockApi(routes: Record<string, () => { status?: number; body: unknown }>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const path = new URL(url).pathname;
    const method = (init?.method ?? "GET").toUpperCase();
    const key = `${method} ${path}`;
    const route = routes[key];
    if (!route) {
      throw new Error(`unexpected request: ${key}`);
    }
    const { status = 200, body } = route();
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockApi({}));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("shows the empty state when there are no probes", async () => {
    vi.stubGlobal("fetch", mockApi({ "GET /probes": () => ({ body: { probes: [] } }) }));
    render(<App />);

    expect(await screen.findByText(/Nenhuma sonda lancada ainda/)).toBeInTheDocument();
  });

  it("lists the probes returned by the API", async () => {
    vi.stubGlobal(
      "fetch",
      mockApi({ "GET /probes": () => ({ body: { probes: [probe("abc"), probe("xyz", "SOUTH")] } }) }),
    );
    render(<App />);

    const table = await screen.findByRole("table");
    expect(within(table).getByText("abc")).toBeInTheDocument();
    expect(within(table).getByText("xyz")).toBeInTheDocument();
  });

  it("launches a probe with the board size from the form", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      "GET /probes": () => ({ body: { probes: [] } }),
      "POST /probes": () => ({ status: 201, body: probe("new") }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await screen.findByText(/Nenhuma sonda lancada ainda/);

    const width = screen.getByLabelText(/Largura/);
    const height = screen.getByLabelText(/Altura/);
    await user.clear(width);
    await user.type(width, "3");
    await user.clear(height);
    await user.type(height, "1");
    await user.click(screen.getByRole("button", { name: "Lancar sonda" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(post).toBeDefined();
      expect(JSON.parse(String(post![1]!.body))).toEqual({
        x: 3,
        y: 1,
        direction: "NORTH",
      });
    });
  });

  it("announces a domain error in an alert region", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      mockApi({
        "GET /probes": () => ({ body: { probes: [probe("abc")] } }),
        "POST /probes/abc/commands": () => ({
          status: 422,
          body: { detail: "probe would leave the board at position (0, 6)" },
        }),
      }),
    );
    render(<App />);

    await screen.findByRole("table");
    await user.type(screen.getByLabelText(/Sequencia/), "MMMMMM");
    await user.click(screen.getByRole("button", { name: "Executar sequencia" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("probe would leave the board at position (0, 6)");
  });

  it("keeps the live region mounted even with nothing to announce", async () => {
    vi.stubGlobal("fetch", mockApi({ "GET /probes": () => ({ body: { probes: [] } }) }));
    const { container } = render(<App />);

    await screen.findByText(/Nenhuma sonda lancada ainda/);

    const live = container.querySelector("[aria-live]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toBeEmptyDOMElement();
  });

  it("asks for confirmation before resetting", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      "GET /probes": () => ({ body: { probes: [probe("abc")] } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Reiniciar missao" }));

    expect(screen.getByText(/Recolher todas as 1 sondas/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);
  });

  it("cancels the reset without deleting anything", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      "GET /probes": () => ({ body: { probes: [probe("abc")] } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Reiniciar missao" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByText(/Recolher todas/)).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);
  });

  it("resets the mission when confirmed", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      "GET /probes": () => ({ body: { probes: [probe("abc")] } }),
      "DELETE /probes": () => ({ body: { probes: [] } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Reiniciar missao" }));
    await user.click(screen.getByRole("button", { name: /Sim, reiniciar/ }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(true);
    });
    expect(await screen.findByText(/Todas as sondas foram recolhidas/)).toBeInTheDocument();
  });

  it("has no axe violations in the initial state", async () => {
    vi.stubGlobal("fetch", mockApi({ "GET /probes": () => ({ body: { probes: [] } }) }));
    const { container } = render(<App />);

    await screen.findByText(/Nenhuma sonda lancada ainda/);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations with probes and an error shown", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      mockApi({
        "GET /probes": () => ({ body: { probes: [probe("abc")] } }),
        "POST /probes/abc/commands": () => ({
          status: 422,
          body: { detail: "unknown command: 'X'" },
        }),
      }),
    );
    const { container } = render(<App />);

    await screen.findByRole("table");
    await user.type(screen.getByLabelText(/Sequencia/), "X");
    await user.click(screen.getByRole("button", { name: "Executar sequencia" }));
    await screen.findByRole("alert");

    expect(await axe(container)).toHaveNoViolations();
  });
});
