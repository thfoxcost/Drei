import { useEffect, useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "#/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldLabel,
} from "#/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "#/components/ui/select"
import { Separator } from "#/components/ui/separator"
import { Spinner } from "#/components/ui/spinner"
import { Switch } from "#/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { getCurrentYear, useHeatmapYear } from "#/hooks/useHeatmapYear"

const API_BASE = "http://localhost:3200"

type Language = "en" | "ar" | "fr" | "de"

type AppearanceData = {
    theme: "light" | "dark" | "system"
    language: Language
    heatmapProfileColor: boolean
}

const LANGUAGE_LABELS: Record<Language, string> = {
    en: "🇬🇧 English",
    ar: "🇵🇸 العربية",
    fr: "🇫🇷 Français",
    de: "🇩🇪 Deutsch",
}

function ContentAppearance() {
    const { theme, setTheme } = useTheme()
    const queryClient = useQueryClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [language, setLanguage] = useState<Language>("en")

    const [heatmapProfileColor, setHeatmapProfileColor] = useState(false)

    const [heatmapYear, setHeatmapYear] = useHeatmapYear()

    const heatmapYearOptions = Array.from(
        new Set([
            heatmapYear,
            ...Array.from(
                { length: 5 },
                (_, i) => getCurrentYear() - i,
            ),
        ]),
    ).sort((a, b) => b - a)

    const [original, setOriginal] =
        useState<AppearanceData | null>(null)

    useEffect(() => {
        let cancelled = false

        async function fetchAppearance() {
            try {
                const res = await fetch(
                    `${API_BASE}/api/user/appearance`,
                    {
                        credentials: "include",
                    },
                )

                if (!res.ok) {
                    throw new Error("Failed to load appearance")
                }

                const data: AppearanceData = await res.json()

                if (!cancelled) {
                    setLanguage(data.language)
                    setHeatmapProfileColor(data.heatmapProfileColor === true)
                    setOriginal(data)
                }
            } catch {
                if (!cancelled) {
                    toast.error(
                        "Failed to load appearance settings",
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchAppearance()

        return () => {
            cancelled = true
        }
    }, [])

    const changed =
        !loading &&
        original !== null &&
        (theme !== original.theme ||
            language !== original.language ||
            heatmapProfileColor !== original.heatmapProfileColor)

    const canSave = changed && !saving

    const handleThemeToggle = (
        nextTheme: "light" | "dark" | "system",
    ) => {
        if (nextTheme === theme) return

        if (!document.startViewTransition) {
            setTheme(nextTheme)
            return
        }

        document.startViewTransition(() => {
            setTheme(nextTheme)
        })
    }

    const themeIcons = {
        light: <Sun className="size-4" />,
        dark: <Moon className="size-4" />,
        system: <Monitor className="size-4" />,
    }

    async function handleSave() {
        if (!canSave) return

        setSaving(true)

        try {
            const res = await fetch(
                `${API_BASE}/api/user/appearance`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        theme,
                        language,
                        heatmapProfileColor,
                    }),
                },
            )

            const result = await res.json()

            if (!res.ok) {
                throw new Error(
                    result.error ||
                    "Failed to save appearance",
                )
            }

            setOriginal({
                theme,
                language,
                heatmapProfileColor,
            })

            await queryClient.invalidateQueries({
                queryKey: ["appearance"],
            })

            toast.success(
                "Appearance settings saved",
            )
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Something went wrong",
            )
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto mb-10 w-full max-w-5xl space-y-4">
                <div>
                    <h1 className="text-2xl">
                        Appearance
                    </h1>

                    <Separator className="my-2" />
                </div>

                <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                    <Spinner />
                    <span>
                        Loading appearance...
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto mb-10 w-full max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl">
                    Appearance
                </h1>

                <Separator className="my-2" />
            </div>

            <div className="space-y-8">
                {/* Theme */}
                <Field>
                    <FieldLabel>
                        Theme
                    </FieldLabel>

                    <FieldDescription>
                        Choose the appearance of the
                        application.
                    </FieldDescription>

                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                "light",
                                "dark",
                                "system",
                            ] as const
                        ).map((option) => {
                            const selected =
                                theme === option

                            return (
                                <Button
                                    key={option}
                                    type="button"
                                    variant={
                                        selected
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() =>
                                        handleThemeToggle(
                                            option,
                                        )
                                    }
                                    className="gap-2"
                                >
                                    {
                                        themeIcons[
                                        option
                                        ]
                                    }

                                    <span className="capitalize">
                                        {option}
                                    </span>
                                </Button>
                            )
                        })}
                    </div>
                </Field>

                {/* Language */}
                <Field>
                    <FieldLabel>
                        Language
                    </FieldLabel>

                    <FieldDescription>
                        Choose the language used by
                        the application.
                    </FieldDescription>

                    <div className="max-w-sm">
                        <Select
                            value={language}
                            onValueChange={(value) =>
                                setLanguage(
                                    value as Language,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="en">
                                    🇬🇧 English
                                </SelectItem>

                                <SelectItem value="ar" disabled>
                                    🇵🇸 العربية
                                </SelectItem>

                                <SelectItem value="fr" disabled>
                                    🇫🇷 Français
                                </SelectItem>

                                <SelectItem value="de" disabled>
                                    🇩🇪 Deutsch
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Field>

                {/* Contribution heatmap year */}
                <Field>
                    <FieldLabel>
                        Contribution heatmap
                    </FieldLabel>

                    <FieldDescription>
                        Choose which calendar year your
                        contribution heatmap displays.
                        Applies instantly.
                    </FieldDescription>

                    <div className="max-w-sm">
                        <Select
                            value={String(heatmapYear)}
                            onValueChange={(value) =>
                                setHeatmapYear(
                                    Number(value),
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {heatmapYearOptions.map(
                                    (option) => (
                                        <SelectItem
                                            key={option}
                                            value={String(
                                                option,
                                            )}
                                        >
                                            {option}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </Field>

                {/* Heatmap profile color */}
                <Field>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <FieldLabel htmlFor="heatmap-profile-color">
                                Profile color heatmap
                            </FieldLabel>

                            <FieldDescription>
                                Tint your contribution heatmap
                                with the dominant color of your
                                profile picture.
                            </FieldDescription>
                        </div>

                        <Switch
                            id="heatmap-profile-color"
                            checked={heatmapProfileColor}
                            onCheckedChange={setHeatmapProfileColor}
                        />
                    </div>
                </Field>

                {/* Save */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline">
                        <a href="/">
                            Back
                        </a>
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!canSave}
                    >
                        {saving ? (
                            <>
                                <Spinner />
                                <span className="ml-2">
                                    Saving...
                                </span>
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ContentAppearance