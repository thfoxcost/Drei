import {
  BriefcaseBusiness,
  Code2,
  Cpu,
  Gamepad2,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export interface OrganizationPurpose {
  value: string;
  /** Translation key for the human-readable label. */
  labelKey: string;
  icon: LucideIcon;
}

export const organizationPurposes: OrganizationPurpose[] = [
  { value: "work", labelKey: "orgs.purposes.work", icon: BriefcaseBusiness },
  { value: "school", labelKey: "orgs.purposes.school", icon: GraduationCap },
  { value: "hardware", labelKey: "orgs.purposes.hardware", icon: Cpu },
  { value: "software", labelKey: "orgs.purposes.software", icon: Code2 },
  {
    value: "recreational",
    labelKey: "orgs.purposes.recreational",
    icon: Gamepad2,
  },
];

// getPurposeMeta resolves the icon and label for an organization purpose.
// Returns undefined for null/unknown purposes so callers can safely hide
// the purpose badge instead of crashing.
export function getPurposeMeta(
  purpose: string | null | undefined,
): OrganizationPurpose | undefined {
  if (!purpose) return undefined;
  return organizationPurposes.find((p) => p.value === purpose);
}
