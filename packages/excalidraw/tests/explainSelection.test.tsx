import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";

import { Excalidraw, ExplainSelectionPlugin } from "../index";

import { API } from "./helpers/api";
import { render } from "./test-utils";

describe("ExplainSelectionPlugin", () => {
  it("explains the selected elements with an optional question", async () => {
    const explain = vi.fn().mockResolvedValue({
      explanation: "The selected components describe a request flow.",
    });

    await render(
      <Excalidraw>
        <ExplainSelectionPlugin explain={explain} />
      </Excalidraw>,
    );

    const rectangle = API.createElement({
      type: "rectangle",
      x: 10,
      y: 10,
      width: 100,
      height: 100,
    });
    API.setElements([rectangle]);
    API.setAppState({
      selectedElementIds: { [rectangle.id]: true },
      openDialog: { name: "explainSelection" },
    });

    fireEvent.change(await screen.findByTestId("explain-selection-prompt"), {
      target: { value: "What happens here?" },
    });
    fireEvent.click(screen.getByTestId("explain-selection-submit"));

    await waitFor(() => {
      expect(explain).toHaveBeenCalledWith({
        elements: [rectangle],
        prompt: "What happens here?",
      });
    });
    expect(
      await screen.findByTestId("explain-selection-result"),
    ).toHaveTextContent("The selected components describe a request flow.");
  });
});
