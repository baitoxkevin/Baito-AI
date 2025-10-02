# 🔍 BAITO-AI CODE REVIEW CHECKLIST & REFACTORING GUIDE

## Code Review Checklist

### 1. Security Review ⚠️ CRITICAL

#### Authentication & Authorization
- [ ] No hardcoded credentials or API keys
- [ ] Proper authentication checks on all routes
- [ ] Role-based access control implemented correctly
- [ ] Session management follows best practices
- [ ] Token expiration handled properly

#### Data Security
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection implemented
- [ ] Sensitive data encrypted

#### Code Security
```typescript
// ❌ BAD - Exposed credentials
const API_KEY = "sk_live_abcd1234";

// ✅ GOOD - Environment variables
const API_KEY = process.env.VITE_API_KEY;

// ❌ BAD - Direct SQL
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ GOOD - Parameterized
const { data } = await supabase
  .from('users')
  .select()
  .eq('id', userId);
```

### 2. Code Quality Standards

#### TypeScript Best Practices
- [ ] No `any` types (use `unknown` if needed)
- [ ] Proper type definitions for all functions
- [ ] Interfaces over type aliases for objects
- [ ] Enums for fixed sets of values
- [ ] Strict null checks enabled

```typescript
// ❌ BAD - Using any
function processData(data: any) {
  return data.value;
}

// ✅ GOOD - Proper typing
interface DataInput {
  value: string;
  timestamp: Date;
}

function processData(data: DataInput): string {
  return data.value;
}
```

#### React Patterns
- [ ] Functional components with hooks
- [ ] Proper dependency arrays in hooks
- [ ] Memoization for expensive operations
- [ ] Error boundaries for error handling
- [ ] Loading and error states handled

```typescript
// ❌ BAD - Missing dependencies
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId

// ✅ GOOD - Proper dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ BETTER - With cleanup
useEffect(() => {
  const controller = new AbortController();
  fetchData(userId, controller.signal);
  return () => controller.abort();
}, [userId]);
```

### 3. Performance Checklist

#### Component Optimization
- [ ] Components properly memoized
- [ ] Virtual scrolling for long lists
- [ ] Lazy loading for routes
- [ ] Images optimized and lazy loaded
- [ ] Debouncing for search/filter inputs

```typescript
// ✅ Memoized component
const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(() =>
    heavyProcessing(data), [data]
  );

  return <div>{processedData}</div>;
});

// ✅ Debounced search
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

#### Bundle Optimization
- [ ] Code splitting implemented
- [ ] Tree shaking working
- [ ] No unnecessary dependencies
- [ ] Production build optimized
- [ ] Source maps disabled in production

### 4. Maintainability Review

#### Code Organization
- [ ] Single Responsibility Principle
- [ ] DRY (Don't Repeat Yourself)
- [ ] Functions < 50 lines
- [ ] Files < 300 lines
- [ ] Clear naming conventions

```typescript
// ❌ BAD - Multiple responsibilities
function handleUserData(user) {
  // Validate
  if (!user.email) return;

  // Transform
  user.name = user.name.toUpperCase();

  // Save
  saveToDatabase(user);

  // Send email
  sendWelcomeEmail(user);
}

// ✅ GOOD - Single responsibility
function validateUser(user: User): boolean {
  return !!user.email && !!user.name;
}

function transformUser(user: User): User {
  return { ...user, name: user.name.toUpperCase() };
}

async function processNewUser(user: User) {
  if (!validateUser(user)) return;

  const transformed = transformUser(user);
  await saveUser(transformed);
  await sendWelcomeEmail(transformed);
}
```

#### Documentation
- [ ] Complex logic commented
- [ ] JSDoc for public functions
- [ ] README updated if needed
- [ ] API changes documented
- [ ] Breaking changes noted

### 5. Testing Coverage

- [ ] Unit tests for utilities
- [ ] Integration tests for API calls
- [ ] Component tests for UI
- [ ] Edge cases covered
- [ ] Error scenarios tested

```typescript
// Example test structure
describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create project with valid data', async () => {
      // Test implementation
    });

    it('should reject invalid dates', async () => {
      // Test implementation
    });

    it('should handle database errors', async () => {
      // Test implementation
    });
  });
});
```

## Refactoring Strategies

### 1. Component Refactoring

#### Before: Monolithic Component
```typescript
// ❌ 500+ lines component doing everything
function ProjectDashboard() {
  // State management
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('date');
  const [loading, setLoading] = useState(false);

  // Data fetching
  useEffect(() => {
    // Complex fetching logic
  }, []);

  // Filtering logic
  const filteredProjects = projects.filter(/* complex logic */);

  // Sorting logic
  const sortedProjects = filteredProjects.sort(/* complex logic */);

  // Event handlers
  const handleEdit = (id) => { /* ... */ };
  const handleDelete = (id) => { /* ... */ };
  const handleExport = () => { /* ... */ };

  // Render everything
  return (
    <div>
      {/* 200+ lines of JSX */}
    </div>
  );
}
```

#### After: Modular Components
```typescript
// ✅ Separated concerns
// hooks/useProjects.ts
function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    const data = await projectService.getAll();
    setProjects(data);
    setLoading(false);
  };

  return { projects, loading, fetchProjects };
}

// components/ProjectFilters.tsx
function ProjectFilters({ onFilterChange, onSortChange }) {
  return (
    <div>
      <SearchInput onChange={onFilterChange} />
      <SortDropdown onChange={onSortChange} />
    </div>
  );
}

// components/ProjectList.tsx
function ProjectList({ projects, onEdit, onDelete }) {
  return (
    <VirtualList
      items={projects}
      renderItem={(project) => (
        <ProjectCard
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    />
  );
}

// pages/ProjectDashboard.tsx
function ProjectDashboard() {
  const { projects, loading } = useProjects();
  const { filtered, setFilter, setSort } = useProjectFilters(projects);

  if (loading) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <ProjectFilters
        onFilterChange={setFilter}
        onSortChange={setSort}
      />
      <ProjectList
        projects={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </DashboardLayout>
  );
}
```

### 2. Service Layer Refactoring

#### Before: Mixed Concerns
```typescript
// ❌ Component with business logic
function ExpenseClaimForm() {
  const handleSubmit = async (data) => {
    // Validation logic
    if (!data.amount || data.amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Business logic
    const taxAmount = data.amount * 0.06;
    const totalAmount = data.amount + taxAmount;

    // Direct Supabase call
    const { error } = await supabase
      .from('expense_claims')
      .insert({
        ...data,
        tax: taxAmount,
        total: totalAmount,
        status: 'pending'
      });
  };
}
```

#### After: Separated Services
```typescript
// ✅ services/expense-service.ts
class ExpenseService {
  private validateClaim(data: ClaimInput): void {
    if (!data.amount || data.amount <= 0) {
      throw new ValidationError('Invalid amount');
    }
  }

  private calculateTax(amount: number): number {
    return amount * TAX_RATE;
  }

  async createClaim(data: ClaimInput): Promise<ExpenseClaim> {
    this.validateClaim(data);

    const claim = {
      ...data,
      tax: this.calculateTax(data.amount),
      total: data.amount + this.calculateTax(data.amount),
      status: 'pending' as const
    };

    return await this.repository.create(claim);
  }
}

// repositories/expense-repository.ts
class ExpenseRepository {
  async create(claim: ExpenseClaim): Promise<ExpenseClaim> {
    const { data, error } = await supabase
      .from('expense_claims')
      .insert(claim)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return data;
  }
}

// components/ExpenseClaimForm.tsx
function ExpenseClaimForm() {
  const expenseService = useExpenseService();

  const handleSubmit = async (data: ClaimInput) => {
    try {
      await expenseService.createClaim(data);
      toast.success('Claim submitted');
    } catch (error) {
      toast.error(error.message);
    }
  };
}
```

### 3. State Management Refactoring

#### Before: Prop Drilling
```typescript
// ❌ Passing props through multiple levels
function App() {
  const [user, setUser] = useState(null);
  return <Dashboard user={user} setUser={setUser} />;
}

function Dashboard({ user, setUser }) {
  return <ProjectList user={user} setUser={setUser} />;
}

function ProjectList({ user, setUser }) {
  return <ProjectCard user={user} setUser={setUser} />;
}
```

#### After: Context API
```typescript
// ✅ contexts/UserContext.tsx
const UserContext = createContext<UserContextType>(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be within UserProvider');
  return context;
}

// Usage
function App() {
  return (
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );
}

function ProjectCard() {
  const { user } = useUser(); // Direct access
  return <div>Welcome {user.name}</div>;
}
```

### 4. Performance Refactoring

#### Before: Unoptimized Renders
```typescript
// ❌ Re-renders on every parent update
function ExpensiveList({ items }) {
  const processedItems = items.map(item => ({
    ...item,
    calculated: heavyCalculation(item)
  }));

  return processedItems.map(item => (
    <ExpensiveItem key={item.id} {...item} />
  ));
}
```

#### After: Optimized
```typescript
// ✅ Optimized with memoization
const ExpensiveItem = memo(({ item }) => {
  return <div>{item.calculated}</div>;
});

function ExpensiveList({ items }) {
  const processedItems = useMemo(() =>
    items.map(item => ({
      ...item,
      calculated: heavyCalculation(item)
    })),
    [items]
  );

  return (
    <VirtualList
      items={processedItems}
      height={600}
      itemHeight={80}
      renderItem={({ item }) => (
        <ExpensiveItem key={item.id} item={item} />
      )}
    />
  );
}
```

## Refactoring Priority Matrix

### High Priority (Do Now)
1. **Security vulnerabilities** - API key exposure
2. **Performance bottlenecks** - 3.6MB bundle
3. **Critical bugs** - Data loss scenarios
4. **Accessibility issues** - WCAG compliance

### Medium Priority (Next Sprint)
1. **Code duplication** - Extract shared logic
2. **Complex components** - Break down >300 lines
3. **Missing tests** - Critical paths
4. **Tech debt** - Outdated patterns

### Low Priority (Backlog)
1. **Code style** - Formatting issues
2. **Documentation** - Internal docs
3. **Nice-to-have features** - UI enhancements
4. **Minor optimizations** - Micro-optimizations

## Refactoring Workflow

### Step 1: Identify
```bash
# Find large files
find src -name "*.tsx" -type f -exec wc -l {} + | sort -rn | head -20

# Find complex functions
grep -r "function.*{" src/ | awk '{print NF}' | sort -rn | head -20

# Find duplicates
npx jscpd src/
```

### Step 2: Plan
- Identify dependencies
- Create feature flag if needed
- Write tests first
- Document breaking changes

### Step 3: Execute
```typescript
// 1. Create feature flag
const useNewImplementation = process.env.VITE_USE_NEW_IMPL === 'true';

// 2. Parallel implementation
if (useNewImplementation) {
  return <NewComponent />;
} else {
  return <OldComponent />;
}

// 3. Gradual rollout
// 4. Remove old code
```

### Step 4: Validate
- Run all tests
- Check performance metrics
- Monitor error rates
- Gather user feedback

## Code Review Tools Configuration

### ESLint Rules
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-console': 'error',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --findRelatedTests"
    ]
  }
}
```