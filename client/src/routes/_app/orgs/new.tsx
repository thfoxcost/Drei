import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Code2,
  Globe2,
  MoreHorizontal,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const organizationSchema = z.object({
  owner: z.string().min(1, "Please select an owner"),
  name: z.string().trim().min(1, "Organization name is required").regex(/^[^\s]/, "Name cannot start with a space"),
  description: z.string().optional(),
  visibility: z.enum(["public", "members"]),
  email: z.string().email("Enter a valid email address"),
  reason: z.string().min(1, "Please select a reason"),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean(),
});

const owners = [
  {
    value: "alex",
    label: "Alex Johnson",
    avatar: "https://api.dicebear.com/10.x/avataaars/svg?seed=alex",
  },
  {
    value: "sarah",
    label: "Sarah Chen",
    avatar: "https://api.dicebear.com/10.x/avataaars/svg?seed=sarah",
  },
  {
    value: "michael",
    label: "Michael Rodriguez",
    avatar: "https://api.dicebear.com/10.x/avataaars/svg?seed=michael",
  },
  {
    value: "thefoxcost",
    label: "theFoxCost",
    avatar: "https://api.dicebear.com/10.x/avataaars/svg?seed=thefoxcost",
  },
];

const reasons = [
  { value: "company", label: "Company", icon: Building2 },
  { value: "open-source", label: "Open source project", icon: Code2 },
  { value: "team", label: "Team", icon: Users },
  { value: "community", label: "Community", icon: Globe2 },
  { value: "personal", label: "Personal projects", icon: User },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

export const Route = createFileRoute("/_app/orgs/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");

  const form = useForm({
    defaultValues: {
      owner: "",
      name: "",
      description: "",
      visibility: "public" as "public" | "members",
      email: "",
      reason: "",
      tags: [] as string[],
      pinned: false,
    },
    validators: {
      onSubmit: organizationSchema,
    },
    onSubmit: async ({ value }) => {
      console.log({ ...value, avatar: avatarPreview });
    },
  });

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto my-10 w-full max-w-3xl px-4">
      <div className="relative mb-6">
        <label
          className="absolute -left-1 -top-1 z-10 flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-muted-foreground/60"
          aria-label="Upload organization avatar"
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Organization avatar"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                role="img"
                aria-label="Upload organization avatar"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="text-[10px] font-medium">Upload</span>
            </div>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleAvatarSelect}
          />
        </label>

        <h1 className="mb-3 flex items-center gap-2 pl-24 text-5xl font-bold">
          {orgName || "New Organization"}
          {selectedOwner === "thefoxcost" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      className="fill-foreground"
                      d="M24 12a4.454 4.454 0 0 0-2.564-3.91 4.437 4.437 0 0 0-.948-4.578 4.436 4.436 0 0 0-4.577-.948A4.44 4.44 0 0 0 12 0a4.423 4.423 0 0 0-3.9 2.564 4.434 4.434 0 0 0-2.43-.178 4.425 4.425 0 0 0-2.158 1.126 4.42 4.42 0 0 0-1.12 2.156 4.42 4.42 0 0 0 .183 2.421A4.456 4.456 0 0 0 0 12a4.465 4.465 0 0 0 2.576 3.91 4.433 4.433 0 0 0 .936 4.577 4.459 4.459 0 0 0 4.577.95A4.454 4.454 0 0 0 12 24a4.439 4.439 0 0 0 3.91-2.563 4.26 4.26 0 0 0 5.526-5.526A4.453 4.453 0 0 0 24 12Zm-13.709 4.917-4.38-4.378 1.652-1.663 2.646 2.646L15.83 7.4l1.72 1.591-7.258 7.926Z"
                    />
                  </svg>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Created by platform owner</p>
              </TooltipContent>
            </Tooltip>
          )}
        </h1>
        <p className="mt-1 pl-24 text-sm text-muted-foreground">
          Create an organization to manage repositories and collaborate with
          others.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <form.Field
              name="owner"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className="w-1/4">
                    <FieldLabel>Owner *</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => {
                        field.handleChange(v);
                        setSelectedOwner(v);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {owners.map((owner) => (
                          <SelectItem key={owner.value} value={owner.value}>
                            <span className="flex items-center gap-2">
                              <Avatar size="sm">
                                <AvatarImage
                                  src={owner.avatar}
                                  alt={owner.label}
                                />
                                <AvatarFallback>
                                  {owner.label[0]}
                                </AvatarFallback>
                              </Avatar>
                              {owner.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="name"
              children={(nameField) => {
                const nameInvalid =
                  nameField.state.meta.isTouched &&
                  !nameField.state.meta.isValid;
                return (
                  <Field data-invalid={nameInvalid} className="flex-1">
                    <FieldLabel htmlFor={nameField.name}>Name *</FieldLabel>
                    <Input
                      id={nameField.name}
                      name={nameField.name}
                      value={nameField.state.value}
                      onBlur={nameField.handleBlur}
                      onChange={(e) => {
                        nameField.handleChange(e.target.value);
                        setOrgName(e.target.value);
                      }}
                      placeholder="Drei Labs"
                      aria-invalid={nameInvalid}
                    />
                    {nameInvalid && (
                      <FieldError errors={nameField.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </div>

          <form.Field
            name="description"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="A short description of your organization"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="email"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="contact@example.com"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="visibility"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Visibility *</FieldLabel>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as "public" | "members")
                    }
                    className="gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="public" id="public" />
                      <div className="grid gap-1">
                        <Label htmlFor="public">Public</Label>
                        <p className="text-sm text-muted-foreground">
                          Anyone can discover and view this organization.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="members" id="members" />
                      <div className="grid gap-1">
                        <Label htmlFor="members">Members</Label>
                        <p className="text-sm text-muted-foreground">
                          Only organization members can access it.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <div className="flex flex-wrap items-start gap-4">
            <form.Field
              name="reason"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                const selectedReason = reasons.find(
                  (r) => r.value === field.state.value,
                );
                const SelectedIcon = selectedReason?.icon;
                return (
                  <Field
                    data-invalid={isInvalid}
                    className="w-full md:w-[calc(50%-0.5rem)]"
                  >
                    <FieldLabel>Purpose *</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.state.value && "text-muted-foreground",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {SelectedIcon && (
                              <SelectedIcon className="size-4" />
                            )}
                            {selectedReason?.label ?? "Select a purpose"}
                          </span>
                          <ChevronsUpDown className="size-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-(--radix-popover-trigger-width) p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput
                            placeholder="Search purpose..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No purpose found.</CommandEmpty>
                            <CommandGroup>
                              {reasons.map((reason) => {
                                const Icon = reason.icon;
                                return (
                                  <CommandItem
                                    key={reason.value}
                                    value={reason.label}
                                    onSelect={() => {
                                      field.handleChange(reason.value);
                                    }}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Icon className="size-4" />
                                      {reason.label}
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-auto size-4",
                                        reason.value === field.state.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="tags"
              children={(field) => (
                <Field className="w-full md:w-[calc(50%-0.5rem)]">
                  <FieldLabel>Tags</FieldLabel>
                  <TagInput
                    tags={field.state.value ?? []}
                    setTags={(tags) => field.handleChange(tags)}
                    placeholder="e.g. open-source, react, go"
                  />
                </Field>
              )}
            />
          </div>

          <form.Field
            name="pinned"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(v) => field.handleChange(v === true)}
                      aria-invalid={isInvalid}
                    />
                    <div className="grid gap-1">
                      <FieldLabel htmlFor={field.name}>Pinned</FieldLabel>
                      <p className="text-sm text-muted-foreground">
                        Keep this organization at the top of your organization
                        list.
                      </p>
                    </div>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Creating..." : "Create organization"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
