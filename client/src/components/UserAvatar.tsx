import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { authClient } from "#/lib/auth-client";
import { uploadAvatar } from "#/lib/avatar-upload";

interface UserAvatarProps {
	src?: string | null;
	name?: string | null;
	size?: "default" | "sm" | "lg";
	uploadable?: boolean;
	className?: string;
	onUploaded?: () => void;
}

function getInitials(name: string | null | undefined): string {
	return (
		name
			?.split(" ")
			.map((word) => word[0])
			.join("")
			.slice(0, 2)
			.toUpperCase() ?? ""
	);
}

function UserAvatar({
	src,
	name,
	size = "default",
	uploadable = false,
	className,
	onUploaded,
}: UserAvatarProps) {
	const { t } = useTranslation();

	const inputRef = useRef<HTMLInputElement>(null);
	const { data: session, refetch } = authClient.useSession();
	const [uploading, setUploading] = useState(false);

	const avatarSrc = src ?? session?.user.image ?? null;
	const avatarName = name ?? session?.user.name ?? null;

	async function handleFile(file?: File) {
		if (!file) return;
		try {
			setUploading(true);
			await uploadAvatar(file);
			await refetch();
			toast.success(t("settings.profile.avatarUpdated"));
			onUploaded?.();
		} catch (err) {
			console.error(err);
			toast.error(
				err instanceof Error
					? err.message
					: t("settings.profile.avatarUpdateFailed"),
			);
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	}

	const avatar = (
		<Avatar size={size} className={className}>
			<AvatarImage
				src={avatarSrc ?? undefined}
				alt={avatarName ?? t("common.states.unknownUser")}
			/>
			<AvatarFallback>{getInitials(avatarName)}</AvatarFallback>
		</Avatar>
	);

	if (!uploadable) {
		return avatar;
	}

	return (
		<label
			className="relative inline-block cursor-pointer"
			aria-label={t("common.actions.changeAvatar")}
		>
			{avatar}
			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/gif"
				className="sr-only"
				disabled={uploading}
				onChange={(e) => handleFile(e.target.files?.[0])}
			/>
		</label>
	);
}

export { UserAvatar };
