import { useNavigate } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import type { OrganizationListItem } from "#/types/organization"
import {
	DropdownMenuSeparator,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface OrganizationMenuProps {
	organizations?: OrganizationListItem[]
}

export function OrganizationMenu({ organizations = [] }: OrganizationMenuProps) {
	const navigate = useNavigate()

	return (
		<>
			{organizations.map((organization) => (
				<OrganizationMenuItem key={organization.slug} organization={organization} />
			))}
			<DropdownMenuSeparator />
			<DropdownMenuItem onClick={() => navigate({ to: "/orgs/new" })}>
				<Plus className="mr-2 h-4 w-4" />
				Add new organization
			</DropdownMenuItem>
		</>
	)
}

function OrganizationMenuItem({ organization }: { organization: OrganizationListItem }) {
	const navigate = useNavigate()

	return (
		<DropdownMenuItem onClick={() => navigate({ to: "/orgs/$org", params: { org: organization.slug } })}>
			<img
				src={organization.avatar ?? undefined}
				alt={`${organization.name} avatar`}
				className="mr-2 h-5 w-5 shrink-0 rounded-md object-cover"
			/>
			<span className="truncate">{organization.name}</span>
		</DropdownMenuItem>
	)
}
