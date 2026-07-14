#!/usr/bin/env bash

echo "1) Client (bun dev)"
echo "2) Exit"
echo

read -rp "Choose an option: " choice

case "$choice" in
    1)
        cd client || exit 1
        bun --bun run dev
        ;;
    2)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid option."
        exit 1
        ;;
esac
esac