# 🔧 ТЕХНИКИЙН ӨР УДИРДЛАГА (Technical Debt Management)

**Огноо:** 2025-12-07  
**Зорилго:** Кодыг "Хар нүхэнд" унахаас хамгаалах  
**Давтамж:** 3 сар тутамд 1 долоо хоног

---

## 📅 REFACTORING CALENDAR

| Үе | Огноо | Фокус |
|----|-------|-------|
| Q1 2025 | 3-р сар | Initial tech debt review |
| Q2 2025 | 6-р сар | Performance optimization |
| Q3 2025 | 9-р сар | Security audit |
| Q4 2025 | 12-р сар | Dependency updates |

---

## 🎯 ТЕХНИКИЙН ӨР КАТЕГОРИ

### 1. Code Debt (Кодын өр)

| Төрөл | Жишээ | Эрсдэл |
|-------|-------|--------|
| TODO comments | `// TODO: Fix later` | Мартагдах |
| Any types | `data: any` | Type safety алдагдах |
| Console.log | Production дээр log | Performance |
| Duplicate code | Copy-paste functions | Maintenance хэцүү |

**Хайлт:**
```bash
# TODO-уудыг олох
grep -r "TODO" src/

# any types олох
grep -r ": any" src/

# console.log олох
grep -r "console.log" src/
```

### 2. Dependency Debt (Dependencies)

```bash
# Outdated packages шалгах
npm outdated

# Security vulnerabilities шалгах
npm audit
```

### 3. Performance Debt

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 4s

### 4. Test Debt

- [ ] Unit test coverage > 60%
- [ ] E2E tests for critical paths
- [ ] Integration tests for API

---

## 📋 REFACTORING WEEK CHECKLIST

### Өдөр 1: Audit

- [ ] Run `npm audit`
- [ ] Run lighthouse audit
- [ ] Check Sentry for recurring errors
- [ ] Review TODO comments

### Өдөр 2: Dependencies

- [ ] Update minor versions (`npm update`)
- [ ] Review and test major version updates
- [ ] Remove unused dependencies

### Өдөр 3: Code Quality

- [ ] Fix ESLint warnings
- [ ] Remove `any` types where possible
- [ ] Remove console.logs
- [ ] DRY up duplicate code

### Өдөр 4: Performance

- [ ] Image optimization
- [ ] Bundle size analysis
- [ ] Lazy loading review
- [ ] Database query optimization

### Өдөр 5: Documentation

- [ ] Update README if needed
- [ ] Update API documentation
- [ ] Review and update SOP

---

## 🚨 TECH DEBT SEVERITY LEVELS

| Level | Тайлбар | Жишээ | Хэзээ засах |
|-------|---------|-------|-------------|
| 🔴 Critical | Production эвдэрч болзошгүй | Security vulnerability | Шууд |
| 🟠 High | Performance муу | Slow queries | 1 долоо хоногт |
| 🟡 Medium | Maintenance хэцүү | Duplicate code | Дараагийн refactor week |
| 🟢 Low | Cosmetic | Naming conventions | Чөлөөтэй үедээ |

---

## 📊 TECH DEBT TRACKING

### Одоогийн Tech Debt Items:

| # | Тайлбар | Severity | Файл | Статус |
|---|---------|----------|------|--------|
| 1 | Supabase types generate хийх | 🟡 Medium | types/ | Pending |
| 2 | Image upload optimization | 🟡 Medium | upload/route.ts | Pending |
| 3 | Add more unit tests | 🟡 Medium | __tests__/ | Pending |
| 4 | ??? | ??? | ??? | ??? |

### Шийдэгдсэн:

| # | Тайлбар | Огноо |
|---|---------|-------|
| - | ESLint config relaxed | 2025-12 |
| - | Sentry integrated | 2025-12 |
| - | Error boundaries added | 2025-12 |

---

## 🛠️ REFACTORING TOOLS

### ESLint

```bash
# Бүх алдааг харах
npm run lint

# Auto-fix
npm run lint -- --fix
```

### TypeScript

```bash
# Type errors шалгах
npx tsc --noEmit
```

### Bundle Analysis

```bash
# Bundle size analyze
npm run build
npx @next/bundle-analyzer
```

### Database

```sql
-- Slow queries олох (Supabase)
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

---

## ⚠️ ХЭЗЭЭ Ч ХИЙХГҮЙ ЗҮЙЛС

1. **Production дээр "test" feature нэмэхгүй**
2. **Large refactor branch 1 долоо хоногоос урт байхгүй**
3. **Tests-гүйгээр refactor хийхгүй**
4. **Backup-гүйгээр DB migration хийхгүй**

---

## 📈 TECH HEALTH SCORE

Одоогийн оноо: **85/100** ✅

| Категори | Оноо | Дэлгэрэнгүй |
|----------|------|-------------|
| Code Quality | 90 | TypeScript, ESLint |
| Test Coverage | 70 | Нэмэх хэрэгтэй |
| Dependencies | 85 | Шинэчилсэн |
| Performance | 80 | Lighthouse тест хийх |
| Security | 90 | Sentry, RLS, Input validation |
| Documentation | 95 | 20+ audit reports |

---

> **3 САР ТУТАМД ЭНЭ CHECKLIST-ИЙГ ДАВТАХ!**
> 
> Техникийн өр = Санхүүгийн өр шиг
> Төлөхгүй бол хүү нэмэгдэнэ.
