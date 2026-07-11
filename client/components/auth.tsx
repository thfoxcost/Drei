import { cn } from "#/lib/utils.ts";
import { GithubIcon } from "#/components/github-icon.tsx";
import { GoogleIcon } from "#/components/google-icon.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group.tsx";
import { AuthDivider } from "#/components/auth-divider.tsx";
import { DecorIcon } from "#/components/decor-icon.tsx";
import { AtSignIcon } from "lucide-react";

export function AuthPage() {
	return (
		<div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 md:px-8">
			<div
				className={cn(
					"relative flex w-full max-w-sm flex-col justify-between p-6 md:p-8",
					"dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]"
				)}
			>
				<div className="absolute -inset-y-6 -left-px w-px bg-border" />
				<div className="absolute -inset-y-6 -right-px w-px bg-border" />
				<div className="absolute -inset-x-6 -top-px h-px bg-border" />
				<div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
				<DecorIcon position="top-left" />
				<DecorIcon position="bottom-right" />

				<div className="w-full max-w-sm animate-in space-y-8">
					<div className="flex flex-col space-y-1">
						<h1 className="font-bold text-2xl tracking-wide">Join Now!</h1>
						<p className="text-base text-muted-foreground">
							Login or create your efferd account.
						</p>
					</div>
					<div className="space-y-4">
						<form className="space-y-2">
							<InputGroup>
								<InputGroupInput
									placeholder="your.email@example.com"
									type="email"
								/>
								<InputGroupAddon align="inline-start">
									<AtSignIcon
									/>
								</InputGroupAddon>
							</InputGroup>

							<Button className="w-full" size="sm" type="button">
								Continue With Email
							</Button>
						</form>
						<AuthDivider>OR</AuthDivider>
						<div className="grid grid-cols-2 gap-2 space-y-2">
							<Button className="w-full" type="button" variant="outline">
								<GoogleIcon data-icon="inline-start" />
								Google
							</Button>
							<Button className="w-full" type="button" variant="outline">
								<GithubIcon data-icon="inline-start" />
								GitHub
							</Button>
						</div>
					</div>
					<p className="text-muted-foreground text-sm">
						By clicking continue, you agree to our{" "}
						<a
							className="underline underline-offset-4 hover:text-primary"
							href="#"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							className="underline underline-offset-4 hover:text-primary"
							href="#"
						>
							Privacy Policy
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	);
}
