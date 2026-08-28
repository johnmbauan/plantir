import { useState } from "react";
import { Popover } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { GARDEN_LAYOUT } from "@/constants/achievements";
import type { AchievementDefinition } from "@/services/achievementService";
import { GardenSprite, MysterySprite } from "./GardenSprites";
import GardenInspectPopover from "./GardenInspectPopover";

interface Props {
  definition: AchievementDefinition;
  earned: boolean;
  animateIn?: boolean;
}

export default function GardenElement({ definition, earned, animateIn }: Props) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const layout = GARDEN_LAYOUT[definition.garden_element];
  const isHiddenLocked = !earned && definition.is_hidden;

  const classNames = [
    "garden-element",
    !earned && "garden-element--locked",
    animateIn && "garden-element--grow",
  ]
    .filter(Boolean)
    .join(" ");

  const ariaLabel = isHiddenLocked
    ? t("garden.mysteryBadgeAria", { description: definition.description })
    : `${definition.name}: ${definition.description}`;

  return (
    <Popover
      opened={hovered}
      position="top"
      withArrow
      shadow="md"
      width={220}
      withinPortal
    >
      <Popover.Target>
        <button
          type="button"
          className={classNames}
          style={{ left: `${layout.x}%`, top: `${layout.y}%` }}
          aria-label={ariaLabel}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          {isHiddenLocked
            ? <MysterySprite size={layout.size} />
            : <GardenSprite element={definition.garden_element} size={layout.size} />}
        </button>
      </Popover.Target>
      <Popover.Dropdown>
        <GardenInspectPopover
          name={definition.name}
          description={definition.description}
          locked={!earned}
          hidden={definition.is_hidden}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
