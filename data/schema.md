
```md
<!-- data/schema.md -->
# sense schema (v1)

## Persisted
### settings
- sound: `spatial | mono`
- pulse: `low | normal | high`
- light: `off | low`
- hand: `none | stick | light | glove`
- foot: `none | shoes | leather | heel | zori`

### owned
- hand: `["stick","light","glove"]`
- foot: `["shoes","leather","heel","zori"]`

## Runtime (not persisted)
- lastInputAt: number (ms)
- idleMs: number (ms)
