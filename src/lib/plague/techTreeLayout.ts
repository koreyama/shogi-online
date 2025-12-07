export interface NodePosition {
    x: number;
    y: number;
}

export const TECH_TREE_LAYOUT: Record<string, NodePosition> = {
    // --- Transmission (Left Cluster) ---
    // Air Tree
    'air_1': { x: -200, y: -50 },
    'air_2': { x: -300, y: -50 },

    // Water Tree
    'water_1': { x: -200, y: 50 },
    'water_2': { x: -300, y: 50 },

    // Insect/Animal
    'insect_1': { x: -200, y: 150 },
    'insect_2': { x: -300, y: 150 },
    'rodent_1': { x: -200, y: 250 },
    'bird_1': { x: -100, y: 200 },

    // --- Symptoms (Center Cluster) ---
    // Resp Tree (Top)
    'coughing': { x: 0, y: -100 },
    'sneezing': { x: 0, y: -200 },
    'pneumonia': { x: 0, y: -300 },

    // Neuro Tree (Left-ish)
    'insomnia': { x: -80, y: -100 },
    'paranoia': { x: -100, y: -180 },
    'seizures': { x: -120, y: -260 },
    'coma': { x: -140, y: -340 },

    // Blood Tree (Right-ish)
    'fever': { x: 80, y: -100 },
    'hemorrhage': { x: 100, y: -180 },
    'organ_failure': { x: 120, y: -260 },
    'necrosis': { x: 140, y: -340 },

    // --- Abilities (Right Cluster) ---
    'cold_resist_1': { x: 200, y: 0 },
    'cold_resist_2': { x: 300, y: -30 },

    'heat_resist_1': { x: 200, y: 100 },
    'heat_resist_2': { x: 300, y: 130 },

    'drug_resist_1': { x: 200, y: 200 },
    'drug_resist_2': { x: 300, y: 230 },
    'genetic_hardening': { x: 400, y: 100 },
};
