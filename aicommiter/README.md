# Aicommiter

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](http://choosealicense.com/licenses/mit/)
[![Language: Nim](https://img.shields.io/badge/language-Nim-yellow.svg)](https://nim-lang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/thfoxcost/aicommiter/pulls)

aicommiter is a command-line tool written in [Nim](https://nim-lang.org/) that automatically generates meaningful Git commit messages using AI. It reads the staged diff of your Git repository, sends it to an AI model via an OpenAI-compatible API (such as [NVIDIA NIM](https://www.nvidia.com/en-us/ai/)), and outputs a ready-to-use commit message.

## Installation

System requirements are [Nim](https://nim-lang.org/install.html) (1.6.0 or later), [Git](https://git-scm.com/), and an API key for any OpenAI-compatible LLM service. [Nimble](https://github.com/nim-lang/nimble) is bundled with most Nim installations.

### Directly

```sh
# Clone the repository
git clone https://github.com/thfoxcost/aicommiter.git
cd aicommiter

# Install dependencies
nimble install dotenv

# Compile
nim c -d:release main.nim
```

### Add to PATH

```sh
# Linux / macOS
sudo mv main /usr/local/bin/aicommiter

# Or symlink
ln -s $(pwd)/main /usr/local/bin/aicommiter
```

## Configuration

aicommiter is configured through a `.env` file placed in the root of the Git repository you run it against. A template is provided in `.env.example`:

```env
AI_API_KEY=""
API_KEY_ENDPOINT=""
MODEL=""
```

| Variable           | Description                                    | Example                               |
|--------------------|------------------------------------------------|---------------------------------------|
| `AI_API_KEY`       | Your API key for the LLM service.              | `nvapi-xxxxxxxxxxxxxxxxxxxx`          |
| `API_KEY_ENDPOINT` | Base URL of the OpenAI-compatible endpoint.    | `https://integrate.api.nvidia.com/v1` |
| `MODEL`            | Model identifier to use for generation.        | `meta/llama-3.1-8b-instruct`          |

Copy the example file into your target repository and fill in your credentials:

```sh
cp .env.example /path/to/your/repo/.env
```

Never commit your `.env` file. Add it to `.gitignore`:

```sh
echo ".env" >> /path/to/your/repo/.gitignore
```

## Using aicommiter

Stage your changes, then run the tool pointing at your repository:

```sh
git add .
aicommiter /path/to/your/repo
```

If you are already inside the repository, the path argument can be omitted and defaults to `./`:

```sh
cd /path/to/your/repo
aicommiter
```

Example output:

```
Generated commit message:
feat(auth): implement JWT refresh token rotation with configurable expiry

- Add RefreshToken() method to handle token renewal
- Introduce configurable token TTL via environment variable
- Update middleware to validate refresh token claims
```

Copy the result and pass it to `git commit -m`.

Some useful notes:
* Stage only related changes. The more focused your diff, the more accurate the generated message.
* The tool only **generates** the message — it never runs `git commit` on your behalf.
* Any OpenAI-compatible endpoint works. To use OpenAI directly, set `API_KEY_ENDPOINT` to `https://api.openai.com/v1` and pick a model such as `gpt-4o`.

## Project Structure

```
aicommiter/
├── main.nim          # Entry point; orchestrates the full pipeline
├── ai/
│   └── preapare.nim  # Builds the prompt sent to the AI model
├── api/
│   └── client.nim    # HTTP client for the LLM API endpoint
├── cmd/
│   ├── diff.nim      # Runs git diff --cached and returns staged output
│   └── verify.nim    # Validates Git init status and staged changes
├── test/             # Test files
├── .env.example      # Environment variable template
└── README.md
```

## Contributing

Pull requests are welcome. Please explain the motivation for a given change and include examples of its effect.

1. Fork the repository and clone your fork.
2. Create a descriptive branch: `git checkout -b feat/your-feature`.
3. Follow idiomatic Nim style. Use `camelCase` for variables and procedures, `PascalCase` for types.
4. Keep concerns separated — API calls in `api/`, Git operations in `cmd/`, prompt logic in `ai/`.
5. Add or update tests in `test/` for any changed behaviour.
6. Open a pull request against `main` and describe what changed and why.

When reporting a bug, please include your Nim version (`nim --version`), your OS, steps to reproduce, and any relevant error output.

## Troubleshooting

**`Error: environment variable not set`** — Ensure your `.env` file exists in the directory passed as an argument and that all three variables are set to non-empty values.

**`Error: Directory not found`** — The path passed as an argument does not exist. Double-check it, or run the tool from inside the target directory with no arguments.

**Generated message is generic or inaccurate** — Confirm you have staged changes with `git add`. A large diff spanning many unrelated files will produce less precise output; stage focused, related changes for best results.

**Path separator issues on Windows** — aicommiter automatically converts backslashes to forward slashes, so `C:\Users\you\project` should work. If problems persist, use forward slashes explicitly.

## License

This project falls under the MIT license.
