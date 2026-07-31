import os
import subprocess


REPOS_PATH = "/home/thefoxcost/Documents/Drei/repos"


def run_git(repo_path, args):
    try:
        result = subprocess.run(
            ["git", f"--git-dir={repo_path}", *args],
            capture_output=True,
            text=True,
        )

        return result.returncode, result.stdout.strip(), result.stderr.strip()

    except Exception as e:
        return 1, "", str(e)


def check_repo(user, repo):
    repo_path = os.path.join(REPOS_PATH, user, f"{repo}.git")

    print(f"\nChecking: {repo_path}\n")

    checks = []

    # Exists
    checks.append((
        "Repository exists",
        os.path.exists(repo_path)
    ))

    if not os.path.exists(repo_path):
        print("❌ Repository not found")
        return False

    # Bare repo
    code, out, err = run_git(repo_path, ["rev-parse", "--is-bare-repository"])
    checks.append((
        "Bare repository",
        out == "true"
    ))

    # HEAD
    head = os.path.join(repo_path, "HEAD")
    checks.append((
        "HEAD exists",
        os.path.isfile(head)
    ))

    # References
    code, out, err = run_git(repo_path, ["show-ref"])
    checks.append((
        "Has references",
        bool(out)
    ))

    # Objects
    objects = os.path.join(repo_path, "objects")
    checks.append((
        "Objects exist",
        os.path.isdir(objects) and len(os.listdir(objects)) > 2
    ))

    # Git integrity
    code, out, err = run_git(repo_path, ["fsck", "--full"])
    checks.append((
        "Git integrity",
        code == 0
    ))

    healthy = True

    for name, result in checks:
        if result:
            print(f"✅ {name}")
        else:
            print(f"❌ {name}")
            healthy = False

    print()

    if healthy:
        print("✅ Repository is healthy")
    else:
        print("❌ Repository has problems")

    return healthy