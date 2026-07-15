import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Prevlang,
    Stars,
    Forks,
    License,
    LastUpdate,
} from "@/components/preview-details"

const repo = {
    name: "React",
    owner: "Private",
    description: "A JavaScript library for building user interfaces",
    tags: ["React", "JavaScript", "UI", "Components", "DOM"],
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 239812,
    forks: 50231,
    license: "MIT License",
    updated: "2 days ago",
}

function Repos() {
    return (
        <div>
            {/* Search And filtering Section */}

            {/* LOOP */}
            <div className="flex items-start justify-between gap-6 rounded-lg border border-border bg-card p-5 transition-colors hover:border-muted-foreground/30">
                {/* left section */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="link"
                            className="h-auto p-0 text-xl font-semibold"
                        >
                            {repo.name}
                        </Button>
                        <Badge variant="outline">{repo.owner}</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {repo.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {repo.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
                        <Prevlang
                            language={repo.language}
                            color={repo.languageColor}
                        />
                        <Stars count={repo.stars} />
                        <Forks count={repo.forks} />
                        <License license={repo.license} />
                        <LastUpdate updated={repo.updated} />
                    </div>
                </div>

                {/* right section */}
                <div className="shrink-0" />
            </div>
        </div>
    )
}

export default Repos