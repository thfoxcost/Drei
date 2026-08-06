import osproc
import std/strutils

proc getDiff*() : string = 
    let (diff, exitCode) = execCmdEx("git diff --cached --unified=10 --no-color --no-renames --find-copies-harder") #a git command to get the staged code (advanced command to let ai get it more)
    
    if exitCode != 0:
        echo "Error: Failed to get diff"
        return ""
    
    if diff.strip().len == 0:
        echo "No staged changes found"
        return ""

    return diff
