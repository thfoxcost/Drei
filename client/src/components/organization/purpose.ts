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
  label: string;
  icon: LucideIcon;
}

export const organizationPurposes: OrganizationPurpose[] = [
  { value: "work", label: "Work", icon: BriefcaseBusiness },
  { value: "school", label: "School", icon: GraduationCap },
  { value: "hardware", label: "Hardware", icon: Cpu },
  { value: "software", label: "Software", icon: Code2 },
  { value: "recreational", label: "Recreational", icon: Gamepad2 },
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
