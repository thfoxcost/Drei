cd "$(dirname "$0")"

python -m venv .venv
source .venv/bin/activate

pip install GitPython requests