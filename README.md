# Strategos — OneArete

A personal development application combining practical philosophy, deliberate action and evidence-informed health education. The frozen decision cycle remains: signals → understanding → independent advisors → Agora → judgement → explanation → human choice → practice → reflection → learning.

## Current healthspan increment

- Six educational domains: movement, nutrition, sleep, mental wellbeing, relationships and functional autonomy.
- Primary institutional sources and explicit clinical boundaries.
- Each existing practice has a separate philosophical rationale, purpose and limits, available on demand.
- Unanswered daily questions remain unanswered when saved and reloaded. Presentation defaults never become newly reported evidence.
- Recommendations and alternatives fit the declared time budget. Phase timers sum to the planned duration exactly.
- Declared significant soreness excludes strength loading; acknowledging a warning does not override an exclusion. These are limited product constraints, not clinical clearance.
- Optional movement preferences require an explicit save action. They are local, editable and removable; exports include them and import preview discloses this. Previous decision explanations remain in history.
- Current movement preferences are checked again before choice and execution, including when an older judgement is reopened.
- The single daily primary action remains central.

This increment does not provide personalized supplement plans, prescriptions, diagnoses, biological age estimates or lifespan predictions. Previously stored records may already contain defaults from older versions; missing answers cannot be reconstructed retrospectively.

## Run and validate

Node 24 and Python 3 are used by the checks.

```sh
npm ci
npm run dev
npm test
npm run test:invariants
npx playwright install --with-deps webkit
npm run test:browser
```

GitHub Actions runs three independent gates on every pull request: runtime syntax, architecture invariants, and WebKit with an iPhone viewport. The browser test covers onboarding, educational content, interruption and reload during check-in, deliberation, practice rationale and return continuity. It is browser emulation, not a physical-device test.

## Next increments

1. Audit the remaining practice and safety boundaries, including time budgets and explicit limitations.
2. Extend the optional movement context to further health domains only when a reviewed pathway needs the information.
3. Add evidence-reviewed movement, sleep and nutrition pathways through the existing decision architecture.
4. Add a supplement evidence catalogue with population, outcome, uncertainty and interaction requirements.
5. Validate longitudinal usefulness and adverse effects before broadening recommendations.
