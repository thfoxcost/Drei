import { useState } from "react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import type { EmojiClickData } from "emoji-picker-react"
import ReactCountryFlag from "react-country-flag"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "#/components/ui/combobox"
import {
    Field,
    FieldDescription,
    FieldLabel,
} from "#/components/ui/field"
import { Input } from "#/components/ui/input"
import { Separator } from "#/components/ui/separator"
import { Textarea } from "#/components/ui/textarea"
import { Button } from "#/components/ui/button"
import { Switch } from "#/components/ui/switch"

import { countries } from "@/lib/countries"

function ContentProfile() {
    const [bio, setBio] = useState("")
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    // Quote card
    const [quoteTitle, setQuoteTitle] = useState("")
    const [quoteDescription, setQuoteDescription] = useState("")
    const [quotePersonTitle, setQuotePersonTitle] = useState("")
    const [quoteImage, setQuoteImage] = useState("")
    const [quoteVerified, setQuoteVerified] = useState(false)

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setBio((prev) => prev + emojiData.emoji)
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-4 mb-10">
            <div>
                <h1 className="text-2xl">General</h1>
                <Separator className="my-2" />
            </div>

            <Field className="w-full">
                <FieldLabel htmlFor="input-field-username">
                    Username
                </FieldLabel>

                <Input
                    id="input-field-username"
                    type="text"
                    placeholder="Enter your username"
                />

                <FieldDescription>
                    Your name may appear around the app.
                </FieldDescription>
            </Field>

            <Field className="w-full">
                <FieldLabel htmlFor="fieldgroup-email">
                    Email
                </FieldLabel>

                <Input
                    id="fieldgroup-email"
                    type="email"
                    placeholder="name@example.com"
                />

                <FieldDescription>
                    We&apos;ll send updates to this address.
                </FieldDescription>
            </Field>

            <Field className="w-full">
                <FieldLabel htmlFor="bio">
                    Biography
                </FieldLabel>

                <div className="relative">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() =>
                                setShowEmojiPicker((prev) => !prev)
                            }
                            aria-label="Select emoji"
                        >
                            😊
                        </Button>

                        <Input
                            id="bio"
                            type="text"
                            value={bio}
                            onChange={(event) =>
                                setBio(event.target.value)
                            }
                            placeholder="Tell us a little about yourself..."
                        />
                    </div>

                    {showEmojiPicker && (
                        <div className="absolute left-0 top-full z-50 mt-2">
                            <EmojiPicker
                                theme={Theme.DARK}
                                onEmojiClick={handleEmojiClick}
                                width={350}
                                height={450}
                            />
                        </div>
                    )}
                </div>

                <FieldDescription>
                    Tell people a little about yourself.
                </FieldDescription>
            </Field>

            <Field className="w-full">
                <FieldLabel htmlFor="textarea-description">
                    Description
                </FieldLabel>

                <Textarea
                    id="textarea-description"
                    placeholder="Tell us more about yourself."
                />
            </Field>

            <Field className="w-full">
                <FieldLabel>Country</FieldLabel>

                <Combobox items={countries}>
                    <ComboboxInput placeholder="Select your country" />

                    <ComboboxContent>
                        <ComboboxEmpty>
                            No country found.
                        </ComboboxEmpty>

                        <ComboboxList>
                            {(country) => (
                                <ComboboxItem
                                    key={country.code}
                                    value={country.name}
                                >
                                    <div className="flex items-center gap-2">
                                        <ReactCountryFlag
                                            countryCode={country.code}
                                            svg
                                            style={{
                                                width: "1.5em",
                                                height: "1.5em",
                                            }}
                                        />

                                        <span>{country.name}</span>
                                    </div>
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </Field>

            <div className="pt-4">
                <h1 className="text-xl">Quote</h1>
                <Separator className="my-2" />
            </div>

            <Field className="w-full">
                <FieldLabel htmlFor="quote-title">
                    Person Name
                </FieldLabel>

                <Input
                    id="quote-title"
                    value={quoteTitle}
                    onChange={(event) =>
                        setQuoteTitle(event.target.value)
                    }
                    placeholder="Richard Feynman"
                />

                <FieldDescription>
                    The person who said the quote.
                </FieldDescription>
            </Field>

            <Field className="w-full">
                <FieldLabel htmlFor="quote-description">
                    Quote
                </FieldLabel>

                <Textarea
                    id="quote-description"
                    value={quoteDescription}
                    onChange={(event) =>
                        setQuoteDescription(event.target.value)
                    }
                    placeholder="Study hard what interests you the most in the most undisciplined, irreverent and original manner possible."
                />

                <FieldDescription>
                    The quote that you want to display on your profile.
                </FieldDescription>
            </Field>

            <Field className="w-full">
                <FieldLabel htmlFor="quote-person-title">
                    Person Title
                </FieldLabel>

                <Input
                    id="quote-person-title"
                    type="text"
                    value={quotePersonTitle}
                    onChange={(event) =>
                        setQuotePersonTitle(event.target.value)
                    }
                    placeholder="Physicist & Mathematician"
                />

                <FieldDescription>
                    What the person does or is known for.
                </FieldDescription>
            </Field>

            <Field className="w-full">
                <FieldLabel htmlFor="quote-image">
                    Person Image
                </FieldLabel>

                <Input
                    id="quote-image"
                    type="url"
                    value={quoteImage}
                    onChange={(event) =>
                        setQuoteImage(event.target.value)
                    }
                    placeholder="https://example.com/person.jpg"
                />

                <FieldDescription>
                    Enter a direct link to the person&apos;s image.
                </FieldDescription>
            </Field>

            <Field className="w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <FieldLabel htmlFor="quote-verified">
                            Verified
                        </FieldLabel>

                        <FieldDescription>
                            Show a verified badge next to the person&apos;s
                            name.
                        </FieldDescription>
                    </div>

                    <Switch
                        id="quote-verified"
                        checked={quoteVerified}
                        onCheckedChange={setQuoteVerified}
                    />
                </div>
            </Field>
        </div>
    )
}

export default ContentProfile