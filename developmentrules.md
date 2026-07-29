# IP Sports OS - Development Rules

## 1. General Principles

- Build production-ready code.
- Prioritise maintainability over shortcuts.
- Never sacrifice security for convenience.
- Every feature must be scalable.
- Keep code clean, readable, and well documented.
- Follow the specifications exactly unless instructed otherwise.

---

## 2. Architecture

- Use feature-based architecture.
- Keep the platform sport-agnostic.
- Never hardcode football-specific logic into core models.
- Separate public and private functionality.
- Prefer reusable components over duplication.
- Follow SOLID principles where practical.

---

## 3. Technology Stack

- Next.js App Router
- React
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Vercel

Do not introduce additional frameworks without approval.

---

## 4. Code Quality

- No `any` types unless absolutely unavoidable.
- Use interfaces or types for all data models.
- Prefer server components where appropriate.
- Keep components small and focused.
- Avoid files larger than ~300 lines where practical.
- Avoid deeply nested logic.
- Remove unused imports and dead code.

---

## 5. UI Standards

- Mobile-first.
- Responsive on all screen sizes.
- Use design tokens.
- Maintain consistent spacing.
- Use accessible colour contrast.
- Loading states everywhere.
- Empty states everywhere.
- Error states everywhere.
- Skeleton loaders where appropriate.

---

## 6. Multi-Tenancy

- Every tenant-owned record must contain `organization_id`.
- Never expose one club's data to another.
- Enforce tenant isolation in the database using Row Level Security.
- Never rely solely on frontend permission checks.

---

## 7. Authentication & Security

- Authentication via Supabase Auth.
- Always validate permissions on the server.
- Never trust client-side input.
- Never expose service role keys.
- Never hardcode secrets.
- Use environment variables.
- Log sensitive administrative actions.

---

## 8. Database

- Use migrations only.
- Never modify production tables manually.
- Use foreign keys.
- Use indexes where appropriate.
- Soft-delete where specified.
- Timestamp all major entities.
- Use UUID primary keys.

---

## 9. Public Website

Public users may only see:
- Published content
- Approved player information
- Fixtures
- Results
- League tables
- Club pages
- Public news

Never expose portal data.

---

## 10. Club Portal

Portal users manage:
- Teams
- Athletes
- Fixtures
- Website content
- Analytics
- Club settings

Everything must respect permissions.

---

## 11. Analytics

- Analytics definitions are reusable.
- Widgets use analytics definitions.
- Dashboards use widgets.
- Never hardcode chart logic into UI.
- Keep analytics independent of presentation.

---

## 12. AI Features

AI must:
- Recommend
- Predict
- Explain

AI must never:
- Modify data automatically
- Publish content
- Change permissions

Human approval is always required.

---

## 13. Git

- Small commits.
- Descriptive commit messages.
- Keep branches focused.
- Never commit secrets.
- Never commit `.env`.

---

## 14. Documentation

After every completed task update:
- README.md
- PROJECT_STATUS.md
- CHANGELOG.md
- NEXT-STEPS.md

---

## 15. Performance

- Lazy-load heavy pages.
- Optimise database queries.
- Paginate large datasets.
- Cache read-heavy pages where appropriate.
- Optimise images.

---

## 16. Accessibility

- Keyboard navigation.
- Semantic HTML.
- ARIA labels where needed.
- Proper heading hierarchy.
- Screen-reader friendly.

---

## 17. Error Handling

Never leave silent failures.

Provide:
- User-friendly error messages.
- Logging.
- Retry where appropriate.
- Graceful fallbacks.

---

## 18. Testing

Every major feature should include:
- Unit tests where appropriate.
- Integration tests where appropriate.
- Manual verification steps.

---

## 19. Sprint Workflow

Always:
1. Read PROJECT_STATUS.md.
2. Read NEXT-STEPS.md.
3. Implement the next highest-priority task.
4. Update documentation.
5. Continue until blocked or context is exhausted.

---

## 20. Definition of Done

A task is complete only when:
- Code compiles.
- No TypeScript errors.
- No lint errors.
- UI is responsive.
- Documentation is updated.
- Database migrations are included if required.
- Security has been considered.

## Product Vision

Every feature should be designed for reuse across multiple sports and organisations.

When making implementation decisions:
1. Avoid sport-specific assumptions.
2. Avoid organisation-specific assumptions.
3. Prefer configuration over hardcoding.
4. Design for future expansion rather than one-off solutions.