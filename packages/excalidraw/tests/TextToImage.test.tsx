import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TextToImage } from "../components/TTDDialog/TextToImage";

const mockApp = vi.hoisted(() => ({
  insertImages: vi.fn(),
  setOpenDialog: vi.fn(),
}));

vi.mock("../components/App", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../components/App")>()),
  useApp: () => mockApp,
}));

describe("TextToImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:generated-image"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates, previews, and inserts an image", async () => {
    const generatedImage = new Blob(["image"], { type: "image/png" });
    const onImageSubmit = vi.fn().mockResolvedValue(generatedImage);
    mockApp.insertImages.mockResolvedValue(undefined);

    render(<TextToImage onImageSubmit={onImageSubmit} />);

    fireEvent.change(screen.getByTestId("image-generation-prompt"), {
      target: { value: "A lighthouse sketched in ink" },
    });
    fireEvent.click(screen.getByText("Generate"));

    await waitFor(() =>
      expect(onImageSubmit).toHaveBeenCalledWith({
        prompt: "A lighthouse sketched in ink",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(await screen.findByAltText("AI-generated preview")).toHaveAttribute(
      "src",
      "blob:generated-image",
    );

    fireEvent.click(screen.getByText("Insert image"));

    await waitFor(() => expect(mockApp.insertImages).toHaveBeenCalledOnce());
    const insertedFile = mockApp.insertImages.mock.calls[0][0][0];
    expect(insertedFile).toBeInstanceOf(File);
    expect(insertedFile.type).toBe("image/png");
    expect(mockApp.setOpenDialog).toHaveBeenCalledWith(null);
  });

  it("rejects prompts that are too short", async () => {
    const onImageSubmit = vi.fn();

    render(<TextToImage onImageSubmit={onImageSubmit} />);
    fireEvent.change(screen.getByTestId("image-generation-prompt"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByText("Generate"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Prompt is too short",
    );
    expect(onImageSubmit).not.toHaveBeenCalled();
  });
});
