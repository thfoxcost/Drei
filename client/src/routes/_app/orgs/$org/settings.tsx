import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { organizationPurposes } from "#/components/organization/purpose";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Spinner } from "#/components/ui/spinner";
import { TagInput } from "#/components/ui/tag-input";
import { Textarea } from "#/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  useOrganization,
  useDeleteOrganization,
  useUpdateOrganization,
} from "#/hooks/useOrganizations";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_app/orgs/$org/settings")({
  component: RouteComponent,
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

function validateAvatarFile(file: File): string | null {
  if (file.size > MAX_AVATAR_BYTES) {
    return "Image is too large. Maximum size is 2 MB";
  }
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    return "Unsupported file type. Please upload a PNG, JPG, WebP, or GIF image";
  }
  return null;
}

function RouteComponent() {
  const { org } = Route.useParams();
  const { data, isLoading, isError } = useOrganization(org);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const updateOrganization = useUpdateOrganization(org);
  const deleteOrganization = useDeleteOrganization(org);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"active" | "suspended">("active");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (data && !initialized) {
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setPurpose(data.purpose ?? "");
      setTags(data.tags ?? []);
      setEmail(data.email ?? "");
      setStatus(data.status);
      setInitialized(true);
    }
  }, [data, initialized]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground">
        Organization not found
      </div>
    );
  }

  const isOwner = !!session && session.user.id === data.createdBy.id;
  const canEdit = isOwner && !isSessionPending;
  const isSaving = updateOrganization.isPending;

  const avatarUrl = data.avatar
    ? `${import.meta.env.VITE_BACKEND_URL}/uploads/${data.avatar}`
    : undefined;

  const currentAvatar = avatarPreview ?? avatarUrl;

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;

    const avatarError = validateAvatarFile(file);
    if (avatarError) {
      toast.error(avatarError);
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (isSavingRef.current || updateOrganization.isPending) return;

    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    isSavingRef.current = true;

    try {
      await updateOrganization.mutateAsync({
        name: name.trim(),
        description,
        purpose,
        email: email.trim(),
        status,
        tags,
      });

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        try {
          const avatarRes = await fetch(
            `http://localhost:3200/api/orgs/${encodeURIComponent(org)}/avatar`,
            {
              method: "POST",
              credentials: "include",
              body: formData,
            },
          );

          if (!avatarRes.ok) {
            const body = await avatarRes.json().catch(() => null);
            throw new Error(
              body?.error ?? "Failed to upload organization avatar",
            );
          }

          setAvatarFile(null);
          if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
          }
          setAvatarPreview(null);
          await queryClient.invalidateQueries({
            queryKey: ["organization", org],
          });
          toast.success("Organization updated");
        } catch (err) {
          toast.error("Organization updated, but avatar upload failed.", {
            description:
              err instanceof Error ? err.message : "Something went wrong",
          });
        }
      } else {
        toast.success("Organization updated");
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update organization");
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization.mutateAsync();
      toast.success("Organization deleted");
      setDeleteOpen(false);
      navigate({ to: "/orgs" });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete organization");
      }
    }
  };

  return (
    <div className="mx-40 my-5 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Organization settings</h1>

        <p className="text-sm text-muted-foreground">
          Manage the details and settings for {data.name}.
        </p>

        {!canEdit && !isSessionPending && (
          <p className="text-sm text-muted-foreground">
            Only the organization owner can edit these settings.
          </p>
        )}
      </div>

      <Separator className="my-5" />

      <div className="flex flex-col gap-8">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>

          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Organization name"
            disabled={!canEdit}
          />

          <p className="text-xs text-muted-foreground">
            The name of your organization.
          </p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>

          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe your organization..."
            rows={4}
            disabled={!canEdit}
          />

          <p className="text-xs text-muted-foreground">
            A short description about what this organization is for.
          </p>
        </div>

        {/* Purpose */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="purpose">Purpose</Label>

          <Select
            value={purpose}
            onValueChange={setPurpose}
            disabled={!canEdit}
          >
            <SelectTrigger id="purpose" className="w-full">
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>

            <SelectContent>
              {organizationPurposes.map((item) => {
                const Icon = item.icon;
                return (
                  <SelectItem key={item.value} value={item.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {item.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            What this organization is primarily used for.
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="tags">Tags</Label>

          <div className={canEdit ? undefined : "pointer-events-none opacity-60"}>
            <TagInput
              id="tags"
              tags={tags}
              setTags={setTags}
              placeholder="e.g. open-source, react, go"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Press Enter or comma to add a tag. Click a tag to remove it.
          </p>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>

          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="organization@example.com"
            disabled={!canEdit}
          />

          <p className="text-xs text-muted-foreground">
            The public contact email for this organization.
          </p>
        </div>

        {/* Picture */}
        <div className="flex flex-col gap-3">
          <Label>Picture</Label>

          <div className="flex items-center gap-4">
            <Avatar className="size-20 rounded-xl">
              {currentAvatar && (
                <AvatarImage
                  src={currentAvatar}
                  alt={data.name}
                  className="rounded-xl object-cover"
                />
              )}

              <AvatarFallback className="rounded-xl text-xl">
                {data.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={!canEdit}
                onClick={() =>
                  document.getElementById("organization-avatar")?.click()
                }
              >
                <ImagePlus className="size-4" />
                Change picture
              </Button>

              <input
                id="organization-avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  handleAvatarChange(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />

              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP, or GIF. Maximum 2 MB.
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>

          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as "active" | "suspended")
            }
            disabled={!canEdit}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            Suspended organizations are unavailable to members.
          </p>
        </div>

        <Separator />

        {canEdit && (
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmSlug("");
                setDeleteOpen(true);
              }}
              disabled={isSaving || deleteOrganization.isPending}
            >
              <Trash2 className="size-4" />
              Delete organization
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner />
                  <span className="ml-2">Saving…</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {data?.name ?? org}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-medium text-foreground">
                {data?.name ?? org}
              </span>{" "}
              organization, its repositories, and all of its contents. Please
              type the organization slug to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-org-slug">
              To confirm, type{" "}
              <span className="font-medium">{data?.slug ?? org}</span> in the
              box below
            </Label>
            <Input
              id="confirm-org-slug"
              value={confirmSlug}
              onChange={(event) => setConfirmSlug(event.target.value)}
              placeholder={data?.slug ?? org}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                confirmSlug !== (data?.slug ?? org) ||
                deleteOrganization.isPending
              }
              onClick={handleDelete}
            >
              {deleteOrganization.isPending ? (
                <>
                  <Spinner />
                  <span className="ml-2">Deleting…</span>
                </>
              ) : (
                "I understand, delete this organization"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
