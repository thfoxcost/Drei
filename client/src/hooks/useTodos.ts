import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TodoItem } from "#/components/todo-types";
import { apiErrorMessage } from "#/i18n/lib/api-error";
import { backendUrl } from "#/lib/backend-url";

export type { TodoItem };

interface TodoReminder {
	kind: "next-open" | "time" | "repo-page";
	at?: string | null;
	repo?: { owner: string; name: string } | null;
}

interface TodoPayload {
	title?: string;
	status?: TodoItem["status"];
	pinned?: boolean;
	reminder?: TodoReminder | { kind: "" };
}

async function parseError(res: Response, fallback: string): Promise<Error> {
	const text = await res.text().catch(() => "");
	try {
		const body = JSON.parse(text);
		return new Error(apiErrorMessage(body) ?? fallback);
	} catch {
		return new Error(text || fallback);
	}
}

async function send(url: string, init: RequestInit): Promise<TodoItem> {
	const res = await fetch(url, {
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		...init,
	});

	if (!res.ok)
		throw await parseError(
			res,
			apiErrorMessage(null, { fallbackKey: "errors.client.requestFailed" }),
		);

	return res.json();
}

export function useTodos() {
	return useQuery({
		queryKey: ["todos"],
		queryFn: async (): Promise<TodoItem[]> => {
			const res = await fetch(`${backendUrl()}/api/todos`, {
				credentials: "include",
			});

			if (!res.ok)
				throw await parseError(
					res,
					apiErrorMessage(null, { fallbackKey: "errors.client.fetchToDos" }),
				);

			return res.json();
		},
		staleTime: 30_000,
	});
}

export function useCreateTodo() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (item: TodoItem) =>
			send(`${backendUrl()}/api/todos`, {
				method: "POST",
				body: JSON.stringify({ ...item, reminder: item.reminder ?? undefined }),
			}),
		onSuccess: (created) => {
			queryClient.setQueryData<TodoItem[]>(["todos"], (prev = []) => [
				...(prev ?? []).filter((item) => item.id !== created.id),
				created,
			]);
		},
	});
}

export function useUpdateTodo() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, changes }: { id: string; changes: TodoPayload }) =>
			send(`${backendUrl()}/api/todos/${id}`, {
				method: "PATCH",
				body: JSON.stringify(changes),
			}),
		onSuccess: (updated) => {
			queryClient.setQueryData<TodoItem[]>(["todos"], (prev = []) =>
				(prev ?? []).map((item) => (item.id === updated.id ? updated : item)),
			);
		},
	});
}

export function useDeleteTodo() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			send(`${backendUrl()}/api/todos/${id}`, { method: "DELETE" }).then(
				() => id,
			),
		onSuccess: (id) => {
			queryClient.setQueryData<TodoItem[]>(["todos"], (prev = []) =>
				(prev ?? []).filter((item) => item.id !== id),
			);
		},
	});
}
