
import ReactCountryFlag from "react-country-flag"
import { authClient } from "#/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
            <Avatar className="w-30 h-30 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 ring-2 ring-muted ring-offset-2 ring-offset-background sm:mb-4">
                <AvatarImage
                    src={session?.user.image ?? import.meta.env.VITE_DEFAULT_AVATAR_URL}
                    alt={session?.user.name ?? "User"}
                />
                <AvatarFallback>
                    {session?.user.name
                        ?.split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() ?? "??"}
                </AvatarFallback>
            </Avatar>

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
            <div className="flex flex-row gap-4 mt-3 sm:mt-2 flex-wrap justify-center sm:justify-start">
                <a href="https://github.com/thfoxcost" target="_blank">
                    <Button variant="outline" size="icon">
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-foreground"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                    </Button>
                </a>

                <a href="https://open.spotify.com/" target="_blank">
                    <Button variant="outline" size="icon">
                        <svg className="w-4 h-4 fill-foreground" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Spotify</title><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                    </Button>
                </a>

                <a href="https://www.youtube.com" target="_blank">
                    <Button variant="outline" size="icon">
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-foreground"><title>YouTube</title><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    </Button>
                </a>

                <a
                    href="https://app.notion.com/p/392a3cd1691380a59c36dc38b1adaecf?v=392a3cd1691380139ec1000c9cf32452"
                    target="_blank"

                >
                    <Button variant="outline" size="icon">
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-foreground"><title>Notion</title><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" /></svg>
                    </Button>
                </a>

                <a href="https://keep.google.com/u/0/" target="_blank">
                    <Button variant="outline" size="icon">
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-foreground"><title>Google Keep</title><path d="M4.908 0c-.904 0-1.635.733-1.635 1.637v20.726c0 .904.732 1.637 1.635 1.637H19.09c.904 0 1.637-.733 1.637-1.637V6.5h-6.5V0H4.908zm9.819 0v6h6l-6-6zM11.97 8.229c.224 0 .571.031.765.072.2.04.576.185.842.312.828.414 1.467 1.164 1.774 2.088.168.511.188 1.34.05 1.865a3.752 3.752 0 0 1-1.277 1.952l-.25.193h-1.87c-2.134 0-1.931.042-2.478-.494a3.349 3.349 0 0 1-.984-1.844c-.148-.766-.053-1.437.32-2.203.19-.399.303-.556.65-.899.68-.679 1.513-1.037 2.458-1.042zm-1.866 7.863h3.781v1.328h-3.779v-1.328z" /></svg>
                    </Button>
                </a>
                <a href="https://chess.com/" target="_blank">
                    <Button variant="outline" size="icon" >
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-foreground"><title>Chess.com</title><path d="M12 0a3.85 3.85 0 0 0-3.875 3.846A3.84 3.84 0 0 0 9.73 6.969l-2.79 1.85c0 .622.144 1.114.434 1.649H9.83c-.014.245-.014.549-.014.925 0 .025.003.048.006.071-.064 1.353-.507 3.472-3.62 5.842-.816.625-1.423 1.495-1.806 2.533a.33.33 0 0 0-.045.084 8.124 8.124 0 0 0-.39 2.516c0 .1.216 1.561 8.038 1.561s8.038-1.46 8.038-1.561c0-2.227-.824-4.048-2.24-5.133-4.034-3.08-3.586-5.74-3.644-6.838h2.458c.29-.535.434-1.027.434-1.649l-2.79-1.836a3.86 3.86 0 0 0 1.604-3.123A3.873 3.873 0 0 0 13.445.275c-.004-.002-.01.004-.015.004A3.76 3.76 0 0 0 12 0Z" /></svg>
                    </Button>
                </a>
                <a href="https://leetcode.com/" target="_blank" className="w-4 h-4 fill-foreground">
                    <Button variant="outline" size="icon">
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>LeetCode</title><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" /></svg>                    </Button>
                </a>
            </div>
        </div>
    )
}

export default Profile