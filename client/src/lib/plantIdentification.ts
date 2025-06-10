// Mock plant identification service
// In a real app, this would integrate with a plant identification API

export interface PlantIdentificationResult {
  scientificName: string;
  commonName: string;
  family: string;
  origin: string;
  careLevel: string;
  lightRequirements: string;
  watering: string;
  specialFeatures: string;
  confidence: number;
}

const mockPlantDatabase: PlantIdentificationResult[] = [
  {
    scientificName: "Monstera deliciosa",
    commonName: "Swiss Cheese Plant",
    family: "Araceae",
    origin: "Central America, Southern Mexico",
    careLevel: "Easy to Moderate",
    lightRequirements: "Bright, indirect light",
    watering: "Water when top inch of soil is dry. Approximately once per week.",
    specialFeatures: "Known for its distinctive split leaves (fenestration) that develop as the plant matures. Can grow very large indoors with proper support.",
    confidence: 92,
  },
  {
    scientificName: "Sansevieria trifasciata",
    commonName: "Snake Plant",
    family: "Asparagaceae",
    origin: "West Africa",
    careLevel: "Very Easy",
    lightRequirements: "Low to bright, indirect light",
    watering: "Water every 2-3 weeks. Allow soil to dry completely between waterings.",
    specialFeatures: "Extremely drought tolerant and air purifying. Can survive in low light conditions.",
    confidence: 89,
  },
  {
    scientificName: "Ficus lyrata",
    commonName: "Fiddle Leaf Fig",
    family: "Moraceae",
    origin: "Western Africa",
    careLevel: "Moderate to Difficult",
    lightRequirements: "Bright, indirect light",
    watering: "Water when top 1-2 inches of soil are dry.",
    specialFeatures: "Large, violin-shaped leaves. Requires consistent care and doesn't like to be moved.",
    confidence: 85,
  },
  {
    scientificName: "Epipremnum aureum",
    commonName: "Golden Pothos",
    family: "Araceae",
    origin: "Solomon Islands",
    careLevel: "Very Easy",
    lightRequirements: "Low to bright, indirect light",
    watering: "Water when soil feels dry. Approximately every 1-2 weeks.",
    specialFeatures: "Trailing vine that can be grown as a hanging plant or trained up a support. Very forgiving and fast-growing.",
    confidence: 91,
  },
  {
    scientificName: "Ficus elastica",
    commonName: "Rubber Plant",
    family: "Moraceae",
    origin: "India and Southeast Asia",
    careLevel: "Easy",
    lightRequirements: "Bright, indirect light",
    watering: "Water when top inch of soil is dry.",
    specialFeatures: "Glossy, thick leaves that start burgundy and mature to deep green. Can grow into a large tree indoors.",
    confidence: 88,
  },
];

export function identifyPlant(imageData: string): Promise<PlantIdentificationResult> {
  return new Promise((resolve) => {
    // Simulate AI processing time
    setTimeout(() => {
      const randomPlant = mockPlantDatabase[Math.floor(Math.random() * mockPlantDatabase.length)];
      resolve(randomPlant);
    }, 1500);
  });
}

export function getPlantById(id: string): PlantIdentificationResult | undefined {
  return mockPlantDatabase.find(plant => plant.scientificName === id);
}
