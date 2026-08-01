import json
import requests


ISSUES_FILE = "data/drei_issues.json"

def create_issues(owner, repo, token):

    with open(ISSUES_FILE, "r") as file:
        issues = json.load(file)

    url = f"https://api.github.com/repos/{owner}/{repo}/issues"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2026-03-10"
    }

    for issue in issues:

        data = {
            "title": issue["title"],
            "body": (
                f"**Priority:** {issue['priority']}\n\n"
                f"{issue['body']}"
            ),
            "labels": issue["labels"],
            "assignees": [
                issue["assignee"]
            ]
        }

        response = requests.post(
            url,
            headers=headers,
            json=data
        )

        if response.status_code == 201:
            print(f"✓ Created: {issue['title']}")

        else:
            print(
                f"✗ Failed: {issue['title']}"
            )
            print(response.json())