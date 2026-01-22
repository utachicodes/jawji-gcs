import {
    doc,
    deleteDoc,
    setDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "./firebase";
import { User as FirebaseUser } from "firebase/auth";

export interface Organization {
    id: string;
    name: string;
    ownerId: string;
    createdAt: number;
    members: Member[];
}

export interface Member {
    email: string;
    role: "admin" | "pilot" | "observer";
    joinedAt: number;
    uid?: string; // Optional: link to firebase auth uid if they have signed up
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    orgId?: string; // Link to their organization
}

// Create a new Organization
export const createOrganization = async (name: string, user: FirebaseUser) => {
    try {
        const orgId = `org_${crypto.randomUUID().split("-")[0]}`;
        const orgRef = doc(db, "organizations", orgId);

        const newOrg: Organization = {
            id: orgId,
            name,
            ownerId: user.uid,
            createdAt: Date.now(),
            members: [{
                email: user.email!,
                role: "admin",
                joinedAt: Date.now(),
                uid: user.uid
            }]
        };

        await setDoc(orgRef, newOrg);

        // Update user profile with orgId
        await updateUserProfile(user, { orgId });

        return newOrg;
    } catch (error) {
        console.error("Error creating organization:", error);
        throw error;
    }
};

// Get Organization by ID
export const getOrganization = async (orgId: string): Promise<Organization | null> => {
    try {
        const orgRef = doc(db, "organizations", orgId);
        const snap = await getDoc(orgRef);
        return snap.exists() ? (snap.data() as Organization) : null;
    } catch (error) {
        console.error("Error fetching organization:", error);
        throw error;
    }
};

// Add Member to Organization
export const addMemberToOrganization = async (orgId: string, email: string, role: Member["role"] = "observer") => {
    try {
        const orgRef = doc(db, "organizations", orgId);
        const newMember: Member = {
            email,
            role,
            joinedAt: Date.now()
        };

        await updateDoc(orgRef, {
            members: arrayUnion(newMember)
        });

    } catch (error) {
        console.error("Error adding member:", error);
        throw error;
    }
};

// Update User Profile
export const updateUserProfile = async (user: FirebaseUser, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || "User",
            photoURL: user.photoURL,
            ...data
        }, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
    }
};

// Get User Profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

// --- Drones ---

export interface DroneData {
    id: string;
    orgId: string;
    name: string;
    model: string;
    status: "online" | "offline" | "flying" | "error";
    connectionUrl?: string; // e.g. "ws://192.168.1.100:8000"
    lastSeen: number;
}

export const addDrone = async (drone: Omit<DroneData, "id" | "orgId" | "lastSeen">, user: FirebaseUser) => {
    try {
        // Ensure user has an org
        const profile = await getUserProfile(user.uid);
        if (!profile?.orgId) throw new Error("User must belong to an organization to add drones.");

        const droneRef = doc(collection(db, "drones"));
        const newDrone: DroneData = {
            ...drone,
            id: droneRef.id,
            orgId: profile.orgId,
            lastSeen: Date.now()
        };

        await setDoc(droneRef, newDrone);
        return newDrone;
    } catch (error) {
        console.error("Error adding drone:", error);
        throw error;
    }
};

export const getDrones = async (orgId: string): Promise<DroneData[]> => {
    try {
        // Query drones where orgId == current org
        const q = query(collection(db, "drones"), where("orgId", "==", orgId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data() as DroneData);
    } catch (error) {
        console.error("Error fetching drones:", error);
        return [];
    }
};

// --- Missions ---

export interface MissionData {
    id: string;
    orgId: string;
    name: string;
    description: string;
    droneId?: string;
    createdAt: number;
    createdBy: string;
    status: "draft" | "pending" | "approved" | "completed" | "ready";
    data: any; // Full mission JSON (waypoints, parameters, etc.)
}

export const saveMission = async (mission: Omit<MissionData, "id" | "createdAt" | "orgId" | "createdBy">, user: FirebaseUser) => {
    try {
        const profile = await getUserProfile(user.uid);
        if (!profile?.orgId) throw new Error("User must belong to an organization to save missions.");

        const missionRef = doc(collection(db, "missions"));
        const newMission: MissionData = {
            ...mission,
            id: missionRef.id,
            orgId: profile.orgId,
            createdAt: Date.now(),
            createdBy: user.uid
        };

        await setDoc(missionRef, newMission);
        return newMission;
    } catch (error) {
        console.error("Error saving mission:", error);
        throw error;
    }
};
export const getMissions = async (orgId: string): Promise<MissionData[]> => {
    try {
        const q = query(collection(db, "missions"), where("orgId", "==", orgId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data() as MissionData);
    } catch (error) {
        console.error("Error fetching missions:", error);
        return [];
    }
};

export const deleteMission = async (missionId: string) => {
    try {
        await deleteDoc(doc(db, "missions", missionId));
    } catch (error) {
        console.error("Error deleting mission:", error);
        throw error;
    }
};

export const updateMission = async (missionId: string, updates: Partial<MissionData>) => {
    try {
        const ref = doc(db, "missions", missionId);
        await updateDoc(ref, updates);
    } catch (error) {
        console.error("Error updating mission:", error);
        throw error;
    }
};

// --- Drones (Update/Delete) ---

export const updateDrone = async (droneId: string, updates: Partial<DroneData>) => {
    try {
        const ref = doc(db, "drones", droneId);
        await updateDoc(ref, {
            ...updates,
            lastSeen: Date.now()
        });
    } catch (error) {
        console.error("Error updating drone:", error);
        throw error;
    }
};

export const deleteDrone = async (droneId: string) => {
    try {
        await deleteDoc(doc(db, "drones", droneId));
    } catch (error) {
        console.error("Error deleting drone:", error);
        throw error;
    }
};


// --- Logs (Analytics & Diagnostics) ---

export interface FlightLog {
    id: string;
    orgId: string;
    missionId?: string;
    droneId: string;
    startTime: number;
    endTime?: number;
    duration: number; // seconds
    distance: number; // meters
    status: "completed" | "aborted" | "failed";
    issues?: string[];
}

export const logFlight = async (log: Omit<FlightLog, "id">) => {
    try {
        const ref = doc(collection(db, "flight_logs"));
        await setDoc(ref, { ...log, id: ref.id });
    } catch (error) {
        console.error("Error logging flight:", error);
    }
};

export const getFlightLogs = async (orgId: string): Promise<FlightLog[]> => {
    try {
        const q = query(collection(db, "flight_logs"), where("orgId", "==", orgId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as FlightLog);
    } catch (error) {
        return [];
    }
};

export interface SystemLog {
    id: string;
    timestamp: number;
    level: "info" | "warning" | "error" | "critical";
    component: string;
    message: string;
    orgId: string;
}

export const logSystemEvent = async (event: Omit<SystemLog, "id" | "timestamp">) => {
    try {
        const ref = doc(collection(db, "system_logs"));
        await setDoc(ref, {
            ...event,
            id: ref.id,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("Error logging system event:", error);
    }
};

export const getSystemLogs = async (orgId: string, limitCount = 100): Promise<SystemLog[]> => {
    try {
        // Note: Composite index may be required for complex queries
        const q = query(
            collection(db, "system_logs"),
            where("orgId", "==", orgId)
        );
        const snap = await getDocs(q);
        // Sort in memory to avoid index requirement for now if dataset small, or add index
        return snap.docs
            .map(d => d.data() as SystemLog)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limitCount);
    } catch (error) {
        return [];
    }
};
