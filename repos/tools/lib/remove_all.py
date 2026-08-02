import os
import shutil

# Path to the "repos" directory
REPOS_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


def remove_user_repos(username: str):
    user_path = os.path.join(REPOS_PATH, username)

    if not os.path.isdir(user_path):
        print(f"User '{username}' not found.")
        print(f"Looked in: {user_path}")
        return

    repos = [
        repo
        for repo in os.listdir(user_path)
        if os.path.isdir(os.path.join(user_path, repo))
    ]

    if not repos:
        print(f"No repositories found for '{username}'.")
        return

    print(f"\nRepositories owned by '{username}':")
    for repo in repos:
        print(f"  - {repo}")

    confirm = input("\nDelete ALL repositories? (yes/no): ").strip().lower()

    if confirm != "yes":
        print("Cancelled.")
        return

    deleted = 0

    for repo in repos:
        repo_path = os.path.join(user_path, repo)
        shutil.rmtree(repo_path)
        print(f"Deleted {repo}")
        deleted += 1

    print(f"\nDeleted {deleted} repositories.")

    # Remove the user's directory if it is now empty
    if not os.listdir(user_path):
        os.rmdir(user_path)
        print(f"Removed empty user directory '{username}'.")