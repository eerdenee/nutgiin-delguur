# Contributing to Нутгийн Дэлгүүр

Thank you for your interest in contributing to **Нутгийн Дэлгүүр**! This document provides guidelines for contributing to the project.

## 🌟 Ways to Contribute

- 🐛 Report bugs
- ✨ Suggest new features
- 📝 Improve documentation
- 🧪 Write tests
- 💻 Submit pull requests

## 📋 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/nutgiin-delguur.git
cd nutgiin-delguur
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
git commit -m "✨ Add: new feature description"
git commit -m "🐛 Fix: bug description"
git commit -m "📝 Docs: documentation update"
git commit -m "🧪 Test: add tests for..."
git commit -m "♻️ Refactor: code improvement"
```

### 7. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 8. Create a Pull Request

Go to the original repository and click "New Pull Request".

## 📏 Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all data structures
- Avoid using `any` type
- Use meaningful variable and function names

### React Components

- Use functional components with hooks
- Keep components focused and reusable
- Use proper TypeScript typing for props
- Add comments for complex logic

### File Naming

- Components: `PascalCase` (e.g., `ProductCard.tsx`)
- Utilities: `camelCase` (e.g., `formatPrice.ts`)
- Pages: Next.js conventions (e.g., `page.tsx`, `[id]/page.tsx`)

### Code Organization

```typescript
// 1. Imports (external, then internal)
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

// 2. Types/Interfaces
interface ProductCardProps {
  id: string;
  title: string;
}

// 3. Component
export default function ProductCard({ id, title }: ProductCardProps) {
  // 4. Hooks
  const [loading, setLoading] = useState(false);

  // 5. Functions
  const handleClick = () => {
    // ...
  };

  // 6. Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

## 🧪 Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for meaningful test coverage

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: How to reproduce the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment**: Browser, OS, Node version

## ✨ Feature Requests

When suggesting features:

1. **Use Case**: Why is this feature needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other solutions you considered
4. **Additional Context**: Any other relevant information

## 📄 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for everyone.

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Accept constructive criticism
- ✅ Focus on what is best for the community
- ❌ No harassment or discriminatory language
- ❌ No trolling or insulting comments

## 📝 License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

## 🙏 Thank You!

Your contributions help make **Нутгийн Дэлгүүр** better for everyone. We appreciate your time and effort!

---

**Questions?** Feel free to reach out at eerdenee320@gmail.com
