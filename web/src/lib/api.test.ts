import { describe, expect, it } from "vitest";
import { describeError } from "./api";

describe("describeError", () => {
  it("passes a string detail through untouched", () => {
    expect(describeError(422, { detail: "probe would leave the board" })).toBe(
      "probe would leave the board",
    );
  });

  it("joins the messages of a Pydantic validation list", () => {
    const message = describeError(422, {
      detail: [
        { loc: ["body", "x"], msg: "Input should be a valid integer" },
        { loc: ["body", "y"], msg: "Input should be greater than or equal to 0" },
      ],
    });

    expect(message).toBe(
      "Input should be a valid integer; Input should be greater than or equal to 0",
    );
  });

  it("never renders a list as [object Object]", () => {
    const message = describeError(422, { detail: [{ msg: "broken" }] });

    expect(message).not.toContain("[object Object]");
  });

  it("falls back to the status when there is no usable detail", () => {
    expect(describeError(500, null)).toBe("Erro 500");
    expect(describeError(503, {})).toBe("Erro 503");
    expect(describeError(400, { detail: [] })).toBe("Erro 400");
  });

  it("ignores detail entries without a msg", () => {
    expect(describeError(422, { detail: [{}, { msg: "real" }] })).toBe("real");
  });
});
