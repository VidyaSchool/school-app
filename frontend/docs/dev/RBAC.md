# Role-Based Authentication System

## Overview
Secure role-based authentication with 4 roles: **student**, **teacher**, **admin**, and **account**.

## Roles

- **student** - Default role, access to student portal
- **teacher** - Access to teacher portal and class management
- **admin** - Full access to all portals and admin features
- **account** - Access to accounting/finance features

## Security Features

✅ Middleware protection on all routes
✅ Server-side role validation
✅ Client-side role guards
✅ Session-based authentication
✅ Automatic redirect for unauthorized access
✅ Role stored in database with enum type

## Usage

### Server Components (Recommended)

```tsx
import { requireAuth, requireRole } from '@/lib/auth-helpers'

// Require authentication
export default async function Page() {
  const user = await requireAuth() // Redirects to /login if not authenticated
  return <div>Hello {user.name}</div>
}

// Require specific role
export default async function TeacherPage() {
  const user = await requireRole('teacher') // Redirects to /unauthorized if wrong role
  return <div>Teacher Dashboard</div>
}

// Multiple roles
export default async function AdminPage() {
  const user = await requireRole(['admin', 'account'])
  return <div>Admin/Account Dashboard</div>
}
```

### Client Components

```tsx
'use client'
import { useRequireAuth, useRequireRole, useCheckRole } from '@/lib/auth-hooks'
import { RoleGuard } from '@/components/role-guard'

// Require authentication
function MyComponent() {
  const { user, isPending } = useRequireAuth()
  
  if (isPending) return <div>Loading...</div>
  return <div>Hello {user?.name}</div>
}

// Require specific role
function TeacherComponent() {
  const { user, isPending } = useRequireRole('teacher')
  
  if (isPending) return <div>Loading...</div>
  return <div>Teacher Content</div>
}

// Conditional rendering
function ConditionalComponent() {
  const isTeacher = useCheckRole('teacher')
  const isAdmin = useCheckRole(['admin', 'teacher'])
  
  return (
    <div>
      {isTeacher && <div>Teacher Only Content</div>}
      {isAdmin && <div>Admin/Teacher Content</div>}
    </div>
  )
}

// Using RoleGuard component
function GuardedComponent() {
  return (
    <RoleGuard allowedRoles={['admin', 'teacher']} fallback={<div>No access</div>}>
      <div>Protected Content</div>
    </RoleGuard>
  )
}
```

### Middleware Protection

Routes are automatically protected:

- `/student/*` - Accessible by student and admin
- `/teacher/*` - Accessible by teacher and admin
- `/admin/*` - Accessible by admin only
- `/account/*` - Accessible by account and admin

To modify route protection, edit `middleware.ts`:

```ts
const roleRoutes = {
  '/student': ['student', 'admin'],
  '/teacher': ['teacher', 'admin'],
  '/admin': ['admin'],
  '/account': ['account', 'admin'],
}
```

## Changing User Role

### Via Database
Update user role directly in Neon dashboard:

```sql
UPDATE "user" SET role = 'teacher' WHERE email = 'user@example.com';
```

### Via Admin Panel (Future)
Create an admin panel with role management UI.

## Testing

1. Create a new user via `/signup` (defaults to 'student' role)
2. Update role in database
3. Test access to different portals
4. Verify unauthorized redirects work

## API Routes

Auth endpoints are protected by default:
- `/api/auth/*` - Public (authentication endpoints)
- `/api/student/*` - Student + Admin only
- `/api/teacher/*` - Teacher + Admin only
- `/api/admin/*` - Admin only

## Security Best Practices

✅ Never trust client-side role checks alone - always validate on server
✅ Use server components for sensitive data
✅ Middleware runs on every request
✅ Sessions are validated on each protected route
✅ Role is stored securely in database with PostgreSQL enum
✅ Automatic CSRF protection via better-auth
✅ Secure session tokens
✅ Password hashing built-in

## Files

- `lib/schema.ts` - Database schema with role enum
- `lib/auth.ts` - Auth configuration with role field
- `lib/auth-helpers.ts` - Server-side auth utilities
- `lib/auth-hooks.ts` - Client-side auth hooks
- `middleware.ts` - Route protection middleware
- `components/role-guard.tsx` - Client component guard
- `app/unauthorized/page.tsx` - 403 error page
