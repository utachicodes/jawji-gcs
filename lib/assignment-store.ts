import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AssignmentStatus = "planned" | "in_progress" | "completed" | "cancelled"

export interface Assignment {
  id: string
  missionId: string
  droneId: string
  scheduledAt?: string
  status: AssignmentStatus
  notes?: string
}

interface AssignmentStore {
  assignments: Assignment[]
  addAssignment: (a: Omit<Assignment, "id" | "status"> & { status?: AssignmentStatus }) => Assignment
  updateAssignment: (id: string, patch: Partial<Assignment>) => void
  removeAssignment: (id: string) => void
  clearAssignments: () => void
}

export const useAssignmentStore = create<AssignmentStore>()(
  persist(
    (set, get) => ({
      assignments: [],
      addAssignment: (a) => {
        const assignment: Assignment = {
          id: Date.now().toString(),
          status: a.status ?? "planned",
          ...a,
        }
        set((s) => ({ assignments: [...s.assignments, assignment] }))
        return assignment
      },
      updateAssignment: (id, patch) =>
        set((s) => ({ assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeAssignment: (id) => set((s) => ({ assignments: s.assignments.filter((x) => x.id !== id) })),
      clearAssignments: () => set({ assignments: [] }),
    }),
    { name: "jawji-assignments" }
  )
)
