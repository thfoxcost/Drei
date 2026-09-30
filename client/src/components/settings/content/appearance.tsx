import { useEffect, useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
import { useTheme } from "#/components/theme-provider"
import { getCurrentYear, useHeatmapYear } from "#/hooks/useHeatmapYear"
import {
    useAppearanceSettings,
    useUpdateAppearance,
} from "#/hooks/useAppearanceSettings"
import {
    LOCALE_LABELS,
    SUPPORTED_LOCALES,
    UPCOMING_LOCALES,
    type Locale,
} from "#/i18n/config"
import { useLocale } from "#/i18n/locale-provider"

function ContentAppearance() {
    const { t } = useTranslation()
    const { theme, setTheme } = useTheme()
    const { locale, setLocale } = useLocale()
    const { data, isLoading } = useAppearanceSettings()
    const updateAppearance = useUpdateAppearance()

    const [saving, setSaving] = useState(false)

    const [heatmapProfileColor, setHeatmapProfileColor] = useState(false)
    const [originalHeatmapProfileColor, setOriginalHeatmapProfileColor] =
        useState(false)
    const [originalTheme, setOriginalTheme] = useState(theme)

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

    // Seed the local form from the persisted settings once they arrive. The
    // active language is owned by the LocaleProvider, not by this component.
    useEffect(() => {
        if (!data) return

        setHeatmapProfileColor(data.heatmapProfileColor === true)
        setOriginalHeatmapProfileColor(data.heatmapProfileColor === true)
        setOriginalTheme(data.theme)
    }, [data])

    const changed =
        !isLoading &&
        (theme !== originalTheme ||
            heatmapProfileColor !== originalHeatmapProfileColor)

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

    const themeLabels = {
        light: t("settings.appearance.themeLight"),
        dark: t("settings.appearance.themeDark"),
        system: t("settings.appearance.themeSystem"),
    } as const

    /**
     * The language applies and persists immediately rather than waiting for the
     * Save button, which only governs the remaining appearance fields. The
     * optimistic local update comes first so the UI never lags the selection.
     */
    async function handleLanguageChange(next: string) {
        const typed = next as Locale
        if (typed === locale) return

        setLocale(typed)

        try {
            await updateAppearance.mutateAsync({ language: typed })
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : t("settings.appearance.saveFailed"),
            )
        }
    }

    async function handleSave() {
        if (!canSave) return

        setSaving(true)

        try {
            await updateAppearance.mutateAsync({
                theme,
                heatmapProfileColor,
            })

            setOriginalHeatmapProfileColor(heatmapProfileColor)
            setOriginalTheme(theme)

            toast.success(t("settings.appearance.saved"))
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : t("settings.appearance.saveFailed"),
            )
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="mx-auto mb-10 w-full max-w-5xl space-y-4">
                <div>
                    <h1 className="text-2xl">
                        {t("settings.appearance.title")}
                    </h1>

                    <Separator className="my-2" />
                </div>

                <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                    <Spinner />
                    <span>
                        {t("settings.appearance.loading")}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto mb-10 w-full max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl">
                    {t("settings.appearance.title")}
                </h1>

                <Separator className="my-2" />
            </div>

            <div className="space-y-8">
                {/* Theme */}
                <Field>
                    <FieldLabel>
                        {t("settings.appearance.themeLabel")}
                    </FieldLabel>

                    <FieldDescription>
                        {t("settings.appearance.themeDescription")}
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
                                        {themeLabels[option]}
                                    </span>
                                </Button>
                            )
                        })}
                    </div>
                </Field>

                {/* Language */}
                <Field>
                    <FieldLabel>
                        {t("settings.appearance.languageLabel")}
                    </FieldLabel>

                    <FieldDescription>
                        {t("settings.appearance.languageDescription")}
                    </FieldDescription>

                    <div className="max-w-sm">
                        <Select
                            value={locale}
                            onValueChange={
                                handleLanguageChange
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {SUPPORTED_LOCALES.map(
                                    (code) => (
                                        <SelectItem
                                            key={code}
                                            value={code}
                                        >
                                            {
                                                LOCALE_LABELS[code]
                                            }
                                        </SelectItem>
                                    ),
                                )}

                                {UPCOMING_LOCALES.map(
                                    ({ code, label }) => (
                                        <SelectItem
                                            key={code}
                                            value={code}
                                            disabled
                                        >
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </Field>

                {/* Contribution heatmap year */}
                <Field>
                    <FieldLabel>
                        {t("settings.appearance.heatmapLabel")}
                    </FieldLabel>

                    <FieldDescription>
                        {t("settings.appearance.heatmapDescription")}
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
                                {t("settings.appearance.heatmapColorLabel")}
                            </FieldLabel>

                            <FieldDescription>
                                {t("settings.appearance.heatmapColorDescription")}
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
                            {t("common.actions.back")}
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
                                    {t("common.actions.saving")}
                                </span>
                            </>
                        ) : (
                            t("common.actions.save")
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ContentAppearance
