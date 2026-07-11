import { createFileRoute } from '@tanstack/react-router'
import { NotFoundPage } from "@/components/not-found";

export const Route = createFileRoute('/$')({
  component: NotFound ,
})

export default function NotFound () {
	return <NotFoundPage />;
}