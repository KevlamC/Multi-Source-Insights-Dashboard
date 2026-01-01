// constants/practitionerTypes.ts
export const PRACTITIONER_OPTIONS = [
    "all",
    // Medical & healthcare
    "doctor", "physician", "surgeon", "nurse", "dentist", "optometrist", "ophthalmologist",
    "pharmacist", "dietitian", "nutritionist", "paramedic", "midwife", "veterinarian",

    // Mental health & counseling
    "therapist", "counselor", "psychologist", "psychiatrist", "social worker",

    // Rehabilitation & wellness
    "physiotherapist", "physical therapist", "occupational therapist", "chiropractor",
    "acupuncturist", "massage therapist", "speech therapist", "personal trainer", "fitness coach",
    "life coach", "wellness coach", "health coach",

    // Education
    "teacher", "professor", "tutor", "instructor", "mentor", "educator",

    // Technical / Specialized services
    "engineer", "architect", "technician", "mechanic", "consultant", "specialist"
] as const;

export type PractitionerType = typeof PRACTITIONER_OPTIONS[number];
