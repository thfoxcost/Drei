import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { authMiddleware } from "@/lib/middleware";
import Main from "#/components/home/main";
import Header from "#/components/header";

export const Route = createFileRoute("/")({
  component: Home,
  server: {
    middleware: [authMiddleware],
  },
});

function Home() {
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
      <Main />
    </div>
  );
}