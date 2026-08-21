import { useState } from "react";

import { getSelectedElements } from "../../scene";
import { t } from "../../i18n";
import { useUIAppState } from "../../context/ui-appState";
import { useApp } from "../App";
import { Dialog } from "../Dialog";
import Spinner from "../Spinner";

import "./ExplainSelection.scss";

import type { ExplainSelection } from "../../types";

export const ExplainSelectionDialog = ({
  onExplain,
}: {
  onExplain: ExplainSelection;
}) => {
  const app = useApp();
  const appState = useUIAppState();
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (appState.openDialog?.name !== "explainSelection") {
    return null;
  }

  const selectedElements = getSelectedElements(
    app.scene.getNonDeletedElements(),
    appState,
    {
      includeBoundTextElement: true,
      includeElementsInFrames: true,
    },
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedElements.length || isLoading) {
      return;
    }

    setError("");
    setExplanation("");
    setIsLoading(true);

    try {
      const result = await onExplain({
        elements: selectedElements,
        prompt: prompt.trim(),
      });
      setExplanation(result.explanation);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : t("explainSelection.generationFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      className="explain-selection-dialog"
      onCloseRequest={() => app.setOpenDialog(null)}
      size="regular"
      title={t("explainSelection.title")}
    >
      <form onSubmit={handleSubmit}>
        <p className="explain-selection-dialog__description">
          {t("explainSelection.description", {
            count: selectedElements.length,
          })}
        </p>
        <label htmlFor="explain-selection-prompt">
          {t("explainSelection.promptLabel")}
        </label>
        <textarea
          id="explain-selection-prompt"
          data-testid="explain-selection-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("explainSelection.promptPlaceholder")}
          rows={4}
        />
        <button
          className="explain-selection-dialog__submit"
          data-testid="explain-selection-submit"
          type="submit"
          disabled={!selectedElements.length || isLoading}
        >
          {isLoading ? <Spinner /> : t("explainSelection.submit")}
        </button>
      </form>
      {!selectedElements.length && (
        <p className="explain-selection-dialog__error">
          {t("explainSelection.emptySelection")}
        </p>
      )}
      {error && (
        <p className="explain-selection-dialog__error" role="alert">
          {error}
        </p>
      )}
      {explanation && (
        <section
          className="explain-selection-dialog__result"
          data-testid="explain-selection-result"
          aria-live="polite"
        >
          <h3>{t("explainSelection.resultTitle")}</h3>
          <p>{explanation}</p>
        </section>
      )}
    </Dialog>
  );
};
