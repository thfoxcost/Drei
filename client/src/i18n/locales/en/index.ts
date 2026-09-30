import { auth } from "./auth";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { errors } from "./errors";
import { heatmap } from "./heatmap";
import { compare, insights } from "./insights";
import { issues } from "./issues";
import { nav } from "./nav";
import { orgs } from "./orgs";
import { createRepo, people, repositories } from "./people";
import { pulls } from "./pulls";
import { repo } from "./repo";
import { settings } from "./settings";
import { todos } from "./todos";

/**
 * The English catalog. This object is the schema every other locale is checked
 * against, so it is intentionally `as const`.
 */
export const en = {
	auth,
	common,
	compare,
	dashboard,
	errors,
	heatmap,
	insights,
	issues,
	nav,
	orgs,
	people,
	pulls,
	repositories,
	repo,
	settings,
	todos,
	createRepo,
} as const;
