# 🤝 Contributing to MedChainID

Thank you for your interest in contributing to MedChainID! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### 1. Fork the Repository

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/SSAY.git
cd SSAY
```

### 2. Set Up Development Environment

```bash
# Run the setup script
# On Linux/macOS:
chmod +x setup.sh
./setup.sh

# On Windows:
setup.bat
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/bug-description
```

---

## How to Contribute

### Types of Contributions

1. **Bug Reports**
   - Use GitHub Issues
   - Include detailed description
   - Provide steps to reproduce
   - Include screenshots if applicable

2. **Feature Requests**
   - Describe the feature
   - Explain use case
   - Discuss implementation approach

3. **Code Contributions**
   - Bug fixes
   - New features
   - Performance improvements
   - Documentation updates

4. **Documentation**
   - Fix typos or unclear sections
   - Add examples
   - Improve API documentation
   - Write tutorials

---

## Development Workflow

### 1. Before Starting

- Check existing issues and PRs
- Discuss major changes in an issue first
- Ensure your fork is up to date

```bash
# Add upstream remote
git remote add upstream https://github.com/Aditya-Patil27/SSAY.git

# Sync your fork
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. During Development

- Write tests for new features
- Update documentation
- Follow coding standards
- Test locally before committing

### 3. Testing Your Changes

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Smart contract tests
cd aptos-contract
aptos move test

# ML engine tests
cd ml-engine
python -m pytest
```

---

## Coding Standards

### JavaScript/TypeScript

- Use ESLint configuration provided
- 2 spaces for indentation
- Use `const` and `let`, avoid `var`
- Prefer arrow functions
- Add JSDoc comments for functions
- Use meaningful variable names

**Example:**
```javascript
/**
 * Encrypts a file buffer using AES-256-CBC
 * 
 * @param {Buffer} buffer - Raw file buffer to encrypt
 * @returns {Buffer} - Encrypted buffer with IV prepended
 * @throws {Error} - If encryption fails
 */
function encryptBuffer(buffer) {
  // Implementation
}
```

### Python

- Follow PEP 8 style guide
- 4 spaces for indentation
- Type hints for function signatures
- Docstrings for all functions
- Use meaningful variable names

**Example:**
```python
def verify_document_with_ai(file_bytes: bytes, record_type: str) -> dict:
    """
    Verifies document authenticity using Gemini AI.
    
    Args:
        file_bytes: Raw file content as bytes
        record_type: Type of medical record
        
    Returns:
        Dictionary with verification results
        
    Raises:
        ValueError: If file_bytes is empty
    """
    # Implementation
```

### Move (Smart Contracts)

- Follow Aptos Move style guide
- Clear function documentation
- Comprehensive error codes
- Test all entry functions

**Example:**
```move
/// Mints a new medical record token
/// 
/// # Parameters
/// * `account` - Issuer's signer reference
/// * `patient_address` - Patient's wallet address
/// * `record_type` - Type of medical record
/// * `document_hash` - SHA-256 hash of document
/// * `ipfs_cid` - IPFS Content Identifier
public entry fun mint_token(
    account: &signer,
    patient_address: address,
    record_type: vector<u8>,
    document_hash: vector<u8>,
    ipfs_cid: vector<u8>
) {
    // Implementation
}
```

---

## Testing Guidelines

### Backend Tests

```javascript
// Use Jest for testing
describe('Upload Endpoint', () => {
  it('should upload and encrypt document successfully', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('document', 'test-file.pdf')
      .field('recordType', 'Lab Report');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.docHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });
});
```

### Smart Contract Tests

```move
#[test(account = @medchain)]
public fun test_mint_token(account: &signer) {
    initialize(account);
    
    let patient = @0x123;
    mint_token(
        account,
        patient,
        b"Lab Report",
        b"0xabc123...",
        b"QmXyZ..."
    );
    
    let tokens = get_all_tokens(signer::address_of(account));
    assert!(vector::length(&tokens) == 1, 0);
}
```

### Test Coverage

- Aim for >80% code coverage
- Test happy paths and error cases
- Test edge cases and boundary conditions
- Test with different input types

---

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

**Good:**
```
feat(backend): add input sanitization for upload endpoint

- Add CID format validation
- Sanitize recordType to prevent XSS
- Add regex validation for IPFS CIDs

Closes #123
```

**Good:**
```
fix(frontend): resolve wallet connection issue

Fix race condition where wallet was not properly initialized
before attempting to mint tokens.

Fixes #456
```

**Bad:**
```
update stuff
```

---

## Pull Request Process

### 1. Prepare Your PR

- Ensure all tests pass
- Update documentation
- Add/update tests for your changes
- Follow commit message guidelines
- Rebase on latest main branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Create Pull Request

- Use a descriptive title
- Reference related issues
- Provide detailed description
- Include screenshots/videos if applicable
- List breaking changes (if any)

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
Describe testing performed

## Screenshots (if applicable)
Add screenshots

## Related Issues
Closes #123
```

### 3. Code Review

- Address review comments promptly
- Be open to feedback
- Make requested changes
- Push updates to your branch

### 4. Merge

- Squash commits if requested
- Ensure CI/CD passes
- Wait for maintainer approval
- PR will be merged by maintainers

---

## Component-Specific Guidelines

### Backend (Node.js)

- Use async/await over callbacks
- Handle errors properly
- Add request logging
- Validate all inputs
- Use environment variables for configuration

### Frontend (React)

- Use functional components with hooks
- Follow component structure
- Use TypeScript types
- Keep components small and focused
- Use meaningful prop names

### Smart Contracts (Move)

- Test all entry functions
- Document all error codes
- Use events for important state changes
- Consider gas costs
- Security audit for critical functions

### ML Engine (Python)

- Validate all inputs
- Handle API errors gracefully
- Log predictions and confidence scores
- Consider performance and latency
- Document model behavior

---

## Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `question`: Further information requested
- `wontfix`: This will not be worked on

---

## Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Mentioned in release notes
- Acknowledged in commit messages

---

## Questions?

- Open an issue for discussion
- Join our community chat (link TBD)
- Email: your-email@example.com

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MedChainID! 🏥💙
