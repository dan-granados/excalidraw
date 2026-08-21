import { trackEvent } from "../../analytics";
import { useTunnels } from "../../context/tunnels";
import { useI18n } from "../../i18n";
import { useExcalidrawSetAppState } from "../App";
import DropdownMenu from "../dropdownMenu/DropdownMenu";
import { brainIcon, ImageIcon } from "../icons";

import type { JSX, ReactNode } from "react";

export const TTDDialogTrigger = ({
  children,
  icon,
  tab = "text-to-diagram",
}: {
  children?: ReactNode;
  icon?: JSX.Element;
  tab?: "text-to-diagram" | "image";
}) => {
  const { t } = useI18n();
  const { TTDDialogTriggerTunnel } = useTunnels();
  const setAppState = useExcalidrawSetAppState();

  return (
    <TTDDialogTriggerTunnel.In>
      <DropdownMenu.Item
        onSelect={() => {
          trackEvent("ai", "dialog open", tab);
          setAppState({ openDialog: { name: "ttd", tab } });
        }}
        icon={icon ?? (tab === "image" ? ImageIcon : brainIcon)}
        badge={<DropdownMenu.Item.Badge>AI</DropdownMenu.Item.Badge>}
      >
        {children ??
          (tab === "image"
            ? t("imageGeneration.label")
            : t("labels.textToDiagram"))}
      </DropdownMenu.Item>
    </TTDDialogTriggerTunnel.In>
  );
};
TTDDialogTrigger.displayName = "TTDDialogTrigger";
