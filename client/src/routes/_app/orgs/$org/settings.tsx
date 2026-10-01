import { useTranslation } from "react-i18next"
import { apiErrorMessage } from "#/i18n/lib/api-error"
import { i18n } from "#/i18n/i18n"
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
import { uploadsUrl } from "#/lib/backend-url";
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
    return i18n.t("errors.code.image_too_large_2mb") as string;
  }
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    return i18n.t("errors.code.unsupported_image_type") as string;
  }
  return null;
}

function RouteComponent() {
	const { t } = useTranslation()
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
        {t("orgs.notFound")}
      </div>
    );
  }

  const isOwner = !!session && session.user.id === data.createdBy.id;
  const canEdit = isOwner && !isSessionPending;
  const isSaving = updateOrganization.isPending;

  const avatarUrl = uploadsUrl(data.avatar) ?? undefined;

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
      toast.error(t("orgs.settings.nameRequired"));
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
              apiErrorMessage(body) ?? t("orgs.new.uploadFailed"),
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
          toast.success(t("orgs.settings.updatedToast"));
        } catch (err) {
          toast.error(t("orgs.settings.updatedButAvatarFailed"), {
            description:
              err instanceof Error
                ? err.message
                : t("common.errors.somethingWentWrong"),
          });
        }
      } else {
        toast.success(t("orgs.settings.updatedToast"));
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t("orgs.settings.updateFailed"));
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization.mutateAsync();
      toast.success(t("orgs.settings.deletedToast"));
      setDeleteOpen(false);
      navigate({ to: "/orgs" });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t("orgs.settings.deleteFailed"));
      }
    }
  };

  return (
    <div className="mx-40 my-5 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("orgs.settings.heading")}</h1>

        <p className="text-sm text-muted-foreground">
          {t("orgs.settings.subtitle", { name: data.name })}
        </p>

        {!canEdit && !isSessionPending && (
          <p className="text-sm text-muted-foreground">
            {t("orgs.settings.ownerOnly")}
          </p>
        )}
      </div>

      <Separator className="my-5" />

      <div className="flex flex-col gap-8">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{t("orgs.settings.name")}</Label>

          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("orgs.settings.namePlaceholder")}
            disabled={!canEdit}
          />

          <p className="text-xs text-muted-foreground">
            {t("orgs.settings.nameHelp")}
          </p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">{t("orgs.settings.description")}</Label>

          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("orgs.settings.descriptionPlaceholder")}
            rows={4}
            disabled={!canEdit}
          />

          <p className="text-xs text-muted-foreground">
            {t("orgs.settings.descriptionHelp")}
          </p>
        </div>

        {/* Purpose */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="purpose">{t("orgs.settings.purpose")}</Label>

          <Select
            value={purpose}
            onValueChange={setPurpose}
            disabled={!canEdit}
          >
            <SelectTrigger id="purpose" className="w-full">
              <SelectValue placeholder={t("orgs.settings.selectPurpose")} />
            </SelectTrigger>

            <SelectContent>
              {organizationPurposes.map((item) => {
                const Icon = item.icon;
                return (
                  <SelectItem key={item.value} value={item.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {t(item.labelKey)}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            {t("orgs.settings.purposeHelp")}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="tags">{t("orgs.settings.tags")}</Label>

          <div className={canEdit ? undefined : "pointer-events-none opacity-60"}>
            <TagInput
              id="tags"
              tags={tags}
              setTags={setTags}
              placeholder={t("orgs.settings.tagsPlaceholder")}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t("orgs.settings.tagsHelp")}
          </p>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t("orgs.settings.email")}</Label>

          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("orgs.settings.emailPlaceholder")}
            disabled={!canEdit}
          />

          <p className="text-xs text-muted-foreground">
            {t("orgs.settings.emailHelp")}
          </p>
        </div>

        {/* Picture */}
        <div className="flex flex-col gap-3">
          <Label>{t("orgs.settings.picture")}</Label>

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
                {t("orgs.settings.changePicture")}
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
                {t("orgs.settings.pictureHelp")}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">{t("orgs.settings.status")}</Label>

          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as "active" | "suspended")
            }
            disabled={!canEdit}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder={t("orgs.settings.selectStatus")} />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="active">{t("orgs.settings.active")}</SelectItem>
              <SelectItem value="suspended">{t("orgs.settings.suspended")}</SelectItem>
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            {t("orgs.settings.suspendedHelp")}
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
              {t("orgs.settings.delete")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner />
                  <span className="ml-2">{t("common.actions.saving")}</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {t("orgs.settings.saveChanges")}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        {/*
          The shared DialogContent is `display: grid` and capped at
          `sm:max-w-sm` (24rem), which squeezes this warning paragraph into a
          very tall column.

          Two things are needed to fix it:
          - `sm:max-w-lg` raises the ceiling (keep the definite `w-full`;
            adding `w-fit` would remove it and the text would stop wrapping,
            because the implicit grid track would size to max-content).
          - `grid-cols-1` pins that track to `minmax(0, 1fr)`. The default
            implicit track is `minmax(auto, auto)`, whose automatic minimum is
            min-content, so a long unbroken org name or slug would otherwise
            still push past the box.
        */}
        <DialogContent className="grid-cols-1 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("orgs.settings.deleteDialogTitle", {
                name: data?.name ?? org,
              })}
            </DialogTitle>
            <DialogDescription>
              {t("orgs.settings.deleteDialogDescription", {
                name: data?.name ?? org,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-org-slug">
              {t("orgs.settings.confirmSlug", {
                slug: data?.slug ?? org,
              })}
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
              {t("common.actions.cancel")}
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
                  <span className="ml-2">{t("orgs.settings.deleting")}</span>
                </>
              ) : (
                t("orgs.settings.deleteConfirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
