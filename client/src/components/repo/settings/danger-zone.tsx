import { Button } from "#/components/ui/button"

const DangerZone = () => {
    return (
        <div className="mt-10 mb-10">
            <h1 className="text-2xl text-destructive mb-2">Danger Zone</h1>
            <div className="border border-destructive max-w-3xl rounded-sm">
                <div className="p-3 text-sm flex flex-row items-center justify-between border-b">
                    <div className="flex flex-col">
                        <span className="font-bold">Change repository visibility</span>
                        <span> This repository is currently private. </span>
                    </div>
                    <Button variant="destructive">Change visibilty</Button>
                </div>
                <div className="p-3 text-sm flex flex-row items-center justify-between border-b">
                    <div className="flex flex-col">
                        <span className="font-bold">Archive this repository</span>
                        <span>Mark this repository as archived and read-only.</span>
                    </div>
                    <Button variant="destructive">Archive this repository</Button>
                </div>
                <div className="p-3 text-sm flex flex-row items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-bold">Delete this repository</span>
                        <span> Once you delete a repository, there is no going back. Please be certain.  </span>
                    </div>
                    <Button variant="destructive">Delete this repository</Button>
                </div>
            </div>
        </div>
    )
}

export default DangerZone