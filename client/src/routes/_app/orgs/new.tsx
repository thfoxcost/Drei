import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";
import { organizationPurposes } from "#/components/organization/purpose";
import { i18n } from "#/i18n/i18n";
import { apiErrorMessage } from "#/i18n/lib/api-error";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCreateOrganization } from "@/hooks/useOrganizations";
import { authClient } from "@/lib/auth-client";
import { backendUrl } from "@/lib/backend-url";
import { authMiddleware } from "@/lib/middleware";
import { cn } from "@/lib/utils";

// Built per submit so validation messages follow the active language.
const getOrganizationSchema = () =>
	z.object({
		name: z
			.string()
			.trim()
			.min(1, i18n.t("orgs.new.validation.nameRequired") as string)
			.regex(
				/^[^\s]/,
				i18n.t("orgs.new.validation.nameLeadingSpace") as string,
			),
		description: z
			.string()
			.trim()
			.min(1, i18n.t("orgs.new.validation.descriptionRequired") as string)
			.refine(
				(v) => v.split(/\s+/).filter(Boolean).length >= 20,
				i18n.t("orgs.new.validation.descriptionMinWords") as string,
			),
		visibility: z.enum(["public", "members"]),
		email: z
			.string()
			.email(i18n.t("orgs.new.validation.invalidEmail") as string),
		reason: z
			.string()
			.min(1, i18n.t("orgs.new.validation.selectReason") as string),
		tags: z.array(z.string()).optional(),
		pinned: z.boolean(),
	});

const reasons = organizationPurposes;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
];

function validateAvatarFile(file: File): string | null {
	if (file.size > MAX_AVATAR_BYTES) {
		return i18n.t("errors.code.image_too_large_2mb") as string;
	}
	if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
		return i18n.t("errors.code.unsupported_image_type") as string;
	}
	return null;
}

export const Route = createFileRoute("/_app/orgs/new")({
	component: RouteComponent,
	server: {
		middleware: [authMiddleware],
	},
});

function RouteComponent() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const createOrganization = useCreateOrganization();

	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [orgName, setOrgName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isSubmittingRef = useRef(false);
	const createdOrgSlugRef = useRef<string | null>(null);
	// Platform-operator preview badge ("Created by platform owner"): driven
	// by the existing platform_owner flag via /api/profile, replacing the
	// former hardcoded-username check. The backend remains authoritative —
	// it stamps `verified` at creation with database.IsPlatformOwner.
	const [isPlatformOwner, setIsPlatformOwner] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function fetchPlatformOwner() {
			try {
				const res = await fetch(`${backendUrl()}/api/profile`, {
					credentials: "include",
				});

				if (!res.ok) return;

				const data = await res.json();

				if (!cancelled) setIsPlatformOwner(data?.platformOwner === true);
			} catch {
				// Badge stays hidden when the profile cannot be loaded.
			}
		}

		fetchPlatformOwner();

		return () => {
			cancelled = true;
		};
	}, []);

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			visibility: "public" as "public" | "members",
			email: "",
			reason: "",
			tags: [] as string[],
			pinned: false,
		},
		validators: {
			onSubmit: getOrganizationSchema(),
		},
		onSubmit: async ({ value }) => {
			if (isSubmittingRef.current) return;
			isSubmittingRef.current = true;
			setIsSubmitting(true);

			try {
				if (avatarFile) {
					const avatarError = validateAvatarFile(avatarFile);
					if (avatarError) {
						toast.error(avatarError);
						setAvatarFile(null);
						setAvatarPreview(null);
						return;
					}
				}

				if (!createdOrgSlugRef.current) {
					const org = await createOrganization.mutateAsync({
						name: value.name,
						description: value.description ?? "",
						visibility: value.visibility,
						email: value.email,
						purpose: value.reason,
						tags: value.tags ?? [],
						pinned: value.pinned,
					});
					createdOrgSlugRef.current = org.slug;
				}

				if (avatarFile) {
					const formData = new FormData();
					formData.append("avatar", avatarFile);

					const avatarRes = await fetch(
						`http://localhost:3200/api/orgs/${createdOrgSlugRef.current}/avatar`,
						{
							method: "POST",
							credentials: "include",
							body: formData,
						},
					);

					if (!avatarRes.ok) {
						const body = await avatarRes.json().catch(() => null);
						throw new Error(
							apiErrorMessage(body) ?? t("orgs.new.uploadFailed"),
						);
					}
				}

				const slug = createdOrgSlugRef.current;
				toast.success(t("orgs.new.createdToast"));
				await navigate({ to: "/orgs/$org", params: { org: slug } });
			} catch (err) {
				if (createdOrgSlugRef.current) {
					toast.error(t("orgs.new.createdButAvatarFailed"), {
						description:
							err instanceof Error
								? err.message
								: t("common.errors.somethingWentWrong"),
					});
				} else if (err instanceof Error) {
					toast.error(err.message);
				} else {
					toast.error(t("common.errors.somethingWentWrong"));
				}
			} finally {
				isSubmittingRef.current = false;
				setIsSubmitting(false);
			}
		},
	});

	function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const avatarError = validateAvatarFile(file);
		if (avatarError) {
			toast.error(avatarError);
			setAvatarFile(null);
			setAvatarPreview(null);
			e.target.value = "";
			return;
		}

		setAvatarFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => {
			setAvatarPreview(ev.target?.result as string);
		};
		reader.readAsDataURL(file);
	}

	return (
		<div className="mx-auto my-10 w-full max-w-3xl px-4">
			<div className="relative mb-6">
				<label
					className="absolute -left-1 -top-1 z-10 flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-muted-foreground/60"
					aria-label={t("orgs.new.uploadAvatar")}
				>
					{avatarPreview ? (
						<img
							src={avatarPreview}
							alt={t("orgs.new.avatar")}
							className="size-full object-cover"
						/>
					) : (
						<div className="flex flex-col items-center gap-1 text-muted-foreground">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="size-5"
								role="img"
								aria-label={t("orgs.new.uploadAvatar")}
							>
								<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
								<circle cx="12" cy="13" r="4" />
							</svg>
							<span className="text-[10px] font-medium">
								{t("orgs.new.upload")}
							</span>
						</div>
					)}
					<input
						type="file"
						accept="image/png,image/jpeg,image/webp,image/gif"
						className="sr-only"
						onChange={handleAvatarSelect}
					/>
				</label>

				<h1 className="mb-3 flex items-center gap-2 pl-24 text-5xl font-bold">
					{orgName || t("orgs.new.heading")}
					{isPlatformOwner && (
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 mt-2">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
										<path
											className="fill-foreground"
											d="M24 12a4.454 4.454 0 0 0-2.564-3.91 4.437 4.437 0 0 0-.948-4.578 4.436 4.436 0 0 0-4.577-.948A4.44 4.44 0 0 0 12 0a4.423 4.423 0 0 0-3.9 2.564 4.434 4.434 0 0 0-2.43-.178 4.425 4.425 0 0 0-2.158 1.126 4.42 4.42 0 0 0-1.12 2.156 4.42 4.42 0 0 0 .183 2.421A4.456 4.456 0 0 0 0 12a4.465 4.465 0 0 0 2.576 3.91 4.433 4.433 0 0 0 .936 4.577 4.459 4.459 0 0 0 4.577.95A4.454 4.454 0 0 0 12 24a4.439 4.439 0 0 0 3.91-2.563 4.26 4.26 0 0 0 5.526-5.526A4.453 4.453 0 0 0 24 12Zm-13.709 4.917-4.38-4.378 1.652-1.663 2.646 2.646L15.83 7.4l1.72 1.591-7.258 7.926Z"
										/>
									</svg>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>{t("orgs.new.createdBy")}</p>
							</TooltipContent>
						</Tooltip>
					)}
				</h1>
				<p className="mt-1 pl-24 text-sm text-muted-foreground">
					{t("orgs.new.subtitle")}
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<FieldGroup className="gap-4">
					<div className="flex flex-wrap items-end gap-3">
						<Field className="w-1/5">
							<FieldLabel>{t("orgs.new.owner")}</FieldLabel>
							<div className="flex items-center gap-2 rounded-md border p-1 text-sm">
								<Avatar size="sm">
									<AvatarImage
										src={session?.user.image ?? undefined}
										alt={session?.user.name ?? ""}
									/>
									<AvatarFallback>
										{session?.user.name?.[0]?.toUpperCase() ?? "?"}
									</AvatarFallback>
								</Avatar>
								<span className="text-muted-foreground">
									@{session?.user.name ?? "Unknown"}
								</span>
							</div>
						</Field>

						<form.Field
							name="name"
							children={(nameField) => {
								const nameInvalid =
									nameField.state.meta.isTouched &&
									!nameField.state.meta.isValid;
								return (
									<Field data-invalid={nameInvalid} className="flex-1">
										<FieldLabel htmlFor={nameField.name}>
											{t("orgs.new.name")}
										</FieldLabel>
										<Input
											id={nameField.name}
											name={nameField.name}
											value={nameField.state.value}
											onBlur={nameField.handleBlur}
											onChange={(e) => {
												nameField.handleChange(e.target.value);
												setOrgName(e.target.value);
											}}
											placeholder={t("orgs.new.namePlaceholder")}
											aria-invalid={nameInvalid}
										/>
										{nameInvalid && (
											<FieldError errors={nameField.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>
					</div>

					<form.Field
						name="description"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{t("orgs.new.description")}
									</FieldLabel>
									<Textarea
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={t("orgs.new.descriptionPlaceholder")}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>

					<form.Field
						name="email"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{t("orgs.new.email")}
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={t("orgs.new.emailPlaceholder")}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>

					<form.Field
						name="visibility"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel>{t("orgs.new.visibility")}</FieldLabel>
									<RadioGroup
										value={field.state.value}
										onValueChange={(v) =>
											field.handleChange(v as "public" | "members")
										}
										className="gap-3"
									>
										<div className="flex items-start gap-3">
											<RadioGroupItem value="public" id="public" />
											<div className="grid gap-1">
												<Label htmlFor="public">
													{t("orgs.new.visibilityPublic")}
												</Label>
												<p className="text-sm text-muted-foreground">
													{t("orgs.new.visibilityPublicHelp")}
												</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<RadioGroupItem value="members" id="members" />
											<div className="grid gap-1">
												<Label htmlFor="members">
													{t("orgs.new.visibilityMembers")}
												</Label>
												<p className="text-sm text-muted-foreground">
													{t("orgs.new.visibilityMembersHelp")}
												</p>
											</div>
										</div>
									</RadioGroup>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>

					<div className="flex flex-wrap items-start gap-4">
						<form.Field
							name="reason"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								const selectedReason = reasons.find(
									(r) => r.value === field.state.value,
								);
								const SelectedIcon = selectedReason?.icon;
								return (
									<Field
										data-invalid={isInvalid}
										className="w-full md:w-[calc(50%-0.5rem)]"
									>
										<FieldLabel>{t("orgs.new.purpose")}</FieldLabel>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													type="button"
													variant="outline"
													role="combobox"
													className={cn(
														"w-full justify-between font-normal",
														!field.state.value && "text-muted-foreground",
													)}
												>
													<span className="flex items-center gap-2">
														{SelectedIcon && (
															<SelectedIcon className="size-4" />
														)}
														{t(
															selectedReason?.labelKey ??
																"orgs.new.selectPurpose",
														)}
													</span>
													<ChevronsUpDown className="size-4 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-(--radix-popover-trigger-width) p-0"
												align="start"
											>
												<Command>
													<CommandInput
														placeholder={t("orgs.new.searchPurpose")}
														className="h-9"
													/>
													<CommandList>
														<CommandEmpty>
															{t("orgs.new.noPurpose")}
														</CommandEmpty>
														<CommandGroup>
															{reasons.map((reason) => {
																const Icon = reason.icon;
																return (
																	<CommandItem
																		key={reason.value}
																		value={reason.labelKey}
																		onSelect={() => {
																			field.handleChange(reason.value);
																		}}
																	>
																		<span className="flex items-center gap-2">
																			<Icon className="size-4" />
																			{t(reason.labelKey)}
																		</span>
																		<Check
																			className={cn(
																				"ml-auto size-4",
																				reason.value === field.state.value
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																	</CommandItem>
																);
															})}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						/>

						<form.Field
							name="tags"
							children={(field) => (
								<Field className="w-full md:w-[calc(50%-0.5rem)]">
									<FieldLabel>{t("orgs.new.tags")}</FieldLabel>
									<TagInput
										tags={field.state.value ?? []}
										setTags={(tags) => field.handleChange(tags)}
										placeholder={t("orgs.new.tagsPlaceholder")}
									/>
								</Field>
							)}
						/>
					</div>

					<form.Field
						name="pinned"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<div className="flex items-start gap-3">
										<Checkbox
											id={field.name}
											checked={field.state.value}
											onCheckedChange={(v) => field.handleChange(v === true)}
											aria-invalid={isInvalid}
										/>
										<div className="grid gap-1">
											<FieldLabel htmlFor={field.name}>
												{t("orgs.new.pinned")}
											</FieldLabel>
											<p className="text-sm text-muted-foreground">
												{t("orgs.new.pinnedHelp")}
											</p>
										</div>
									</div>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate({ to: "/" })}
						>
							{t("common.actions.cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Spinner />
									<span className="ml-2">{t("orgs.new.creating")}</span>
								</>
							) : (
								t("orgs.create")
							)}
						</Button>
					</div>
				</FieldGroup>
			</form>
		</div>
	);
}
