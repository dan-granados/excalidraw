type ImageGenerationResponse = {
  image?: string;
  dataURL?: string;
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
};

const decodeBase64Image = (base64: string, mimeType = "image/png") => {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
};

export const parseImageGenerationResponse = async (
  response: Response,
  signal?: AbortSignal,
): Promise<Blob> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Image generation failed (${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    return response.blob();
  }

  const payload = (await response.json()) as ImageGenerationResponse;
  const imageSource =
    payload.image || payload.dataURL || payload.data?.[0]?.url || null;
  const base64 = payload.data?.[0]?.b64_json;

  if (base64) {
    return decodeBase64Image(base64);
  }

  if (imageSource) {
    const imageResponse = await fetch(imageSource, { signal });
    if (!imageResponse.ok) {
      throw new Error("Could not download the generated image");
    }
    const image = await imageResponse.blob();
    if (image.type.startsWith("image/")) {
      return image;
    }
  }

  throw new Error("Image generation returned an invalid response");
};

export const generateImage = async ({
  prompt,
  signal,
}: {
  prompt: string;
  signal?: AbortSignal;
}) => {
  const response = await fetch(
    `${import.meta.env.VITE_APP_AI_BACKEND}/v1/ai/text-to-image/generate`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, image/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      signal,
    },
  );

  return parseImageGenerationResponse(response, signal);
};
