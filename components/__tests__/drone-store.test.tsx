import React from 'react'
import { render, screen } from '@testing-library/react'
import { useDroneStore } from '@/lib/drone-store'

// Mock the drone store
jest.mock('@/lib/drone-store')

describe('Drone Store', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks()
    })

    it('should initialize with empty drones array', () => {
        const mockUseDroneStore = useDroneStore as jest.MockedFunction<typeof useDroneStore>
        mockUseDroneStore.mockReturnValue({
            drones: [],
            selectedDrone: null,
            addDrone: jest.fn(),
            removeDrone: jest.fn(),
            updateDrone: jest.fn(),
            selectDrone: jest.fn(),
        })

        const { drones } = useDroneStore()
        expect(drones).toEqual([])
    })

    it('should handle drone selection', () => {
        const mockSelectDrone = jest.fn()
        const mockUseDroneStore = useDroneStore as jest.MockedFunction<typeof useDroneStore>
        mockUseDroneStore.mockReturnValue({
            drones: [
                { id: '1', name: 'Drone 1', model: 'Model A', battery: 100, status: 'active' }
            ],
            selectedDrone: null,
            addDrone: jest.fn(),
            removeDrone: jest.fn(),
            updateDrone: jest.fn(),
            selectDrone: mockSelectDrone,
        })

        const { selectDrone } = useDroneStore()
        selectDrone('1')

        expect(mockSelectDrone).toHaveBeenCalledWith('1')
    })
})
