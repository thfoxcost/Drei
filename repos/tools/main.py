import sys
from lib.remove_empty import remove_empty_repos


def main():

    print("""
Repo Tools

1. Remove empty repos
2. Exit
""")

    choice = input("Choose option: ")


    if choice == "1":
        remove_empty_repos("..")

    elif choice == "2":
        print("Bye")

    else:
        print("Invalid option")


if __name__ == "__main__":
    main()