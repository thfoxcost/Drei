import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getActivity, PAGE_SIZE } from "#/lib/activity";
import { authClient } from "#/lib/auth-client";

export function useActivity(page: number) {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const userId = session?.user?.id ?? null;

	const query = useQuery({
		queryKey: ["activity", userId, page],
		queryFn: () => getActivity(page, PAGE_SIZE),
		enabled: !sessionPending && userId !== null,
		staleTime: 15_000,
		placeholderData: keepPreviousData,
	});

	return { ...query, userId, sessionPending };
}
