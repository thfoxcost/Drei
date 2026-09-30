import { i18n } from "#/i18n/i18n";
import { authClient } from "#/lib/auth-client";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const ALPHA_TYPES = ["image/png", "image/webp", "image/gif"];
const MAX_DIMENSION = 2048;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 4_000_000;

export function validateAvatarFile(file: File): string | null {
	if (!ACCEPTED_TYPES.includes(file.type)) {
		return i18n.t("errors.client.avatarUnsupportedType") as string;
	}
	if (file.size > MAX_FILE_SIZE) {
		return i18n.t("errors.client.avatarTooLarge") as string;
	}
	return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () =>
			reject(new Error(i18n.t("errors.client.avatarReadFailed") as string));
		reader.readAsDataURL(file);
	});
}

async function encodeToDataUrl(
	bitmap: ImageBitmap,
	sourceType: string,
	originalDataUrl: string,
): Promise<string> {
	const preserveAlpha = ALPHA_TYPES.includes(sourceType);
	const needsResize =
		bitmap.width > MAX_DIMENSION || bitmap.height > MAX_DIMENSION;

	if (!needsResize && originalDataUrl.length <= MAX_DATA_URL_LENGTH) {
		return originalDataUrl;
	}

	let maxDimension = MAX_DIMENSION;
	let quality = 0.95;

	while (true) {
		const scale = Math.min(
			1,
			maxDimension / Math.max(bitmap.width, bitmap.height),
		);
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d");
		if (!ctx)
			throw new Error(
				i18n.t("errors.client.avatarCanvasUnsupported") as string,
			);

		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";
		ctx.drawImage(bitmap, 0, 0, width, height);

		let dataUrl: string;
		if (preserveAlpha) {
			dataUrl = canvas.toDataURL("image/webp", quality);
			if (!dataUrl.startsWith("data:image/webp")) {
				dataUrl = canvas.toDataURL("image/png");
			}
		} else {
			dataUrl = canvas.toDataURL("image/jpeg", quality);
		}

		if (dataUrl.length <= MAX_DATA_URL_LENGTH || maxDimension <= 128) {
			return dataUrl;
		}

		maxDimension = Math.round(maxDimension / 1.5);
		quality = 0.7;
	}
}

export async function uploadAvatar(file: File): Promise<void> {
	const error = validateAvatarFile(file);
	if (error) throw new Error(error);

	const originalDataUrl = await readFileAsDataUrl(file);
	const bitmap = await createImageBitmap(file);
	try {
		const dataUrl = await encodeToDataUrl(bitmap, file.type, originalDataUrl);
		await authClient.updateUser({ image: dataUrl });
	} finally {
		bitmap.close();
	}
}
