export interface OrganizationUser {
	id: string;
	name: string;
	image: string | null;
}

export interface OrganizationDetail {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	visibility: "public" | "members";
	email: string | null;
	purpose: string | null;
	avatar: string | null;
	verified: boolean;
	status: "active" | "suspended";
	createdBy: OrganizationUser;
	memberCount: number;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface OrganizationListItem {
	id: number;
	name: string;
	slug: string;
	avatar: string | null;
	verified: boolean;
	status: "active" | "suspended";
	role: "owner" | "admin" | "member";
	pinned: boolean;
	memberCount: number;
	createdAt: string;
}

export interface OrganizationMember {
  id: string;
  name: string;
  image: string | null;
  role: string;
  joinedAt: string;
}

export interface OrganizationCreateRequest {
  name: string;
  description: string;
  visibility: "public" | "members";
  email: string;
  purpose: string;
  tags: string[];
  pinned: boolean;
}

export interface OrganizationUpdateRequest {
  name: string;
  description: string;
  purpose: string;
  email: string;
  status: "active" | "suspended";
  tags: string[];
}

export interface OrganizationRepo {
  id: number;
  name: string;
  description: string;
  visibility: boolean;
  archived: boolean;
  forked: boolean;
  forkedFromOwner: string;
  forkedFromName: string;
  language: string | null;
  lastUpdatedAt: string;
  forks: number;
  openPRs: number;
  size: number;
  activity: number[];
}

export interface OrganizationLanguage {
  name: string;
  bytes: number;
  percent: number;
}

export interface CreateOrganizationRepoRequest {
  name: string;
  description: string;
  visibility: boolean;
}
