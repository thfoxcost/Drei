import osproc

proc verifyinit*() =
    let (_, exitCode) = execCmdEx("git rev-parse --is-inside-work-tree")
    if exitCode == 0:
        echo "[OK] Git repository found"
    else:
        echo "[ERROR] Not a git repository"
        echo "[INFO] Run 'git init' to initialize"
        quit(1)

proc verifystagin*() =
    let (_, exitCode) = execCmdEx("git diff --cached --quiet --exit-code")

    if exitCode == 1:
        echo "[OK] Staged changes found"
    else:
        echo "[WARN] No staged changes detected"
        echo "[INFO] Stage files with: git add <file>"
        quit(0)
