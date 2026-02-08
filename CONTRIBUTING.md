# Contributing to AI Tweet Generator

Thank you for your interest in contributing to the AI Tweet Generator! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+ installed
- A free API key from one of the supported providers (Groq recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-tweet-generator.git
   cd ai-tweet-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Add your API key(s) to `.env`**
   ```bash
   # At minimum, add one of these:
   VITE_GROQ_API_KEY=your_groq_api_key_here
   VITE_GLM_API_KEY=your_glm_api_key_here
   # ... etc
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000)

## Running Tests

We use Vitest for testing with React Testing Library.

- **Run all tests in watch mode:**
  ```bash
  npm test
  ```

- **Run tests once:**
  ```bash
  npm test --run
  ```

- **Run tests with UI:**
  ```bash
  npm run test:ui
  ```

- **View coverage report:**
  ```bash
  npm test --run --coverage
  ```

## Code Style

### Linting

We use ESLint with TypeScript support.

- **Check for linting errors:**
  ```bash
  npm run lint
  ```

- **Auto-fix linting errors:**
  ```bash
  npm run lint -- --fix
  ```

### Formatting

We use Prettier for code formatting.

- **Format code:**
  ```bash
  npm run format
  ```

- **Check formatting:**
  ```bash
  npm run format:check
  ```

## Type Safety

This project uses TypeScript. Please ensure:

- All new files have proper type annotations
- Avoid `any` types when possible
- Use existing types from `lib/` modules
- Run `tsc` to check types: `npm run build` (includes type checking)

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── __tests__/      # Component tests
│   └── *.tsx           # Feature components
├── lib/                # Core business logic
│   ├── __tests__/      # Library tests
│   ├── api.ts          # AI provider integrations
│   ├── validation.ts   # Zod schemas
│   └── *.ts            # Utilities
└── main.tsx            # Application entry point
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks
- `perf:` Performance improvements

### Examples

```bash
git commit -m "feat: add support for custom tweet templates"
git commit -m "fix: resolve API rate limiting error"
git commit -m "test: add component tests for TweetPreview"
```

## Pull Request Process

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style guidelines
3. **Write tests** for new features or bug fixes
4. **Ensure all tests pass:** `npm test --run`
5. **Ensure linting passes:** `npm run lint`
6. **Update documentation** if needed
7. **Submit a pull request** with a clear description of changes

### PR Title Format

Use conventional commit format in PR titles:

- `feat: Add dark mode toggle`
- `fix: Fix character count overflow`
- `docs: Update README with new features`

### PR Description

Include:

- **What** changes were made
- **Why** the changes were needed
- **How** to test the changes
- **Screenshots** for UI changes (if applicable)
- **Breaking changes** (if any)

## Development Guidelines

### Component Development

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for all components
- Write tests for new components
- Follow the existing component patterns

### API Integration

- Use existing API functions from `lib/api.ts`
- Add new providers to the `API_CONFIGS` object
- Handle errors gracefully
- Add rate limiting for new features
- Test API integration with mocks

### State Management

- Use React hooks for local state
- Use localStorage for persistence (see `lib/history.ts`)
- Keep state as close to where it's used as possible
- Avoid prop drilling when appropriate

## Adding New Features

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement the feature:**
   - Add logic to `lib/` if it's business logic
   - Add components to `components/` if it's UI
   - Write tests for new code

3. **Update documentation:**
   - Update README.md for user-facing features
   - Add comments for complex logic
   - Update types if needed

4. **Test thoroughly:**
   - Unit tests for business logic
   - Component tests for UI
   - Manual testing for user flows

## Questions or Issues?

- **Check existing issues:** [GitHub Issues](https://github.com/yourusername/ai-tweet-generator/issues)
- **Create a new issue:** Use the issue templates if available
- **Discussions:** Use GitHub Discussions for questions

## Code Review Process

1. All PRs require at least one approval
2. CI checks must pass (tests, linting, build)
3. Address review comments promptly
4. Keep PRs focused and small when possible
5. Request review from maintainers when ready

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You! 🎉

Contributions of any kind are welcome and appreciated. Whether it's bug reports, feature requests, code, or documentation, we value all contributions!
