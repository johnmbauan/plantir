import type { AchievementKey } from "@/constants/achievements";

export type CreatureTalent =
  | "navigation"
  | "weatherSense"
  | "plantKnowledge"
  | "nightSight"
  | "recovery"
  | "observation"
  | "photography"
  | "communication"
  | "curiosity"
  | "resourcefulness";

export const CREATURE_TALENTS: CreatureTalent[] = [
  "navigation",
  "weatherSense",
  "plantKnowledge",
  "nightSight",
  "recovery",
  "observation",
  "photography",
  "communication",
  "curiosity",
  "resourcefulness",
];

export interface CreatureDefinition {
  id: AchievementKey;
  habitat: "sky" | "left" | "center" | "right" | "clearing";
  primaryTalent: CreatureTalent;
  secondaryTalent?: CreatureTalent;
  personalExpeditionId: string;
  signatureInteractionId: string;
}

export const CREATURES: Record<AchievementKey, CreatureDefinition> = {
  hello_my_name_is: {
    id: "hello_my_name_is",
    habitat: "center",
    primaryTalent: "curiosity",
    personalExpeditionId: "personal_brin",
    signatureInteractionId: "signature_brin",
  },
  stalking_fern_legally: {
    id: "stalking_fern_legally",
    habitat: "center",
    primaryTalent: "observation",
    secondaryTalent: "resourcefulness",
    personalExpeditionId: "personal_morel",
    signatureInteractionId: "signature_morel",
  },
  matchmaker_of_moisture: {
    id: "matchmaker_of_moisture",
    habitat: "center",
    primaryTalent: "communication",
    secondaryTalent: "navigation",
    personalExpeditionId: "personal_liana",
    signatureInteractionId: "signature_liana",
  },
  dirt_whisperer_initiate: {
    id: "dirt_whisperer_initiate",
    habitat: "clearing",
    primaryTalent: "observation",
    secondaryTalent: "curiosity",
    personalExpeditionId: "personal_peek",
    signatureInteractionId: "signature_peek",
  },
  plant_texted_back: {
    id: "plant_texted_back",
    habitat: "right",
    primaryTalent: "communication",
    personalExpeditionId: "personal_chime",
    signatureInteractionId: "signature_chime",
  },
  fully_rooted_not_emotionally: {
    id: "fully_rooted_not_emotionally",
    habitat: "clearing",
    primaryTalent: "resourcefulness",
    personalExpeditionId: "personal_knoll",
    signatureInteractionId: "signature_knoll",
  },
  hydration_hero: {
    id: "hydration_hero",
    habitat: "left",
    primaryTalent: "recovery",
    secondaryTalent: "plantKnowledge",
    personalExpeditionId: "personal_rill",
    signatureInteractionId: "signature_rill",
  },
  back_from_the_mulch: {
    id: "back_from_the_mulch",
    habitat: "sky",
    primaryTalent: "recovery",
    secondaryTalent: "nightSight",
    personalExpeditionId: "personal_wisp",
    signatureInteractionId: "signature_wisp",
  },
  juice_box_refiller: {
    id: "juice_box_refiller",
    habitat: "left",
    primaryTalent: "resourcefulness",
    personalExpeditionId: "personal_volt",
    signatureInteractionId: "signature_volt",
  },
  all_green_no_envy: {
    id: "all_green_no_envy",
    habitat: "center",
    primaryTalent: "plantKnowledge",
    personalExpeditionId: "personal_twinleaf",
    signatureInteractionId: "signature_twinleaf",
  },
  accidental_collector: {
    id: "accidental_collector",
    habitat: "right",
    primaryTalent: "curiosity",
    personalExpeditionId: "personal_pottle",
    signatureInteractionId: "signature_pottle",
  },
  latin_name_dropper: {
    id: "latin_name_dropper",
    habitat: "center",
    primaryTalent: "plantKnowledge",
    personalExpeditionId: "personal_quill",
    signatureInteractionId: "signature_quill",
  },
  influencer_garden: {
    id: "influencer_garden",
    habitat: "right",
    primaryTalent: "photography",
    personalExpeditionId: "personal_lumen",
    signatureInteractionId: "signature_lumen",
  },
  cloud_oracle: {
    id: "cloud_oracle",
    habitat: "sky",
    primaryTalent: "weatherSense",
    personalExpeditionId: "personal_nimbus",
    signatureInteractionId: "signature_nimbus",
  },
  face_of_the_garden: {
    id: "face_of_the_garden",
    habitat: "clearing",
    primaryTalent: "observation",
    personalExpeditionId: "personal_still",
    signatureInteractionId: "signature_still",
  },
  seven_days_without_drama: {
    id: "seven_days_without_drama",
    habitat: "clearing",
    primaryTalent: "plantKnowledge",
    secondaryTalent: "recovery",
    personalExpeditionId: "personal_halo",
    signatureInteractionId: "signature_halo",
  },
  photosynthesis_stan: {
    id: "photosynthesis_stan",
    habitat: "sky",
    primaryTalent: "weatherSense",
    personalExpeditionId: "personal_solara",
    signatureInteractionId: "signature_solara",
  },
  the_comeback_kid: {
    id: "the_comeback_kid",
    habitat: "left",
    primaryTalent: "recovery",
    personalExpeditionId: "personal_cinder",
    signatureInteractionId: "signature_cinder",
  },
  inbox_compost: {
    id: "inbox_compost",
    habitat: "left",
    primaryTalent: "resourcefulness",
    secondaryTalent: "curiosity",
    personalExpeditionId: "personal_muck",
    signatureInteractionId: "signature_muck",
  },
  time_traveler: {
    id: "time_traveler",
    habitat: "clearing",
    primaryTalent: "navigation",
    personalExpeditionId: "personal_drift",
    signatureInteractionId: "signature_drift",
  },
  midnight_mulcher: {
    id: "midnight_mulcher",
    habitat: "clearing",
    primaryTalent: "nightSight",
    secondaryTalent: "navigation",
    personalExpeditionId: "personal_umbra",
    signatureInteractionId: "signature_umbra",
  },
};

export function creatureTalents(id: AchievementKey): CreatureTalent[] {
  const creature = CREATURES[id];
  return creature.secondaryTalent
    ? [creature.primaryTalent, creature.secondaryTalent]
    : [creature.primaryTalent];
}
