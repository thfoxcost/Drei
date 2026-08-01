from lib.remove_empty import remove_empty_repos
from lib.check_repo import check_repo
from lib.create_issues import create_issues


def main():

    print("""
Repo Tools

1. Remove empty repos
2. Check repository
3. Create GitHub issues
4. Exit
""")

    choice = input("Choose option: ")

    if choice == "1":
        remove_empty_repos("..")

    elif choice == "2":
        user = input("Username: ")
        repo = input("Repository name: ")

        check_repo(user, repo)

    elif choice == "3":
        print("[WARNING] This will create issues in the specified repository, Please fill up the issues file.")
        owner = input("GitHub username: ")
        repo = input("Repository: ")
        token = input("GitHub token: ")


        create_issues(owner, repo, token)

    elif choice == "4":
        print("Bye")

    else:
        print("Invalid option")


if __name__ == "__main__":
    main()