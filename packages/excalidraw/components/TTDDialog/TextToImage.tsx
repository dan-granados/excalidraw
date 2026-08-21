import { useEffect, useRef, useState } from "react";

import { trackEvent } from "../../analytics";
import { t } from "../../i18n";
import { useApp } from "../App";

import { TTDDialogPanel } from "./TTDDialogPanel";
import { TTDDialogPanels } from "./TTDDialogPanels";
import { TTDDialogSubmitShortcut } from "./TTDDialogSubmitShortcut";

import type { TTTDDialog } from "./types";

const MIN_PROMPT_LENGTH = 3;
const MAX_PROMPT_LENGTH = 4000;

export const TextToImage = ({
  onImageSubmit,
}: {
  onImageSubmit: TTTDDialog.onImageSubmit;
}) => {
  const app = useApp();
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const generate = async () => {
    const normalizedPrompt = prompt.trim();
    if (
      normalizedPrompt.length < MIN_PROMPT_LENGTH ||
      normalizedPrompt.length > MAX_PROMPT_LENGTH
    ) {
      setError(
        normalizedPrompt.length < MIN_PROMPT_LENGTH
          ? t("chat.errors.promptTooShort", { min: MIN_PROMPT_LENGTH })
          : t("chat.errors.promptTooLong", { max: MAX_PROMPT_LENGTH }),
      );
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setError(null);
    setIsGenerating(true);
    trackEvent("ai", "generate", "text-to-image");

    try {
      const generatedImage = await onImageSubmit({
        prompt: normalizedPrompt,
        signal: abortController.signal,
      });
      if (!generatedImage.type.startsWith("image/")) {
        throw new Error(t("imageGeneration.errors.invalidImage"));
      }
      setImage(generatedImage);
      trackEvent("ai", "generate success", "text-to-image");
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setError(error.message || t("chat.errors.generationFailed"));
        trackEvent("ai", "generate failed", "text-to-image");
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setIsGenerating(false);
      }
    }
  };

  const insert = async () => {
    if (!image) {
      return;
    }

    const extension = image.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const file = new File([image], `ai-generated-image.${extension}`, {
      type: image.type,
    });
    await app.insertImages([file]);
    app.setOpenDialog(null);
    trackEvent("ai", "insert", "text-to-image");
  };

  return (
    <TTDDialogPanels>
      <TTDDialogPanel
        label={t("labels.prompt")}
        panelActions={[
          {
            label: image
              ? t("imageGeneration.regenerate")
              : t("imageGeneration.generate"),
            action: generate,
            variant: "button",
            disabled: isGenerating,
          },
        ]}
        onTextSubmitInProgess={isGenerating}
        renderSubmitShortcut={() => <TTDDialogSubmitShortcut />}
      >
        <textarea
          data-testid="image-generation-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              generate();
            }
          }}
          placeholder={t("imageGeneration.placeholder")}
          maxLength={MAX_PROMPT_LENGTH}
          autoFocus
        />
        {error && (
          <div className="text-to-image__error" role="alert">
            {error}
          </div>
        )}
      </TTDDialogPanel>
      <TTDDialogPanel
        label={t("chat.preview")}
        className="ttd-dialog-preview-panel"
        panelActions={[
          {
            label: t("imageGeneration.insert"),
            action: insert,
            variant: "button",
            disabled: !image,
          },
        ]}
      >
        <div className="text-to-image__preview">
          {previewUrl ? (
            <img src={previewUrl} alt={t("imageGeneration.previewAlt")} />
          ) : (
            <p>{t("imageGeneration.emptyPreview")}</p>
          )}
        </div>
      </TTDDialogPanel>
    </TTDDialogPanels>
  );
};
