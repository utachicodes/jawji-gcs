import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TeamMember = {
    id: string
    name: string
    email: string
    role: 'admin' | 'pilot' | 'observer'
    status: 'active' | 'pending' | 'inactive'
    avatar?: string
}

export type Organization = {
    id: string
    name: string
    domain: string
    plan: 'free' | 'pro' | 'enterprise'
    members: TeamMember[]
}

interface OrgState {
    organization: Organization | null
    registerOrganization: (name: string, domain: string) => void
    addMember: (member: Omit<TeamMember, 'id' | 'status'>) => void
    removeMember: (memberId: string) => void
    updateMemberRole: (memberId: string, role: TeamMember['role']) => void
}

export const useOrgStore = create<OrgState>()(
    persist(
        (set) => ({
            organization: null,
            registerOrganization: (name, domain) =>
                set({
                    organization: {
                        id: crypto.randomUUID(),
                        name,
                        domain,
                        plan: 'free',
                        members: [
                            {
                                id: crypto.randomUUID(),
                                name: 'Operator', // Should check auth store, simpler for now
                                email: 'operator@jawji.com',
                                role: 'admin',
                                status: 'active',
                            },
                        ],
                    },
                }),
            addMember: (member) =>
                set((state) => {
                    if (!state.organization) return state
                    return {
                        organization: {
                            ...state.organization,
                            members: [
                                ...state.organization.members,
                                { ...member, id: crypto.randomUUID(), status: 'active' },
                            ],
                        },
                    }
                }),
            removeMember: (memberId) =>
                set((state) => {
                    if (!state.organization) return state
                    return {
                        organization: {
                            ...state.organization,
                            members: state.organization.members.filter((m) => m.id !== memberId),
                        },
                    }
                }),
            updateMemberRole: (memberId, role) =>
                set((state) => {
                    if (!state.organization) return state
                    return {
                        organization: {
                            ...state.organization,
                            members: state.organization.members.map((m) =>
                                m.id === memberId ? { ...m, role } : m
                            ),
                        },
                    }
                }),
        }),
        {
            name: 'jawji-org-storage',
        }
    )
)
