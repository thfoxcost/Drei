from pathlib import Path
import shutil

from git import Repo, InvalidGitRepositoryError


def has_commits(repo_path: Path):
    try:
        repo = Repo(repo_path)

        return repo.head.is_valid()

    except InvalidGitRepositoryError:
        return False


def remove_empty_repos(repos_path: str):

    repos = Path(repos_path)

    if not repos.exists():
        print("Repos folder does not exist")
        return


    for user in repos.iterdir():

        # skip files
        if not user.is_dir():
            continue

        # skip tools folder
        if user.name == "tools":
            continue


        # user folder
        for repo in user.iterdir():

            if not repo.is_dir():
                continue

            if not repo.name.endswith(".git"):
                continue


            if not has_commits(repo):

                print(f"Removing: {user.name}/{repo.name}")

                shutil.rmtree(repo)

                print(f"✓ Success: {repo.name}")


    print("Finished")