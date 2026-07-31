from lib.remove_empty import remove_empty_repos
from lib.check_repo import check_repo


def main():

    print("""
Repo Tools

1. Remove empty repos
2. Check repository
3. Exit
""")

    choice = input("Choose option: ")

    if choice == "1":
        remove_empty_repos("..")

    elif choice == "2":
        user = input("Username: ")
        repo = input("Repository name: ")

        check_repo(user, repo)

    elif choice == "3":
        print("Bye")

    else:
        print("Invalid option")


if __name__ == "__main__":
    main()