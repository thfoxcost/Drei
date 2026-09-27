import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field"
import { Input } from "#/components/ui/input"
import { Separator } from "#/components/ui/separator"
import { Button } from "#/components/ui/button"
import { Spinner } from "#/components/ui/spinner"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog"
import { authClient } from "#/lib/auth-client"

function ContentAccount() {
	const { refetch } = authClient.useSession()

	// --- Email ---
	const [email, setEmail] = useState("")
	const [originalEmail, setOriginalEmail] = useState("")
	const [loadingEmail, setLoadingEmail] = useState(true)
	const [updatingEmail, setUpdatingEmail] = useState(false)

	// --- Password ---
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [changingPassword, setChangingPassword] = useState(false)

	// --- Delete Account ---
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [deletePassword, setDeletePassword] = useState("")
	const [deleting, setDeleting] = useState(false)

	// Fetch current account data on mount
	useEffect(() => {
		let cancelled = false

		async function fetchAccount() {
			try {
				const res = await fetch("/api/user/account", {
					credentials: "include",
				})

				if (!res.ok) {
					throw new Error("Failed to load account")
				}

				const data = await res.json()

				if (!cancelled) {
					setEmail(data.email)
					setOriginalEmail(data.email)
				}
			} catch {
				if (!cancelled) {
					toast.error("Failed to load account data")
				}
			} finally {
				if (!cancelled) {
					setLoadingEmail(false)
				}
			}
		}

		fetchAccount()
		return () => {
			cancelled = true
		}
	}, [])

	const emailChanged = email.trim() !== originalEmail && email.trim() !== ""

	// --- Update Email ---
	async function handleUpdateEmail() {
		if (!email.trim()) {
			toast.error("Email cannot be empty")
			return
		}

		setUpdatingEmail(true)

		try {
			const res = await fetch("/api/user/account", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email: email.trim() }),
			})

			const result = await res.json()

			if (!res.ok) {
				throw new Error(result.error || "Failed to update email")
			}

			setOriginalEmail(email.trim())
			await refetch()
			toast.success("Email updated")
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Something went wrong",
			)
		} finally {
			setUpdatingEmail(false)
		}
	}

	// --- Change Password ---
	async function handleChangePassword() {
		if (!currentPassword) {
			toast.error("Please enter your current password")
			return
		}

		if (!newPassword) {
			toast.error("Please enter a new password")
			return
		}

		if (newPassword.length < 8) {
			toast.error("New password must be at least 8 characters")
			return
		}

		if (newPassword !== confirmPassword) {
			toast.error("New passwords do not match")
			return
		}

		setChangingPassword(true)

		try {
			const res = await fetch("/api/user/account/password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					currentPassword,
					newPassword,
				}),
			})

			const result = await res.json()

			if (!res.ok) {
				throw new Error(result.error || "Failed to change password")
			}

			setCurrentPassword("")
			setNewPassword("")
			setConfirmPassword("")
			toast.success("Password changed")
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Something went wrong",
			)
		} finally {
			setChangingPassword(false)
		}
	}

	// --- Delete Account ---
	async function handleDeleteAccount() {
		if (!deletePassword) {
			toast.error("Please enter your password")
			return
		}

		setDeleting(true)

		try {
			const res = await fetch("/api/user/account", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ password: deletePassword }),
			})

			const result = await res.json()

			if (!res.ok) {
				throw new Error(
					result.error || result.message || "Failed to delete account",
				)
			}

			toast.success("Account deleted successfully")
			window.location.href = "/"
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Something went wrong",
			)
		} finally {
			setDeleting(false)
		}
	}

	if (loadingEmail) {
		return (
			<div className="mx-auto mb-10 w-full max-w-5xl space-y-4">
				<div className="pt-4">
					<h1 className="text-xl">Account Settings</h1>
					<Separator className="my-2" />
				</div>
				<div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
					<Spinner />
					<span>Loading account...</span>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto mb-10 w-full max-w-5xl space-y-4">
			<div className="pt-4">
				<h1 className="text-xl">Password</h1>
				<Separator className="my-2" />
			</div>

			<FieldGroup className="w-120">
				<Field>
					<FieldLabel htmlFor="current-password">
						Current Password
					</FieldLabel>

					<Input
						id="current-password"
						type="password"
						placeholder="Enter your current password"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						disabled={changingPassword}
						className="mb-3"
					/>

					<FieldLabel htmlFor="new-password">
						New Password
					</FieldLabel>

					<Input
						id="new-password"
						type="password"
						placeholder="Enter your new password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						disabled={changingPassword}
						className="mb-3"
					/>

					<FieldLabel htmlFor="confirm-password">
						Confirm New Password
					</FieldLabel>

					<Input
						id="confirm-password"
						type="password"
						placeholder="Confirm your new password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						disabled={changingPassword}
					/>
				</Field>

				<div>
					<Button
						onClick={handleChangePassword}
						disabled={
							changingPassword ||
							!currentPassword ||
							!newPassword ||
							!confirmPassword
						}
					>
						{changingPassword ? (
							<>
								<Spinner />
								<span className="ml-2">Changing...</span>
							</>
						) : (
							"Change Password"
						)}
					</Button>
				</div>
			</FieldGroup>

			<div className="pt-4">
				<h1 className="text-xl">Email</h1>
				<Separator className="my-2" />
			</div>

			<FieldGroup className="w-120">
				<Field>
					<FieldLabel htmlFor="email">
						Email Address
					</FieldLabel>

					<Input
						id="email"
						type="email"
						placeholder="name@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={updatingEmail}
					/>

					<FieldDescription>
						This email address will be used for your account.
					</FieldDescription>
				</Field>

				<div>
					<Button
						onClick={handleUpdateEmail}
						disabled={updatingEmail || !emailChanged}
					>
						{updatingEmail ? (
							<>
								<Spinner />
								<span className="ml-2">Updating...</span>
							</>
						) : (
							"Update Email"
						)}
					</Button>
				</div>
			</FieldGroup>

			<div className="pt-8">
				<h1 className="mb-2 text-2xl text-destructive">
					Danger Zone
				</h1>

				<div className="max-w-full rounded-sm border border-destructive">
					<div className="flex flex-row items-center justify-between gap-4 p-4">
						<div className="flex flex-col">
							<span className="font-bold">
								Delete your account
							</span>

							<span className="text-sm">
								Permanently delete your account and all
								associated data. This action cannot be undone.
							</span>
						</div>

						<Button
							variant="destructive"
							onClick={() => {
								setDeletePassword("")
								setDeleteOpen(true)
							}}
						>
							Delete account
						</Button>
					</div>
				</div>
			</div>

			<Dialog
				open={deleteOpen}
				onOpenChange={(open) => {
					if (!deleting) {
						setDeleteOpen(open)
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Delete your account?
						</DialogTitle>

						<DialogDescription>
							This action cannot be undone. This will
							permanently delete your account and all of your
							associated data.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<FieldLabel htmlFor="delete-password">
							Confirm your password
						</FieldLabel>

						<Input
							id="delete-password"
							type="password"
							value={deletePassword}
							onChange={(event) =>
								setDeletePassword(event.target.value)
							}
							placeholder="Enter your password"
							autoFocus
							disabled={deleting}
						/>

						<p className="text-sm text-muted-foreground">
							Enter your password to confirm that you want to
							permanently delete your account.
						</p>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteOpen(false)}
							disabled={deleting}
						>
							Cancel
						</Button>

						<Button
							variant="destructive"
							onClick={handleDeleteAccount}
							disabled={!deletePassword || deleting}
						>
							{deleting ? (
								<>
									<Spinner />
									Deleting...
								</>
							) : (
								"Delete my account"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default ContentAccount
