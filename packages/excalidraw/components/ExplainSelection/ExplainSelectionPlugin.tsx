import { useLayoutEffect } from "react";

import { useApp } from "../App";

import { ExplainSelectionDialog } from "./ExplainSelectionDialog";

import type { ExplainSelection } from "../../types";

export const ExplainSelectionPlugin = ({
  explain,
}: {
  explain: ExplainSelection;
}) => {
  const app = useApp();

  useLayoutEffect(() => {
    app.setPlugins({
      explainSelection: { explain },
    });

    return () => {
      if (app.plugins.explainSelection?.explain === explain) {
        delete app.plugins.explainSelection;
      }
    };
  }, [app, explain]);

  return <ExplainSelectionDialog onExplain={explain} />;
};
