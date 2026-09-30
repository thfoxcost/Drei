import { useTranslation } from "react-i18next"

import { dateFnsLocale } from "#/i18n/lib/format"
import { format, formatDistanceToNowStrict } from "date-fns"
import { BookMarked } from "lucide-react"
import ReactCountryFlag from "react-country-flag"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/reui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePeople, type Person } from "#/hooks/usePeople"
import { countries } from "#/lib/countries"
import { uploadsUrl } from "#/lib/backend-url"
import { cn } from "#/lib/utils.ts"

const MAX_VISIBLE_ORGS = 3

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function getCountryCode(name: string | null): string | null {
  if (!name) return null

  return (
    countries.find((c) => c.name.toLowerCase() === name.toLowerCase())?.code ?? null
  )
}

function PersonPreviewBody({ person }: { person: Person }) {
  const { t } = useTranslation()
  const code = getCountryCode(person.country)
  const visibleOrgs = person.organizations.slice(0, MAX_VISIBLE_ORGS)
  const extraOrgs = person.organizations.length - visibleOrgs.length

  return (
    <div className="w-64 space-y-2">
      <div className="flex items-center gap-2">
        <Avatar className="size-8">
          {person.avatar && (
            <AvatarImage src={person.avatar} alt={person.username} />
          )}
          <AvatarFallback>{getInitials(person.username)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{person.username}</p>
          <p className="truncate text-xs text-muted-foreground">
            {person.profession ?? "—"}
          </p>
        </div>

        <Badge
          variant={person.online ? "success-light" : "secondary"}
          title={
            person.lastActive
              ? t("people.peopleTable.lastActive", {
                  time: formatDistanceToNowStrict(
                    new Date(person.lastActive),
                    {
                      addSuffix: true,
                      locale: dateFnsLocale(),
                    },
                  ),
                })
              : t("people.peopleTable.neverActive")
          }
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              person.online ? "bg-success" : "bg-muted-foreground",
            )}
          />
          {person.online
						? t("people.peopleTable.status.online")
						: t("people.peopleTable.status.offline")}
        </Badge>
      </div>

      <p className="truncate text-xs text-muted-foreground">{person.email}</p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {person.country && code && (
          <span className="flex items-center gap-1" title={person.country}>
            <ReactCountryFlag
              countryCode={code}
              svg
              style={{ width: "1em", height: "1em" }}
            />
            {person.country}
          </span>
        )}

        <span title={t("people.preview.joinedTitle")}>
          {t("people.reposTable.joined", {
            date: format(new Date(person.joinedAt), "MMM, yyyy", {
              locale: dateFnsLocale(),
            }),
          })}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {visibleOrgs.length > 0 && (
          <div className="flex -space-x-1.5">
            {visibleOrgs.map((org) => (
              <Avatar
                key={org.id}
                className="size-5 rounded-md ring-2 ring-popover after:rounded-[inherit]"
              >
                {uploadsUrl(org.avatar) && (
                  <AvatarImage
                    src={uploadsUrl(org.avatar) as string}
                    alt={org.name}
                    className="rounded-md"
                  />
                )}
                <AvatarFallback className="rounded-md text-[9px]">
                  {getInitials(org.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}

        {extraOrgs > 0 && (
          <span className="text-xs text-muted-foreground">+{extraOrgs}</span>
        )}

        {person.topRepo && (
          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <BookMarked className="size-3.5 shrink-0" />
            <span className="truncate">
              {person.topRepo.owner}/{person.topRepo.name}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

export function PersonPreviewCard({ username }: { username: string }) {
  const { t } = useTranslation()
  const { data: people, isLoading } = usePeople()
  const person = people?.find((p) => p.username === username)

  if (isLoading) {
    return (
      <div className="w-64 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    )
  }

  if (!person) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("people.preview.noDetails", { username })}
      </p>
    )
  }

  return <PersonPreviewBody person={person} />
}
