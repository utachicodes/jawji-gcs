import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "./firebase";
import { useState, useEffect } from "react";

// Sign in with Google
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

// Sign in with GitHub
export const loginWithGithub = async () => {
    try {
        const result = await signInWithPopup(auth, githubProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with GitHub", error);
        throw error;
    }
};

// Logout
export const logout = async () => {
    try {
        await signOut(auth);
        // Clear legacy local storage if needed
        if (typeof window !== "undefined") {
            localStorage.removeItem("jawji_auth_token");
            localStorage.removeItem("jawji_user");
        }
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
};

// Hook for Auth State
export function useFirebaseAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);

            // Sync with localStorage for legacy compatibility until full migration
            if (user) {
                localStorage.setItem("jawji_auth_token", await user.getIdToken());
                localStorage.setItem("jawji_user", JSON.stringify({
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL
                }));
            } else {
                localStorage.removeItem("jawji_auth_token");
                localStorage.removeItem("jawji_user");
            }
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
}
