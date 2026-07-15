#!/bin/bash

# Frontend
(
  cd client || exit
  bun run dev
) &

# Backend
(
  cd backend || exit
  go run .
) &

wait