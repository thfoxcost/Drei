"use client";
import { useNavigate } from "@tanstack/react-router";
import { BookMarked, SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { ORGANIZATIONS } from "@/data/organizations";
import { useUserOrganizations } from "@/hooks/useOrganizations";

interface Repo {
  name: string;
  description: string;
  tags: string[];
  language: string;
  lastUpdated: string;
  forked: boolean;
  stars: number;
  forks: number;
  license: string;
}

export function Cmd() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const { data: orgs, isError: orgsError } = useUserOrganizations();
  const organizationList = orgsError ? ORGANIZATIONS : (orgs ?? []);

  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  const username = session?.user.name;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      loaded.current = false;
      setRepos([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || loaded.current || !username) return;

    let cancelled = false;

    async function getRepos() {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/users/${username}/repos`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch repos");
        }

        const data: Repo[] = await res.json();

        if (!cancelled) {
          setRepos(data);
          loaded.current = true;
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    getRepos();

    return () => {
      cancelled = true;
    };
  }, [open, username]);

  const isLoading = loading || !username;

  const handleSelectRepo = (repo: Repo) => {
    if (!username) return;

    setOpen(false);

    navigate({
      to: "/$username/$repo",
      params: {
        username,
        repo: repo.name,
      },
    });
  };

  const handleSelectOrg = (slug: string) => {
    setOpen(false);
    navigate({ to: "/orgs/$org", params: { org: slug } });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-52">
        <SearchIcon className="size-4" />
        Search...
        <Kbd className="ml-auto px-3">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="**:data-[selected=true]:bg-muted **:data-selected:bg-transparent">
          <CommandInput
            placeholder="Search..."
            className="placeholder:text-muted-foreground"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No results found"}
            </CommandEmpty>
            {isLoading && repos.length === 0 && (
              <CommandItem disabled className="gap-2.5">
                <Spinner className="size-4 shrink-0" />
                <span className="text-muted-foreground">Loading...</span>
              </CommandItem>
            )}
            <CommandGroup heading="Repositories">
              {repos.map((repo) => (
                <CommandItem
                  key={repo.name}
                  value={repo.name}
                  className="gap-2.5 flex items-center justify-between"
                  onSelect={() => handleSelectRepo(repo)}
                >
                  <div className="flex flex-row gap-1 items-center">
                    <BookMarked className="size-4 text-muted-foreground" />
                    <span className="truncate font-medium">{repo.name}</span>
                  </div>
                  <span data-slot="command-shortcut">
                    <Badge variant="outline">{repo.language}</Badge>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>


            <CommandGroup heading="Organizations">
              {organizationList.map((org) => (
                <CommandItem
                  key={org.slug}
                  value={org.name}
                  className="gap-1"
                  onSelect={() => handleSelectOrg(org.slug)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4.5 text-muted-foreground" viewBox="0 0 24 24"><path fill="currentColor" d="M6.25 12a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zM5.5 9.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75M6.25 5a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zM9 12.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75m.75-4.25a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zM9 5.75A.75.75 0 0 1 9.75 5h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 9 5.75M13.25 12a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm-.75-2.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75M13.25 5a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5z" /><path fill="currentColor" d="M2 20V3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v17q0 .26-.063.5H20a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.2-.4l-.5-.375a.75.75 0 0 1 .9-1.2l.5.375c.504.378.8.97.8 1.6v8a2 2 0 0 1-2 2h-3.562a1 1 0 0 1-.166-.018Q16.138 22 16 22h-3.75a.75.75 0 0 1-.75-.75V19h-3v2.25a.75.75 0 0 1-.75.75H4a2 2 0 0 1-2-2m2 .5h3v-2.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v2.25h3a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H4a.5.5 0 0 0-.5.5v17a.5.5 0 0 0 .5.5" /></svg>
                  <span className="truncate font-medium">{org.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog >
    </>
  );
}
