#!/bin/bash

# Frontend
(
  cd client || exit
  bun run dev
) &

# Backend
(
  cd backend || exit
  export PATH="$PATH:$(go env GOPATH)/bin"
  air
) &

wait