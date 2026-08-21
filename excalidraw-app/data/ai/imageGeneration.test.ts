import { describe, expect, it, vi } from "vitest";

import { parseImageGenerationResponse } from "./imageGeneration";

describe("parseImageGenerationResponse", () => {
  it("accepts a direct image response", async () => {
    const response = new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { "content-type": "image/png" },
    });

    const image = await parseImageGenerationResponse(response);

    expect(image.type).toBe("image/png");
    expect(image.size).toBe(4);
  });

  it("decodes an OpenAI-compatible base64 response", async () => {
    const response = Response.json({
      data: [{ b64_json: btoa("generated image") }],
    });

    const image = await parseImageGenerationResponse(response);

    expect(image.type).toBe("image/png");
    expect(await image.text()).toBe("generated image");
  });

  it("downloads an image returned as a URL", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(new Uint8Array([1, 2]), {
          headers: { "content-type": "image/webp" },
        }),
      );

    const image = await parseImageGenerationResponse(
      Response.json({ image: "https://images.example/generated.webp" }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://images.example/generated.webp",
      { signal: undefined },
    );
    expect(image.type).toBe("image/webp");
    fetchSpy.mockRestore();
  });

  it("surfaces backend errors", async () => {
    await expect(
      parseImageGenerationResponse(
        new Response("Daily generation limit reached", { status: 429 }),
      ),
    ).rejects.toThrow("Daily generation limit reached");
  });
});
