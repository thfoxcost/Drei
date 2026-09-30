import type { en } from "../en";
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
 * Same shape as the English catalog, but every leaf is widened to `string` so
 * the German copy is free to differ while the *structure* is identical.
 *
 * Recursing through the object type is what makes a missing or surplus key a
 * compile error at any depth, not just at the top level.
 */
type Translations<T> = {
	[K in keyof T]: T[K] extends string ? string : Translations<T[K]>;
};

export const de: Translations<typeof en> = {
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
};
