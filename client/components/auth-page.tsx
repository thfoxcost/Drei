import { GoogleIcon } from "#/components/google-icon.tsx";
import { Logo } from "#/components/logo.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group.tsx";
import { AuthDivider } from "#/components/auth-divider.tsx";
import { FullWidthDivider } from "#/components/full-width-divider.tsx";
import { AtSignIcon } from "lucide-react";

export function AuthPage() {
	return (
		<div className="relative w-full overflow-hidden px-4 md:h-screen">
			<div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x *:px-6">
				<div className="flex flex-col space-y-6">
					<a aria-label="Home" className="" href="#">
						<Logo className="h-4.5" />
					</a>
					<div className="space-y-1">
						<h1 className="font-semibold text-xl tracking-wide">
							Hey, welcome!
						</h1>
						<p className="text-base text-muted-foreground">
							Log in or sign up. It only takes a moment.
						</p>
					</div>
				</div>

				<div className="relative my-6 flex size-full flex-col gap-4 py-8">
					<FullWidthDivider position="top" />

					<Button className="w-full" type="button" variant="outline">
						<GoogleIcon data-icon="inline-start" />
						Continue with Google
					</Button>
					<AuthDivider>OR CONTINUE WITH EMAIL</AuthDivider>
					<form className="space-y-2">
						<InputGroup>
							<InputGroupInput
								aria-label="Email address"
								placeholder="your.email@example.com"
								type="email"
							/>
							<InputGroupAddon align="inline-start">
								<AtSignIcon
								/>
							</InputGroupAddon>
						</InputGroup>

						<Button className="w-full" size="sm" type="submit">
							Continue With Email
						</Button>
					</form>
					<FullWidthDivider position="bottom" />
				</div>

				<p className="text-center text-muted-foreground text-sm">
					This site is protected by reCAPTCHA and the Google{" "}
					<a
						className="underline underline-offset-4 hover:text-primary"
						href="#"
					>
						Privacy Policy
					</a>{" "}
					and{" "}
					<a
						className="underline underline-offset-4 hover:text-primary"
						href="#"
					>
						Terms of Service
					</a>{" "}
					apply.
				</p>
			</div>
		</div>
	);
}
