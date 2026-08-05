import { useSound } from "@/hooks/use-sound";
import { useForm } from "@tanstack/react-form";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupInput,
	InputGroupAddon,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { GithubIcon } from "@/components/github-icon";
import { Button } from "@/components/ui/button";
import { AuthDivider } from "@/components/auth-divider";
import { DecorIcon } from "@/components/decor-icon";
import { AtSign, Lock } from "lucide-react";
import * as z from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { error006Sound } from "@/sounds/error-006";
import { confirmation001Sound } from "@/sounds/confirmation-001";

const formSchema = z.object({
	email: z.email("invalid email"),
	password: z.string().min(8, "Password must be at least 8 characters."),
	callbackURL: z.string(),
});

export function SignInPage() {
	const [playSuccess] = useSound(confirmation001Sound);
	const [playError] = useSound(error006Sound);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			callbackURL: "/",
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
					callbackURL: value.callbackURL,

				},
				{
                    onSuccess: () => {
                        playSuccess();
                        toast.success(`Welcome Back !`);
                         window.location.href = value.callbackURL;
                    },
					onError: (ctx) => {
						playError();
						toast.error(ctx.error.message);
					},
				}
			);
		},
	});


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

				<div className="w-full max-w-sm animate-in">
					<div className="mb-5">
						<img src="/logo.svg" width="70" alt="logo" className="mx-auto" />
					</div>
					<div className="space-y-4">
						<form
							id="login-form"
							className="space-y-3"
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
						>
							<form.Field
								name="email"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Email</FieldLabel>
											<InputGroup>
												<InputGroupInput
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="example@email.com"
													autoComplete="off"
												/>
												<InputGroupAddon align="inline-start">
													<AtSign />
												</InputGroupAddon>
											</InputGroup>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>

							<form.Field
								name="password"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Password</FieldLabel>
											<InputGroup>
												<InputGroupInput
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Password"
													type="password"
													autoComplete="current-password"
												/>
												<InputGroupAddon align="inline-start">
													<Lock />
												</InputGroupAddon>
											</InputGroup>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>

							<Button className="w-full mt-1" size="default" type="submit">
								Continue With Email
							</Button>
						</form>
						<AuthDivider>OR</AuthDivider>
						<div className="grid grid-cols-1 gap-2 space-y-2">
							<Button className="w-full" type="button" variant="outline">
								<GithubIcon data-icon="inline-start" />
								GitHub
							</Button>
						</div>
						<FieldDescription className="text-center">
							Don&apos;t have an account? <a href="/signup">Sign up</a>
						</FieldDescription>
					</div>
				</div>
			</div>
		</div>
	);
}