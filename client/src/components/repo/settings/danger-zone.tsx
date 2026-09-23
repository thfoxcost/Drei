import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Spinner } from "#/components/ui/spinner"
import { useRepoData } from "#/hooks/useRepoData"

const DangerZone = () => {
  const { username, repo } = useParams({ strict: false })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data } = useRepoData(username, repo)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [busy, setBusy] = useState<"visibility" | "archive" | "delete" | null>(null)

  const visibility = data?.visibility ?? false
  const archived = data?.archived ?? false

  async function toggleVisibility() {
    const next = !visibility
    setBusy("visibility")

    try {
      const res = await fetch(
        `http://localhost:3200/api/repos/${username}/${repo}/visibility`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility: next }),
        },
      )

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || result.message || "Failed to update visibility")
      }

      toast.success(`Repository is now ${next ? "public" : "private"}`)
      await queryClient.invalidateQueries({ queryKey: ["repo", username, repo] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(null)
    }
  }

  async function toggleArchive() {
    const next = !archived
    setBusy("archive")

    try {
      const res = await fetch(
        `http://localhost:3200/api/repos/${username}/${repo}/archive`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: next }),
        },
      )

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || result.message || "Failed to update repository")
      }

      toast.success(next ? "Repository archived" : "Repository unarchived")
      await queryClient.invalidateQueries({ queryKey: ["repo", username, repo] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete() {
    setBusy("delete")

    try {
      const res = await fetch(`http://localhost:3200/api/repos/${username}/${repo}`, {
        method: "DELETE",
        credentials: "include",
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || result.message || "Failed to delete repository")
      }

      toast.success("Repository deleted")
      queryClient.removeQueries({ queryKey: ["repo", username, repo] })
      navigate({ to: "/" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setBusy(null)
    }
  }

  return (
    <div className="mt-10 mb-10">
      <h1 className="text-2xl text-destructive mb-2">Danger Zone</h1>
      <div className="border border-destructive max-w-3xl rounded-sm">
        <div className="p-3 text-sm flex flex-row items-center justify-between border-b gap-4">
          <div className="flex flex-col">
            <span className="font-bold">Change repository visibility</span>
            <span>
              {" "}
              This repository is currently {archived && "archived and "}
              {visibility ? "public" : "private"}.{" "}
            </span>
          </div>
          <Button
            variant="destructive"
            onClick={toggleVisibility}
            disabled={busy !== null}
          >
            {busy === "visibility" ? (
              <Spinner />
            ) : visibility ? (
              "Make private"
            ) : (
              "Make public"
            )}
          </Button>
        </div>

        <div className="p-3 text-sm flex flex-row items-center justify-between border-b gap-4">
          <div className="flex flex-col">
            <span className="font-bold">Archive this repository</span>
            <span>Mark this repository as archived and read-only.</span>
          </div>
          <Button
            variant="destructive"
            onClick={toggleArchive}
            disabled={busy !== null}
          >
            {busy === "archive" ? (
              <Spinner />
            ) : archived ? (
              "Unarchive this repository"
            ) : (
              "Archive this repository"
            )}
          </Button>
        </div>

        <div className="p-3 text-sm flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-bold">Delete this repository</span>
            <span>
              {" "}
              Once you delete a repository, there is no going back. Please be
              certain.{" "}
            </span>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmName("")
              setDeleteOpen(true)
            }}
            disabled={busy !== null}
          >
            Delete this repository
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {data?.name ?? repo}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-medium text-foreground">{data?.name ?? repo}</span>{" "}
              repository and all of its contents. Please type the repository name
              to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-repo-name">
              To confirm, type{" "}
              <span className="font-medium">{data?.name ?? repo}</span> in the
              box below
            </Label>
            <Input
              id="confirm-repo-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={data?.name ?? repo}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmName !== (data?.name ?? repo) || busy !== null}
              onClick={handleDelete}
            >
              {busy === "delete" ? <Spinner /> : "I understand, delete this repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DangerZone
