
import ReactCountryFlag from "react-country-flag"
import { authClient } from "#/lib/auth-client"
import { UserAvatar } from "@/components/UserAvatar"
import {
    Testimonial,
    TestimonialAuthor,
    TestimonialAuthorName,
    TestimonialAuthorTagline,
    TestimonialAvatar,
    TestimonialAvatarImg,
    TestimonialAvatarRing,
    TestimonialQuote,
    TestimonialVerifiedBadge,
} from "@/components/testimonial"

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function Profile() {
    const { data: session } = authClient.useSession()

    return (
        <div className="flex flex-col items-center gap-2 sm:items-start px-4 sm:px-0">
            <UserAvatar
                src={session?.user.image}
                name={session?.user.name}
                uploadable
                className="w-30 h-30 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 ring-2 ring-muted ring-offset-2 ring-offset-background sm:mb-4"
            />

            <div className="flex flex-row items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">
                    {session?.user.name}
                </h1>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <ReactCountryFlag
                                countryCode="DZ"
                                svg
                                style={{
                                    width: "1.5em",
                                    height: "1.5em",
                                }}
                            />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Algeria</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <p>I think sleeping is so Overated</p>
            <a href="/settings" className="w-full my-1 hover:cursor-pointer">
                <Button variant="secondary" className="w-full">Edit Profile</Button>
            </a>

            <div
                className="block w-80 max-w-full rounded-xl inset-ring-1 inset-ring-foreground/10 transition-[background-color] ease-out hover:bg-accent/50"

            >
                <Testimonial>
                    <TestimonialQuote className="font-serif">
                        <p>
                            Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.                        </p>
                    </TestimonialQuote>

                    <TestimonialAuthor>
                        <TestimonialAvatar>
                            <TestimonialAvatarImg
                                src="https://caltech-prod.resources.caltech.edu/main/images/feynman01-NEWS-WEB.width-450_3YN6pEE.jpg"
                                alt="Richard Feynman"
                            />
                            <TestimonialAvatarRing />
                        </TestimonialAvatar>

                        <TestimonialAuthorName>
                            Richard Feynman
                            <TestimonialVerifiedBadge className="text-info">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path
                                        className="w-4 h-4 fill-foreground"
                                        d="M24 12a4.454 4.454 0 0 0-2.564-3.91 4.437 4.437 0 0 0-.948-4.578 4.436 4.436 0 0 0-4.577-.948A4.44 4.44 0 0 0 12 0a4.423 4.423 0 0 0-3.9 2.564 4.434 4.434 0 0 0-2.43-.178 4.425 4.425 0 0 0-2.158 1.126 4.42 4.42 0 0 0-1.12 2.156 4.42 4.42 0 0 0 .183 2.421A4.456 4.456 0 0 0 0 12a4.465 4.465 0 0 0 2.576 3.91 4.433 4.433 0 0 0 .936 4.577 4.459 4.459 0 0 0 4.577.95A4.454 4.454 0 0 0 12 24a4.439 4.439 0 0 0 3.91-2.563 4.26 4.26 0 0 0 5.526-5.526A4.453 4.453 0 0 0 24 12Zm-13.709 4.917-4.38-4.378 1.652-1.663 2.646 2.646L15.83 7.4l1.72 1.591-7.258 7.926Z"
                                    />
                                </svg>
                            </TestimonialVerifiedBadge>
                        </TestimonialAuthorName>
                        <TestimonialAuthorTagline>Physicist & Mathematician</TestimonialAuthorTagline>
                    </TestimonialAuthor>
                </Testimonial>
            </div>
        </div>
    )
}

export default Profile