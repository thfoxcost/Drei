import { Badge } from "#/components/reui/badge"
import { Button } from "#/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar"
import { Diff, FileCode, GitBranch } from "lucide-react"
import { useNavigate, useLocation } from "@tanstack/react-router"
import { Separator } from "#/components/ui/separator"

function Commit() {
    const hash = "691f13d"
    const navigate = useNavigate()
    const location = useLocation()

    const [, owner, repo] = location.pathname.split("/")

    return (
        <div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-medium">
                    Commit{" "}
                    <Badge size="xl" variant="secondary">
                        {hash}
                    </Badge>
                </span>

                <Button
                    variant="outline"
                    onClick={() => navigate({ to: `/${owner}/${repo}` })}
                >
                    <FileCode />
                    Browse Files
                </Button>
            </div>

            <div className="mt-4 rounded-md border p-3">
                <div className="font-mono text-sm">
                    feat: enhance profile handling with biography fetching and error management
                </div>

                <div className="mt-2 text-xs font-mono text-muted-foreground">
                    It is a long established fact that a reader will be distracted by the
                    readable content of a page when looking at its layout. The point of
                    using Lorem Ipsum is that it has a more-or-less normal distribution of
                    letters, as opposed to using 'Content here, content here', making it
                    look like readable English.
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GitBranch
                            size={18}
                            className="text-muted-foreground"
                        />
                        <Badge size="lg" variant="secondary">
                            main
                        </Badge>
                    </div>

                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">1 parent</span>
                        <span className="font-mono underline">8e78f03</span>
                        <span className="text-muted-foreground">commit</span>
                        <span className="font-mono underline">691f13d</span>
                    </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Diff size={18} className="text-muted-foreground" />

                        <span className="text-sm">
                            <span className="font-semibold text-orange-500">
                                11 changed files
                            </span>{" "}
                            with{" "}
                            <span className="font-semibold text-green-600 dark:text-green-500">
                                1155 additions
                            </span>{" "}
                            and{" "}
                            <span className="font-semibold text-red-600 dark:text-red-500">
                                187 deletions
                            </span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Avatar size="sm">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>

                        <span className="text-sm">
                            thefoxcost{" "}
                            <span className="text-muted-foreground">
                                committed 2 days ago
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default Commit