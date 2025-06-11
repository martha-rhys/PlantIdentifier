import { plants, type Plant, type InsertPlant, users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlantCount(id: number): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
  deleteAllPlants(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private plants: Map<number, Plant>;
  private currentUserId: number;
  private currentPlantId: number;

  constructor() {
    this.users = new Map();
    this.plants = new Map();
    this.currentUserId = 1;
    this.currentPlantId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllPlants(): Promise<Plant[]> {
    return Array.from(this.plants.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    return this.plants.get(id);
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    // Check if plant already exists by scientific name
    const existingPlant = Array.from(this.plants.values()).find(
      plant => plant.scientificName === insertPlant.scientificName
    );

    if (existingPlant) {
      // Increment count if plant already exists
      existingPlant.identificationCount += 1;
      this.plants.set(existingPlant.id, existingPlant);
      return existingPlant;
    }

    const id = this.currentPlantId++;
    const plant: Plant = { 
      id,
      scientificName: insertPlant.scientificName,
      commonName: insertPlant.commonName,
      family: insertPlant.family,
      origin: insertPlant.origin,
      lightRequirements: insertPlant.lightRequirements,
      watering: insertPlant.watering,
      specialFeatures: insertPlant.specialFeatures,
      confidence: insertPlant.confidence,
      imageUrl: insertPlant.imageUrl,
      aromaLevel: insertPlant.aromaLevel ?? 5,
      identificationCount: insertPlant.identificationCount ?? 1,
      latitude: insertPlant.latitude || null,
      longitude: insertPlant.longitude || null,
      locationName: insertPlant.locationName || null,
      createdAt: new Date()
    };
    this.plants.set(id, plant);
    return plant;
  }

  async updatePlantCount(id: number): Promise<Plant | undefined> {
    const plant = this.plants.get(id);
    if (plant) {
      plant.identificationCount += 1;
      this.plants.set(id, plant);
      return plant;
    }
    return undefined;
  }

  async deletePlant(id: number): Promise<boolean> {
    return this.plants.delete(id);
  }

  async deleteAllPlants(): Promise<void> {
    this.plants.clear();
  }
}

export const storage = new MemStorage();
