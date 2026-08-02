#!/usr/bin/env bash

set -e

cat > README.md << 'EOF'
# Drei

Welcome to **Drei**.

This README is used to test the documentation tabs.

## Features

- Git hosting
- Written in Go
- React frontend

```go
package main

func main() {
	println("Hello, Drei!")
}
```
EOF

cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction.
EOF

cat > CHANGELOG.md << 'EOF'
# Changelog

## v0.2.0

- Added documentation tabs
- Improved repository page

## v0.1.0

- Initial release
EOF

cat > CONTRIBUTING.md << 'EOF'
# Contributing

Thank you for contributing!

## How to contribute

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a Pull Request.
EOF

cat > SECURITY.md << 'EOF'
# Security Policy

Please report vulnerabilities to:

security@example.com

Do not publicly disclose vulnerabilities before they are fixed.
EOF

cat > CODE_OF_CONDUCT.md << 'EOF'
# Code of Conduct

## Our Standards

- Be respectful.
- Be welcoming.
- Help others.
- Be constructive.
EOF

cat > SUPPORT.md << 'EOF'
# Support

Need help?

- Open an issue.
- Join the community.
- Contact the maintainers.
EOF

cat > AUTHORS << 'EOF'
# Authors

- thefoxcost
- Contributors
EOF

echo
echo "Created documentation files:"
ls -1 \
  README.md \
  LICENSE \
  CHANGELOG.md \
  CONTRIBUTING.md \
  SECURITY.md \
  CODE_OF_CONDUCT.md \
  SUPPORT.md \
  AUTHORS