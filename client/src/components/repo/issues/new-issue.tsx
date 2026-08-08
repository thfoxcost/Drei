import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import { authClient } from "#/lib/auth-client";

function NewIssue() {
	const { username, repo } = useParams({ strict: false });
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [labels, setLabels] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const canSubmit = title.trim() !== "" && !submitting;

	async function handleSubmit() {
		if (!canSubmit) return;
		setSubmitting(true);

		try {
			const res = await fetch(
				`http://localhost:3200/api/repos/${username}/${repo}/issues`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: session?.user.id ?? "",
						username: session?.user.name ?? "",
						title: title.trim(),
						description,
						labels: labels
							.split(",")
							.map((label) => label.trim())
							.filter(Boolean),
					}),
				},
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to create issue",
				);
			}

			toast.success(`Issue #${result.number} created`);
			navigate({ to: `/${username}/${repo}/issues/${result.number}` });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="mx-40 max-w-3xl">
			<h1 className="mb-4 text-2xl font-semibold">New Issue</h1>
			<Separator className="my-2" />

			<div className="mt-4 space-y-4">
				<div className="space-y-2">
					<Label htmlFor="issue-title">Title</Label>
					<Input
						id="issue-title"
						type="text"
						placeholder="Issue title"
						maxLength={200}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						disabled={submitting}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="issue-description">Description</Label>
					<Textarea
						id="issue-description"
						rows={8}
						placeholder="Describe the issue..."
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						disabled={submitting}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="issue-labels">Labels</Label>
					<Input
						id="issue-labels"
						type="text"
						placeholder="bug, enhancement (comma separated)"
						value={labels}
						onChange={(e) => setLabels(e.target.value)}
						disabled={submitting}
					/>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button
						variant="outline"
						onClick={() => navigate({ to: `/${username}/${repo}/issues` })}
					>
						Cancel
					</Button>
					<Button
						className="bg-green-700 text-white hover:bg-green-800"
						onClick={handleSubmit}
						disabled={!canSubmit}
					>
						{submitting ? (
							<>
								<Spinner />
								<span className="ml-2">Creating...</span>
							</>
						) : (
							"Create issue"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}

export default NewIssue;
