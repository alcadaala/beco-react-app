import { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(() => {
        const cached = localStorage.getItem('beco_current_user');
        return cached ? JSON.parse(cached) : null;
    });
    // If we have a cached profile, don't block with a spinner (Optimistic UI)
    const [loading, setLoading] = useState(() => !localStorage.getItem('beco_current_user'));

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Fetch user profile from Firestore
                await fetchProfile(firebaseUser.uid);
            } else {
                setUser(null);
                setProfile(null);
                localStorage.removeItem('beco_current_user');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper: Fetch Profile from Firestore
    const fetchProfile = async (userId, retries = 3) => {
        try {
            const profileRef = doc(db, 'profiles', userId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const profileData = { id: profileSnap.id, ...profileSnap.data() };
                setProfile(profileData);
                localStorage.setItem('beco_current_user', JSON.stringify(profileData));
            } else if (retries > 0) {
                // Profile not created yet, wait and retry
                console.log(`Profile not found, retrying... (${retries})`);
                await new Promise(r => setTimeout(r, 500));
                return fetchProfile(userId, retries - 1);
            } else {
                console.error('Profile not found after retries');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const value = {
        user,
        profile,
        role: profile?.role,
        loading,
        signIn: async (email, password) => {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);

                // Fetch profile
                await fetchProfile(userCredential.user.uid);

                return { data: userCredential, error: null };
            } catch (error) {
                console.error('Sign in error:', error);
                return { data: null, error };
            }
        },
        signUp: async (email, password, metadata) => {
            try {
                // Create user account
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Create profile document in Firestore
                const profileData = {
                    id: userCredential.user.uid,
                    email: email,
                    full_name: metadata.full_name || '',
                    phone: metadata.phone || '',
                    zone: metadata.zone || '',
                    branch_id: metadata.branch_id || '',
                    branch: metadata.branch || metadata.branch_name || '', // Save Name
                    branch_name: metadata.branch_name || metadata.branch || '',
                    role: metadata.role || 'Collector',
                    status: 'Active', // Auto-approve
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                };

                await setDoc(doc(db, 'profiles', userCredential.user.uid), profileData);

                return { data: userCredential, error: null };
            } catch (error) {
                console.error('Sign up error:', error);
                return { data: null, error };
            }
        },
        signOut: async () => {
            try {
                localStorage.removeItem('beco_current_user');
                await firebaseSignOut(auth);
            } catch (error) {
                console.error('Sign out error:', error);
            }
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
