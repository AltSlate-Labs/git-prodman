# Contributing to git-prodman

Thank you for your interest in contributing to git-prodman! This document provides guidelines and instructions for contributing.

## Ways to Contribute

- **Report bugs** - Open an issue describing the bug, steps to reproduce, and expected behavior
- **Suggest features** - Open an issue describing the feature and its use case
- **Submit pull requests** - Fix bugs or implement new features
- **Improve documentation** - Fix typos, clarify instructions, or add examples

## Reporting Issues

Before creating an issue, please:

1. Search existing issues to avoid duplicates
2. Use the issue templates when available
3. Include relevant information:
   - git-prodman version (`prodman --version`)
   - Node.js version (`node --version`)
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages or logs

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or compatible package manager
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/AltSlate-Labs/git-prodman.git
cd git-prodman

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev -- --help

# Link for local testing
npm link
```

### Project Structure

```
git-prodman/
├── src/
│   ├── cli/           # CLI commands and entry point
│   │   ├── commands/  # Individual command implementations
│   │   └── index.ts   # CLI entry point
│   ├── core/          # Core business logic
│   │   ├── schemas/   # Zod validation schemas
│   │   └── services/  # Service modules
│   └── web/           # Web UI server and assets
├── dist/              # Compiled output
└── package.json
```

### Available Scripts

```bash
npm run dev        # Run CLI in development mode with tsx
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Type-check without emitting
npm test           # Run tests
npm run ui         # Start web UI in development
```

## Code Style

### TypeScript

- Use TypeScript for all source files
- Enable strict mode
- Prefer explicit types over `any`
- Use ES Modules (`import`/`export`)

### General Guidelines

- Keep functions small and focused
- Write descriptive variable and function names
- Add comments for complex logic
- Handle errors appropriately

### File Naming

- Use kebab-case for file names (`my-component.ts`)
- Use PascalCase for classes and types
- Use camelCase for functions and variables

## Pull Request Process

### Before Submitting

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes with clear, atomic commits

3. Ensure your code builds:
   ```bash
   npm run build
   ```

4. Run type checking:
   ```bash
   npm run typecheck
   ```

5. Test your changes manually:
   ```bash
   npm link
   prodman --help
   ```

### Submitting

1. Push your branch:
   ```bash
   git push origin feat/your-feature-name
   ```

2. Open a Pull Request with:
   - Clear title describing the change
   - Description of what and why
   - Link to related issue if applicable
   - Screenshots for UI changes

### Review Process

- A maintainer will review your PR
- Address any feedback or requested changes
- Once approved, a maintainer will merge the PR

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add search command with full-text support
fix: resolve issue with epic status validation
docs: update installation instructions
refactor: simplify config loading logic
```

Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Testing

### Manual Testing

Test your changes against common workflows:

```bash
# Initialize in a test directory
mkdir test-project && cd test-project
git init
prodman init

# Test affected commands
prodman epic create
prodman ui
```

### Automated Tests

```bash
npm test
```

## Questions?

- Open a [GitHub Discussion](https://github.com/AltSlate-Labs/git-prodman/discussions) for questions
- Join the community chat (link in README)
- Check existing issues and discussions first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
