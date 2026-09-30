import type { EmojiClickData } from "emoji-picker-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "#/components/ui/combobox";
import { Field, FieldDescription, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { i18n } from "#/i18n/i18n";
import { apiErrorMessage } from "#/i18n/lib/api-error";
import { authClient } from "#/lib/auth-client";

import { uploadAvatar, validateAvatarFile } from "@/lib/avatar-upload";
import { countries } from "@/lib/countries";

interface ProfileData {
	name: string;
	email: string;
	profession: string | null;
	biography: string | null;
	description: string | null;
	country: string | null;
	quotePersonName: string | null;
	quoteText: string | null;
	quotePersonTitle: string | null;
	quotePersonImage: string | null;
	quoteVerified: boolean;
}

function ContentProfile() {
	const { t } = useTranslation();

	const { data: session, refetch } = authClient.useSession();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	const [loadingProfile, setLoadingProfile] = useState(true);
	const [updating, setUpdating] = useState(false);

	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [profession, setProfession] = useState("");
	const [bio, setBio] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [description, setDescription] = useState("");
	const [country, setCountry] = useState<string>("");

	// Quote card
	const [quoteTitle, setQuoteTitle] = useState("");
	const [quoteDescription, setQuoteDescription] = useState("");
	const [quotePersonTitle, setQuotePersonTitle] = useState("");
	const [quoteImage, setQuoteImage] = useState("");
	const [quoteVerified, setQuoteVerified] = useState(false);

	// Store original values for change detection
	const [original, setOriginal] = useState<ProfileData | null>(null);

	useEffect(() => {
		async function fetchProfile() {
			try {
				const res = await fetch("http://localhost:3200/api/profile", {
					credentials: "include",
				});

				if (!res.ok) {
					throw new Error(
						apiErrorMessage(null, {
							fallbackKey: "errors.client.fetchProfile",
						}),
					);
				}

				const data: ProfileData = await res.json();

				setUsername(data.name);
				setEmail(data.email);
				setProfession(data.profession ?? "");
				setBio(data.biography ?? "");
				setDescription(data.description ?? "");
				setCountry(data.country ?? "");
				setQuoteTitle(data.quotePersonName ?? "");
				setQuoteDescription(data.quoteText ?? "");
				setQuotePersonTitle(data.quotePersonTitle ?? "");
				setQuoteImage(data.quotePersonImage ?? "");
				setQuoteVerified(data.quoteVerified);
				setOriginal(data);
			} catch {
				toast.error(i18n.t("settings.profile.loadFailed"));
			} finally {
				setLoadingProfile(false);
			}
		}

		fetchProfile();
	}, []);

	const handleEmojiClick = (emojiData: EmojiClickData) => {
		setBio((prev) => prev + emojiData.emoji);
	};

	const changed =
		!loadingProfile &&
		original !== null &&
		(username !== original.name ||
			email !== original.email ||
			profession !== (original.profession ?? "") ||
			bio !== (original.biography ?? "") ||
			description !== (original.description ?? "") ||
			country !== (original.country ?? "") ||
			quoteTitle !== (original.quotePersonName ?? "") ||
			quoteDescription !== (original.quoteText ?? "") ||
			quotePersonTitle !== (original.quotePersonTitle ?? "") ||
			quoteImage !== (original.quotePersonImage ?? "") ||
			quoteVerified !== original.quoteVerified);

	const canSave =
		changed && username.trim() !== "" && email.trim() !== "" && !updating;

	async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const error = validateAvatarFile(file);
		if (error) {
			toast.error(error);
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		// Show preview immediately
		const reader = new FileReader();
		reader.onload = () => setAvatarPreview(reader.result as string);
		reader.readAsDataURL(file);

		try {
			setUploadingAvatar(true);
			await uploadAvatar(file);
			await refetch();
			toast.success(t("settings.profile.avatarUpdated"));
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: t("settings.profile.avatarUpdateFailed"),
			);
			setAvatarPreview(null);
		} finally {
			setUploadingAvatar(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	const currentAvatarSrc = avatarPreview ?? session?.user?.image ?? undefined;
	const avatarInitials = (username || session?.user?.name || "")
		.split(" ")
		.map((p) => p[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	async function handleUpdate() {
		setUpdating(true);

		try {
			const res = await fetch("http://localhost:3200/api/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					name: username.trim(),
					email: email.trim(),
					profession: profession.trim() || null,
					biography: bio || null,
					description: description || null,
					country: country || null,
					quotePersonName: quoteTitle || null,
					quoteText: quoteDescription || null,
					quotePersonTitle: quotePersonTitle || null,
					quotePersonImage: quoteImage || null,
					quoteVerified,
				}),
			});

			const result = await res.json();

			if (!res.ok) {
				throw new Error(apiErrorMessage(result));
			}

			setOriginal({
				name: username.trim(),
				email: email.trim(),
				profession: profession.trim() || null,
				biography: bio || null,
				description: description || null,
				country: country || null,
				quotePersonName: quoteTitle || null,
				quoteText: quoteDescription || null,
				quotePersonTitle: quotePersonTitle || null,
				quotePersonImage: quoteImage || null,
				quoteVerified,
			});

			toast.success(t("settings.profile.updated"));
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error(t("common.errors.somethingWentWrong"));
			}
		} finally {
			setUpdating(false);
		}
	}

	if (loadingProfile) {
		return (
			<div className="mx-auto w-full max-w-5xl space-y-4 mb-10">
				<div>
					<h1 className="text-2xl">{t("settings.profile.title")}</h1>
					<Separator className="my-2" />
				</div>
				<div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
					<Spinner />
					<span>{t("settings.profile.loading")}</span>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-5xl space-y-4 mb-10">
			<div>
				<h1 className="text-2xl">{t("settings.profile.title")}</h1>
				<Separator className="my-2" />
			</div>

			<div className="flex flex-col lg:flex-row gap-8">
				<div className="flex-1 space-y-4">
					<Field className="w-full">
						<FieldLabel htmlFor="input-field-username">
							{t("settings.profile.username")}
						</FieldLabel>

						<Input
							id="input-field-username"
							type="text"
							placeholder={t("settings.profile.usernamePlaceholder")}
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							disabled={updating}
						/>

						<FieldDescription>
							{t("settings.profile.usernameHelp")}
						</FieldDescription>
					</Field>

					<Field className="w-full">
						<FieldLabel htmlFor="fieldgroup-email">
							{t("settings.profile.email")}
						</FieldLabel>

						<Input
							id="fieldgroup-email"
							type="email"
							placeholder="name@example.com"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							disabled={updating}
						/>

						<FieldDescription>
							{t("settings.profile.emailHelp")}
						</FieldDescription>
					</Field>

					<Field className="w-full">
						<FieldLabel htmlFor="input-field-profession">
							{t("settings.profile.profession")}
						</FieldLabel>

						<Input
							id="input-field-profession"
							type="text"
							placeholder={t("settings.profile.professionPlaceholder")}
							value={profession}
							onChange={(event) => setProfession(event.target.value)}
							disabled={updating}
						/>

						<FieldDescription>
							{t("settings.profile.professionHelp")}
						</FieldDescription>
					</Field>

					<Field className="w-full">
						<FieldLabel htmlFor="bio">
							{t("settings.profile.biography")}
						</FieldLabel>

						<div className="relative">
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="shrink-0"
									onClick={() => setShowEmojiPicker((prev) => !prev)}
									aria-label={t("common.actions.selectEmoji")}
									disabled={updating}
								>
									😊
								</Button>

								<Input
									id="bio"
									type="text"
									value={bio}
									onChange={(event) => setBio(event.target.value)}
									placeholder={t("settings.profile.biographyPlaceholder")}
									disabled={updating}
								/>
							</div>

							{showEmojiPicker && (
								<div className="absolute left-0 top-full z-50 mt-2">
									<EmojiPicker
										theme={Theme.DARK}
										onEmojiClick={handleEmojiClick}
										width={350}
										height={450}
									/>
								</div>
							)}
						</div>

						<FieldDescription>
							{t("settings.profile.biographyHelp")}
						</FieldDescription>
					</Field>

					<Field className="w-full">
						<FieldLabel htmlFor="textarea-description">
							{t("settings.profile.description")}
						</FieldLabel>

						<Textarea
							id="textarea-description"
							placeholder={t("settings.profile.descriptionPlaceholder")}
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							disabled={updating}
						/>
					</Field>

					<Field className="w-full">
						<FieldLabel>{t("settings.profile.country")}</FieldLabel>

						<Combobox
							items={countries}
							value={country}
							onValueChange={(v) => setCountry(v ?? "")}
						>
							<ComboboxInput
								placeholder={t("settings.profile.countryPlaceholder")}
								disabled={updating}
							/>

							<ComboboxContent>
								<ComboboxEmpty>
									{t("settings.profile.countryEmpty")}
								</ComboboxEmpty>

								<ComboboxList>
									{(c) => (
										<ComboboxItem key={c.code} value={c.name}>
											<div className="flex items-center gap-2">
												<ReactCountryFlag
													countryCode={c.code}
													svg
													style={{
														width: "1.5em",
														height: "1.5em",
													}}
												/>

												<span>{c.name}</span>
											</div>
										</ComboboxItem>
									)}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</Field>

					<div className="pt-4">
						<h1 className="text-xl">{t("settings.profile.quoteHeading")}</h1>
						<Separator className="my-2" />
					</div>

					<Field className="w-full">
						<FieldLabel htmlFor="quote-title">
							{t("settings.profile.personName")}
						</FieldLabel>

						<Input
							id="quote-title"
							value={quoteTitle}
							onChange={(event) => setQuoteTitle(event.target.value)}
							placeholder={t("settings.profile.personNamePlaceholder")}
							disabled={updating}
						/>

						<FieldDescription>
							{t("settings.profile.personNameHelp")}
						</FieldDescription>
					</Field>

					<Field className="w-full">
						<FieldLabel htmlFor="quote-description">
							{t("settings.profile.quoteLabel")}
						</FieldLabel>

						<Textarea
							id="quote-description"
							value={quoteDescription}
							onChange={(event) => setQuoteDescription(event.target.value)}
							placeholder={t("settings.profile.quotePlaceholder")}
							disabled={updating}
						/>

						<FieldDescription>
							{t("settings.profile.quoteHelp")}
						</FieldDescription>
					</Field>

					<Field className="w-full">
						<FieldLabel htmlFor="quote-person-title">
							{t("settings.profile.personTitle")}
						</FieldLabel>

						<Input
							id="quote-person-title"
							type="text"
							value={quotePersonTitle}
							onChange={(event) => setQuotePersonTitle(event.target.value)}
							placeholder={t("settings.profile.personTitlePlaceholder")}
							disabled={updating}
						/>

						<FieldDescription>
							{t("settings.profile.personTitleHelp")}
						</FieldDescription>
					</Field>

					<Field className="w-full">
						<FieldLabel htmlFor="quote-image">
							{t("settings.profile.personImage")}
						</FieldLabel>

						<Input
							id="quote-image"
							type="url"
							value={quoteImage}
							onChange={(event) => setQuoteImage(event.target.value)}
							placeholder="https://example.com/person.jpg"
							disabled={updating}
						/>

						<FieldDescription>
							{t("settings.profile.personImageHelp")}
						</FieldDescription>
					</Field>

					<Field className="w-full">
						<div className="flex items-center justify-between">
							<div>
								<FieldLabel htmlFor="quote-verified">
									{t("settings.profile.verified")}
								</FieldLabel>

								<FieldDescription>
									Show a verified badge next to the person&apos;s name.
								</FieldDescription>
							</div>

							<Switch
								id="quote-verified"
								checked={quoteVerified}
								onCheckedChange={setQuoteVerified}
								disabled={updating}
							/>
						</div>
					</Field>
				</div>

				<div className="flex flex-col items-center gap-2 shrink-0 lg:mt-1">
					<Avatar className="size-40">
						<AvatarImage src={currentAvatarSrc} alt={username} />
						<AvatarFallback>{avatarInitials || "?"}</AvatarFallback>
					</Avatar>
					<button
						type="button"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadingAvatar}
					>
						{uploadingAvatar ? (
							<span className="flex items-center gap-1">
								<Spinner className="size-3" />
								{t("common.actions.uploading")}
							</span>
						) : (
							t("common.actions.edit")
						)}
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg,image/webp"
						className="sr-only"
						disabled={uploadingAvatar}
						onChange={handleAvatarChange}
					/>
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<a href="/">
					<Button variant="outline">{t("common.actions.back")}</Button>
				</a>
				<Button onClick={handleUpdate} disabled={!canSave}>
					{updating ? (
						<>
							<Spinner />
							<span className="ml-2">{t("settings.profile.updating")}</span>
						</>
					) : (
						t("settings.profile.updateInfo")
					)}
				</Button>
			</div>
		</div>
	);
}

export default ContentProfile;
