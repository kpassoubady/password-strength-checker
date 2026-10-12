# commit-standards/examples.md

## Good Examples

```
DEF0799890: modify schedule reusability logic

- Changed reusability filtering: inactive schedules with configuration are now excluded
- Active schedules are now prioritized when assigning IPs and subnets
- Added comprehensive tests for reusability scenarios
```

**Why this is good**:
- High-level, describes WHAT and WHY
- No technical implementation details
- Focuses on business logic changes

```
MAINT: standardize workbook naming and add new transition packages

- Canonicalized adjudication sheet naming to avoid colliding with the paper repo's terminology
- Added the shared normalization tool and retrofitted existing workbooks
```

**Why this is good**:
- Uses `MAINT` because the work isn't tied to a task/defect number — none was invented
- Same high-level WHAT/WHY style as a numbered commit

## Bad Examples

```
DEF0799890: modify schedule reusability logic

- Added encoded query to filter non-reusable schedules
- Added orderByDesc('active') to prioritize active schedules
- Added 26 new tests for location-based scenarios
```

**Why this is bad**:
- Implementation details (encoded query, orderByDesc)
- Technical specifics that belong in code
- Line counts don't belong in commit messages
