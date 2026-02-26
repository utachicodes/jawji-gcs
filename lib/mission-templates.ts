import { z } from "zod"
import type { MissionType, MissionPackage, DeliveryDetails, SurveyDetails, InspectionDetails } from "./mission-store"

// Validation schemas for each mission type
export const deliveryDetailsSchema = z.object({
    pickupLocation: z.object({
        lat: z.number(),
        lng: z.number(),
        kioskId: z.string().optional(),
    }),
    dropoffLocation: z.object({
        lat: z.number(),
        lng: z.number(),
        kioskId: z.string().optional(),
    }),
    payload: z.object({
        weight: z.number().positive().max(25, "Maximum payload weight is 25kg"),
        dimensions: z.object({
            length: z.number().positive(),
            width: z.number().positive(),
            height: z.number().positive(),
        }).optional(),
        fragile: z.boolean().optional(),
        description: z.string().optional(),
    }),
    dropParameters: z.object({
        altitude: z.number().min(2).max(10),
        dropMethod: z.enum(["winch", "land", "release"]),
        confirmationRequired: z.boolean(),
    }),
})

export const surveyDetailsSchema = z.object({
    coverageArea: z.string().min(1, "Coverage area is required"),
    altitude: z.number().min(20).max(150, "Survey altitude must be between 20-150m"),
    overlapPercentage: z.number().min(30).max(90, "Overlap should be 30-90%"),
    scanPattern: z.enum(["grid", "circular", "custom"]),
    captureInterval: z.number().positive().optional(),
})

export const inspectionDetailsSchema = z.object({
    inspectionPoints: z.array(
        z.object({
            lat: z.number(),
            lng: z.number(),
            altitude: z.number(),
            hoverDuration: z.number().min(0).max(60),
        })
    ).min(1, "At least one inspection point is required"),
    cameraSettings: z.object({
        zoom: z.number().min(1).max(10),
        gimbalPitch: z.number().min(-90).max(30),
        captureMode: z.enum(["photo", "video", "both"]),
    }),
})

// Mission template definitions
export interface MissionTemplate {
    type: MissionType
    name: string
    description: string
    icon: string
    defaultFields: Partial<DeliveryDetails | SurveyDetails | InspectionDetails>
    requiredFields: string[]
}

export const MISSION_TEMPLATES: Record<MissionType, MissionTemplate> = {
    delivery: {
        type: "delivery",
        name: "Delivery Mission",
        description: "Autonomous package delivery with pickup and drop-off points",
        icon: "package",
        defaultFields: {
            payload: {
                weight: 1,
                fragile: false,
            },
            dropParameters: {
                altitude: 5,
                dropMethod: "land",
                confirmationRequired: true,
            },
        } as Partial<DeliveryDetails>,
        requiredFields: ["pickupLocation", "dropoffLocation", "payload.weight"],
    },
    survey: {
        type: "survey",
        name: "Survey Mission",
        description: "Aerial survey with grid or custom coverage patterns",
        icon: "map",
        defaultFields: {
            altitude: 50,
            overlapPercentage: 70,
            scanPattern: "grid",
            captureInterval: 2,
        } as Partial<SurveyDetails>,
        requiredFields: ["coverageArea", "altitude", "overlapPercentage"],
    },
    inspection: {
        type: "inspection",
        name: "Inspection Mission",
        description: "Point-based inspection with camera control",
        icon: "camera",
        defaultFields: {
            inspectionPoints: [],
            cameraSettings: {
                zoom: 1,
                gimbalPitch: -45,
                captureMode: "photo",
            },
        } as Partial<InspectionDetails>,
        requiredFields: ["inspectionPoints", "cameraSettings"],
    },
    custom: {
        type: "custom",
        name: "Custom Mission",
        description: "Freeform mission planning with manual waypoint configuration",
        icon: "settings",
        defaultFields: {},
        requiredFields: [],
    },
}

export interface PackageDefinition {
    package: MissionPackage
    label: string
    description: string
    icon: string
}

export const MISSION_PACKAGES: Record<MissionType, PackageDefinition[]> = {
    delivery: [
        { package: "obstacle_avoidance", label: "Obstacle Avoidance", description: "Real-time obstacle detection and path re-routing", icon: "Shield" },
        { package: "payload_release", label: "Payload Release", description: "Precision drop/winch system for package delivery", icon: "Package" },
        { package: "drone_detection", label: "Drone Detection", description: "Airspace awareness – detect nearby UAVs", icon: "Radar" },
        { package: "live_streaming", label: "Live Streaming", description: "Real-time HD video feed during delivery", icon: "Video" },
    ],
    survey: [
        { package: "crop_detection", label: "Crop Detection", description: "NDVI and multispectral crop health analysis", icon: "Leaf" },
        { package: "photogrammetry", label: "Photogrammetry", description: "3D model and orthomosaic map generation", icon: "Map" },
        { package: "thermal_imaging", label: "Thermal Imaging", description: "Thermal camera integration for heat mapping", icon: "Thermometer" },
        { package: "obstacle_avoidance", label: "Obstacle Avoidance", description: "Safe low-altitude flight around terrain", icon: "Shield" },
        { package: "ai_tracking", label: "AI Tracking", description: "Machine learning object and movement detection", icon: "Cpu" },
    ],
    inspection: [
        { package: "drone_detection", label: "Drone Detection", description: "Detect unauthorized drones in inspection area", icon: "Radar" },
        { package: "thermal_imaging", label: "Thermal Imaging", description: "Identify heat signatures and anomalies", icon: "Thermometer" },
        { package: "obstacle_avoidance", label: "Obstacle Avoidance", description: "Navigate around structures safely", icon: "Shield" },
        { package: "rtk_precision", label: "RTK Precision", description: "Centimeter-level GPS accuracy for exact positioning", icon: "Target" },
        { package: "live_streaming", label: "Live Streaming", description: "Real-time video for remote inspection teams", icon: "Video" },
    ],
    custom: [
        { package: "obstacle_avoidance", label: "Obstacle Avoidance", description: "Real-time obstacle detection and path re-routing", icon: "Shield" },
        { package: "crop_detection", label: "Crop Detection", description: "NDVI and multispectral crop health analysis", icon: "Leaf" },
        { package: "drone_detection", label: "Drone Detection", description: "Airspace awareness – detect nearby UAVs", icon: "Radar" },
        { package: "thermal_imaging", label: "Thermal Imaging", description: "Thermal camera integration for heat mapping", icon: "Thermometer" },
        { package: "photogrammetry", label: "Photogrammetry", description: "3D model and orthomosaic map generation", icon: "Map" },
        { package: "payload_release", label: "Payload Release", description: "Precision drop/winch system for package delivery", icon: "Package" },
        { package: "rtk_precision", label: "RTK Precision", description: "Centimeter-level GPS accuracy for exact positioning", icon: "Target" },
        { package: "live_streaming", label: "Live Streaming", description: "Real-time HD video feed", icon: "Video" },
        { package: "ai_tracking", label: "AI Tracking", description: "Machine learning object and movement detection", icon: "Cpu" },
    ],
}

/**
 * Get template for a mission type
 */
export function getMissionTemplate(type: MissionType): MissionTemplate {
    return MISSION_TEMPLATES[type]
}

/**
 * Validate mission details based on type
 */
export function validateMissionDetails(
    type: MissionType,
    details: DeliveryDetails | SurveyDetails | InspectionDetails | undefined
): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
        switch (type) {
            case "delivery":
                if (details) deliveryDetailsSchema.parse(details)
                break
            case "survey":
                if (details) surveyDetailsSchema.parse(details)
                break
            case "inspection":
                if (details) inspectionDetailsSchema.parse(details)
                break
            case "custom":
                // No specific validation for custom missions
                break
        }
        return { valid: true, errors: [] }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                valid: false,
                errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
            }
        }
        return { valid: false, errors: ["Unknown validation error"] }
    }
}

/**
 * Generate default waypoints from mission template
 */
export function generateTemplateWaypoints(
    type: MissionType,
    details: DeliveryDetails | SurveyDetails | InspectionDetails | undefined
) {
    const waypoints: any[] = []

    switch (type) {
        case "delivery":
            if (details && "pickupLocation" in details) {
                const deliveryDetails = details as DeliveryDetails
                waypoints.push(
                    {
                        id: "wp-pickup",
                        lat: deliveryDetails.pickupLocation.lat,
                        lng: deliveryDetails.pickupLocation.lng,
                        altitude: 50,
                        action: "pickup",
                        pathType: "discrete",
                    },
                    {
                        id: "wp-dropoff",
                        lat: deliveryDetails.dropoffLocation.lat,
                        lng: deliveryDetails.dropoffLocation.lng,
                        altitude: 50,
                        action: "dropoff",
                        pathType: "discrete",
                    }
                )
            }
            break

        case "inspection":
            if (details && "inspectionPoints" in details) {
                const inspectionDetails = details as InspectionDetails
                inspectionDetails.inspectionPoints.forEach((point, idx) => {
                    waypoints.push({
                        id: `wp-inspect-${idx}`,
                        lat: point.lat,
                        lng: point.lng,
                        altitude: point.altitude,
                        action: "inspect",
                        pathType: "discrete",
                    })
                })
            }
            break

        case "survey":
            // Survey waypoints are typically auto-generated from coverage area
            // This would require more complex grid generation logic
            break

        case "custom":
            // No auto-generated waypoints
            break
    }

    return waypoints
}
