import type { Meta, StoryObj } from "@storybook/react-vite";
import type {
  AchievementKey,
  GardenElementId,
  GardenVisualStage,
} from "@/constants/achievements";
import type {
  AchievementDefinition,
  EarnedAchievement,
} from "@/services/achievementService";
import GardenScene, { type TimeOfDay } from "./GardenScene";

const definitionSeeds: Array<[
  AchievementKey,
  GardenElementId,
  hidden?: boolean,
]> = [
  ["hello_my_name_is", "sprout"],
  ["stalking_fern_legally", "sensor_mushroom"],
  ["matchmaker_of_moisture", "vine_link"],
  ["dirt_whisperer_initiate", "magnifier"],
  ["plant_texted_back", "bell_flower"],
  ["fully_rooted_not_emotionally", "garden_gnome"],
  ["hydration_hero", "watering_can"],
  ["back_from_the_mulch", "ghost_orchid"],
  ["juice_box_refiller", "battery_bush"],
  ["all_green_no_envy", "clover_cluster"],
  ["accidental_collector", "fern_pot"],
  ["latin_name_dropper", "label_stake"],
  ["influencer_garden", "camera_sunflower"],
  ["cloud_oracle", "rain_cloud"],
  ["face_of_the_garden", "mirror_pond"],
  ["seven_days_without_drama", "week_wreath", true],
  ["photosynthesis_stan", "month_sun", true],
  ["the_comeback_kid", "phoenix_fern", true],
  ["inbox_compost", "compost_bin", true],
  ["time_traveler", "hourglass_leaf", true],
  ["midnight_mulcher", "moon_mushroom", true],
];

const definitions: AchievementDefinition[] = definitionSeeds.map(
  ([key, gardenElement, isHidden], index) => ({
    key,
    name: key,
    description: "",
    garden_element: gardenElement,
    sort_order: (index + 1) * 10,
    is_hidden: isHidden ?? false,
  }),
);

function earnedThrough(count: number): EarnedAchievement[] {
  return definitions.slice(0, count).map((definition) => ({
    ...definition,
    unlocked_at: "2026-09-19T10:00:00.000Z",
  }));
}

interface GardenStoryProps {
  visualStage: GardenVisualStage;
  timeOfDay: TimeOfDay;
  unlockedCount: number;
  highlightLatest: boolean;
}

function GardenStory({
  visualStage,
  timeOfDay,
  unlockedCount,
  highlightLatest,
}: GardenStoryProps) {
  const earned = earnedThrough(unlockedCount);
  const latestKey = earned[earned.length - 1]?.key;

  return (
    <GardenScene
      visualStage={visualStage}
      timeOfDay={timeOfDay}
      allDefinitions={definitions}
      earned={earned}
      newlyUnlockedKeys={highlightLatest && latestKey ? [latestKey] : []}
    />
  );
}

const meta = {
  title: "Garden/Garden Scene",
  component: GardenStory,
  args: {
    visualStage: "garden",
    timeOfDay: "day",
    unlockedCount: 5,
    highlightLatest: false,
  },
  argTypes: {
    visualStage: {
      control: "select",
      options: ["soil", "garden", "forest"],
    },
    timeOfDay: {
      control: "select",
      options: ["dawn", "day", "dusk", "night"],
    },
    unlockedCount: {
      control: { type: "range", min: 0, max: definitions.length, step: 1 },
    },
  },
} satisfies Meta<typeof GardenStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SeedPacket: Story = {
  args: {
    visualStage: "soil",
    unlockedCount: 0,
  },
};

export const FirstPots: Story = {
  args: {
    visualStage: "soil",
    unlockedCount: 1,
  },
};

export const Greenfingers: Story = {
  args: {
    visualStage: "garden",
    unlockedCount: 5,
  },
};

export const SecretGarden: Story = {
  args: {
    visualStage: "garden",
    unlockedCount: 9,
  },
};

export const LittleForest: Story = {
  args: {
    visualStage: "forest",
    unlockedCount: 13,
  },
};

export const EverythingUnlocked: Story = {
  args: {
    visualStage: "forest",
    unlockedCount: definitions.length,
  },
};

export const NewlyUnlocked: Story = {
  args: {
    visualStage: "garden",
    unlockedCount: 5,
    highlightLatest: true,
  },
};

export const NightGarden: Story = {
  args: {
    visualStage: "forest",
    timeOfDay: "night",
    unlockedCount: 13,
  },
};
