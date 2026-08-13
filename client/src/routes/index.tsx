import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import Header from "#/components/header";
import Main from "#/components/home/main";
import DotMatrixLoader from "#/components/ui/dot-matrix-loader";
import useUserRepos from "#/hooks/useUserRepos";
import { authMiddleware } from "@/lib/middleware";

export const Route = createFileRoute("/")({
	component: Home,
	server: {
		middleware: [authMiddleware],
	},
});

function Home() {
	const { repos, loaded } = useUserRepos();

	useEffect(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, []);

	return (
		<div className="flex flex-col h-dvh overflow-hidden">
			<Header />
			<Main repos={repos} />

			<AnimatePresence>
				{!loaded && (
					<motion.div
						key="home-loading"
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-background"
					>
						<DotMatrixLoader
							size={40}
							dotSize={5}
							className="text-foreground"
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
