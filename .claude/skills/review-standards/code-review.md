# code-review.md

## Priority Framework

| Priority | Focus |
|----------|-------|
| **Critical** | Security, data loss, resource leaks, breaking changes, thread safety |
| **High** | Error handling, performance, validation, business logic |
| **Medium** | Clarity, naming, duplication, test quality |
| **Low** | Style, simplification, documentation |

## Code Review Checklist

### Implementation Alignment
- [ ] Implementation matches the plan (no undisclosed deviations)
- [ ] Implementation matches stated approach (say/do alignment)
- [ ] All acceptance criteria are met

### Security
- [ ] No security vulnerabilities
- [ ] Input validation present
- [ ] No hardcoded credentials

### Quality
- [ ] Error handling is complete
- [ ] Performance is acceptable
- [ ] Code is readable and maintainable
