# Firebase Migration Plan - Supabase to Firebase

## Phase 1: Setup ✅
- [x] Install Firebase package
- [x] Create Firebase config file
- [ ] Set up Firebase project credentials in .env
- [ ] Test Firebase connection

## Phase 2: Authentication Migration
**Files to Update:**
1. `src/context/AuthContext.jsx` - Replace Supabase Auth with Firebase Auth
2. `src/features/auth/Login.jsx` - Update login logic
3. `src/features/auth/Signup.jsx` - Update signup logic

**Changes:**
- `supabase.auth.signInWithPassword()` → `signInWithEmailAndPassword()`
- `supabase.auth.signUp()` → `createUserWithEmailAndPassword()`
- `onAuthStateChange` → `onAuthStateChanged()`

## Phase 3: Database Migration (Firestore)
**Collections to Create:**
- `profiles` - User profiles
- `branches` - Branch data
- `activities` - Activity logs
- `hospitals` - Hospital data
- `subscriptions` - Subscription data

**Files to Update:**
- All files using `supabase.from()` queries
- Replace with Firestore `collection()`, `doc()`, `getDocs()`, etc.

## Phase 4: Component Updates
**Files with Supabase Usage (20+ files):**
1. AuthContext.jsx
2. Login.jsx
3. Signup.jsx
4. Dashboard.jsx (Collector)
5. Dashboard.jsx (SuperAdmin)
6. Baafiye.jsx
7. Balan.jsx
8. Billing.jsx
9. DataBundles.jsx
10. HospitalDiscounts.jsx
11. InvoiceGenerator.jsx
12. Services.jsx
13. Tasks.jsx
14. UserApprovals.jsx
15. Branches.jsx
16. Reports.jsx
17. Hospitals.jsx
18. DataAdmin.jsx
19. Subscriptions.jsx

## Phase 5: Data Migration
- Export existing Supabase data
- Transform to Firestore format
- Import to Firebase

## Phase 6: Testing
- Test authentication flow
- Test all CRUD operations
- Test real-time features
- Performance testing

## Environment Variables Needed
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Next Steps
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Get your Firebase config values
5. Add them to .env file
