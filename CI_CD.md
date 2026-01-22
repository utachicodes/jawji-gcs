# CI/CD Pipeline & Testing Setup

This project uses GitHub Actions for continuous integration and deployment.

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Located in `__tests__` directories next to components
- **Coverage Threshold**: 50% for branches, functions, lines, and statements
- **Test Framework**: Jest with React Testing Library

## 🚀 CI/CD Workflows

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches:

1. **Testing Matrix**: Tests on Node 18.x and 20.x
2. **Linting**: ESLint checks
3. **Type Checking**: TypeScript compilation check
4. **Unit Tests**: Jest with coverage reporting
5. **Build**: Next.js production build

### Deployment Workflow (`.github/workflows/deploy.yml`)

Runs on push to `main` branch:

1. **Build**: Production Next.js build
2. **Deploy**: Automatic deployment to Vercel

## 🔒 Required Secrets

Configure these in GitHub repository settings:

### Firebase Configuration
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Vercel Deployment
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 📊 Code Coverage

Coverage reports are automatically:
- Generated on every CI run
- Uploaded to Codecov
- Available in the Actions tab

## 🔄 Workflow Status

Check the status of workflows:
- **CI**: [![CI](https://github.com/YOUR_USERNAME/jawji-gcs/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/jawji-gcs/actions/workflows/ci.yml)
- **Deploy**: [![Deploy](https://github.com/YOUR_USERNAME/jawji-gcs/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/jawji-gcs/actions/workflows/deploy.yml)

## 🛠️ Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Build for production:
   ```bash
   npm run build
   ```
