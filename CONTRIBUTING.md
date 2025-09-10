# Contributing to furs-client-ts

Thank you for your interest in contributing to the FURS TypeScript client! We welcome contributions from the community.

## 🎯 How to Contribute

### Types of Contributions

- 🐛 **Bug Reports** - Help us identify and fix issues
- 💡 **Feature Requests** - Suggest new functionality or improvements
- 📖 **Documentation** - Improve guides, examples, and API documentation
- 🔧 **Code Contributions** - Bug fixes, new features, and optimizations
- 🧪 **Testing** - Add test coverage and improve test quality

## 🚀 Getting Started

### Prerequisites

- Node.js >= 14.0.0
- TypeScript >= 4.0.0
- Git for version control
- A FURS test certificate (for integration testing)

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/furs-client-ts.git
   cd furs-client-ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test              # Full test suite
   npm run test:unit     # Unit tests only
   ```

## 📝 Development Guidelines

### TypeScript Standards

- **Strict TypeScript**: All code must compile with strict mode enabled
- **Type Safety**: No `any` types unless absolutely necessary
- **Interfaces**: Use interfaces for all public APIs and data structures
- **Documentation**: Add JSDoc comments for all public methods and interfaces

### Code Style

- **Formatting**: Use the project's TypeScript configuration
- **Naming**: Use descriptive names following TypeScript conventions
- **Error Handling**: Use typed custom error classes
- **Logging**: Use the built-in debug logging system

## 🔄 Contribution Process

### 1. Planning

- **Check Existing Issues**: Look for related issues or discussions
- **Create Issue**: For new features, create an issue to discuss the approach
- **Get Feedback**: Wait for maintainer feedback before starting large changes

### 2. Development

- **Create Branch**: `git checkout -b feature/your-feature-name`
- **Follow Guidelines**: Adhere to TypeScript and coding standards
- **Add Tests**: Include comprehensive tests for your changes
- **Update Documentation**: Update README, docs, or examples as needed

### 3. Testing

- **Run All Tests**: `npm test` - ensure all tests pass
- **Test TypeScript Compilation**: `npm run build` - ensure no compilation errors
- **Test Examples**: Verify that examples still work with your changes

### 4. Submission

- **Commit Messages**: Use clear, descriptive commit messages
- **Push Branch**: `git push origin feature/your-feature-name`
- **Create Pull Request**: Include description of changes and testing performed
- **Address Feedback**: Respond to code review comments promptly

## 🐛 Reporting Issues

When reporting bugs, please include:

1. **Environment Information**:
   - Node.js version
   - TypeScript version
   - Operating system
   - Package version

2. **Reproduction Steps**:
   - Minimal code example
   - Expected behavior
   - Actual behavior
   - Error messages/stack traces

## 📋 Pull Request Checklist

Before submitting a pull request, ensure:

- [ ] Code compiles without TypeScript errors
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated (README, JSDoc, examples)
- [ ] Code follows project style guidelines
- [ ] Commit messages are clear and descriptive

## 📞 Questions or Help?

- 💬 **GitHub Discussions**: For general questions
- 🐛 **GitHub Issues**: For bugs and feature requests
- 📧 **Contact**: Via GitHub profile

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to furs-client-ts!** 🚀
