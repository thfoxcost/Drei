export function useInitials(word: string | null | undefined): string {
	return word?.slice(0, 2).toUpperCase() ?? "??";
}
