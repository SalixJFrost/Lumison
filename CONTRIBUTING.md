# Contributing to Lumison

Thank you for your interest in contributing to Lumison! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Documentation](#documentation)

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- (Optional) Rust toolchain for desktop development

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Lumison.git
   cd Lumison
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **For desktop development**
   ```bash
   npm run tauri:dev
   ```

For detailed setup instructions, see [Development Guide](docs/DEVELOPMENT.md).

## 🔄 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run tests
npm test

# Check for type errors
npm run build

# Test desktop app
npm run tauri:dev
```

### 4. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue with playback"
git commit -m "docs: update README"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Maintenance tasks

## 📤 Submitting Changes

### Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Submit for review

### Pull Request Guidelines

- **Title**: Clear and descriptive
- **Description**: Explain what and why
- **Screenshots**: Include for UI changes
- **Tests**: Ensure all tests pass
- **Documentation**: Update if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

## 🎨 Style Guidelines

### TypeScript/React

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names

### Code Style

```typescript
// Good
const handlePlayPause = useCallback(() => {
  if (isPlaying) {
    pause();
  } else {
    play();
  }
}, [isPlaying, pause, play]);

// Avoid
const f = () => { /* ... */ };
```

### File Organization

```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── services/       # Business logic
├── contexts/       # React contexts
├── utils/          # Utility functions
└── types.ts        # Type definitions
```

## 📝 Documentation

### Code Comments

- Add JSDoc comments for functions
- Explain complex algorithms
- Document non-obvious behavior

```typescript
/**
 * Calculates the optimal buffer size based on sample rate
 * @param sampleRate - Audio sample rate in Hz
 * @returns Buffer size in samples
 */
function calculateBufferSize(sampleRate: number): number {
  // Implementation
}
```

### Documentation Updates

When adding features:
- Update relevant documentation
- Add examples if applicable
- Update README if needed

## 🐛 Reporting Bugs

### Before Submitting

- Check existing issues
- Verify it's reproducible
- Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

We welcome feature suggestions! Please:
- Check if it's already requested
- Explain the use case
- Describe the expected behavior
- Consider implementation complexity

## 🔍 Code Review Process

1. **Automated checks** run on PR submission
2. **Maintainer review** within 1-3 days
3. **Feedback** and requested changes
4. **Approval** and merge

## 📞 Getting Help

- **Documentation**: Check [docs/](docs/)
- **Issues**: Search existing issues
- **Discussions**: Ask in GitHub Discussions
- **Discord**: Join our community (coming soon)

## 🙏 Recognition

Contributors will be:
- Listed in release notes
- Mentioned in README
- Credited in documentation

Thank you for contributing to Lumison! 🎵

---

For more detailed information, see:
- [Development Guide](docs/DEVELOPMENT.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Release Guide](docs/RELEASE_GUIDE.md)
