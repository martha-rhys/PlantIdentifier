import { plants, type Plant, type InsertPlant, users, type User, type InsertUser } from "@shared/schema";
import { IStorage } from "./storage";
import fs from 'fs/promises';
import path from 'path';

export class FileStorage implements IStorage {
  private dataDir = path.join(process.cwd(), 'data');
  private plantsDir = path.join(this.dataDir, 'plants');
  private imagesDir = path.join(this.dataDir, 'images');
  private usersDir = path.join(this.dataDir, 'users');
  private metadataFile = path.join(this.dataDir, 'metadata.json');

  constructor() {
    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.plantsDir, { recursive: true });
      await fs.mkdir(this.imagesDir, { recursive: true });
      await fs.mkdir(this.usersDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create storage directories:', error);
    }
  }

  private async saveImage(imageData: string, plantId: number): Promise<string> {
    try {
      // Extract base64 data from data URL
      const base64Data = imageData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const imagePath = path.join(this.imagesDir, `plant-${plantId}.jpg`);
      await fs.writeFile(imagePath, buffer);
      
      // Return relative URL for serving
      return `/data/images/plant-${plantId}.jpg`;
    } catch (error) {
      console.warn('Could not save image, using data URL:', error);
      return imageData; // Fallback to data URL
    }
  }

  private async getMetadata(): Promise<{ nextPlantId: number; nextUserId: number }> {
    try {
      const data = await fs.readFile(this.metadataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { nextPlantId: 1, nextUserId: 1 };
    }
  }

  private async saveMetadata(metadata: { nextPlantId: number; nextUserId: number }): Promise<void> {
    try {
      await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.warn('Could not save metadata:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const userFile = path.join(this.usersDir, `${id}.json`);
      const data = await fs.readFile(userFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const files = await fs.readdir(this.usersDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const userData = await fs.readFile(path.join(this.usersDir, file), 'utf8');
          const user = JSON.parse(userData);
          if (user.username === username) {
            return user;
          }
        }
      }
    } catch (error) {
      console.warn('Could not search users:', error);
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const metadata = await this.getMetadata();
    const id = metadata.nextUserId;
    const user: User = { ...insertUser, id };
    
    try {
      const userFile = path.join(this.usersDir, `${id}.json`);
      await fs.writeFile(userFile, JSON.stringify(user, null, 2));
      
      await this.saveMetadata({ ...metadata, nextUserId: id + 1 });
    } catch (error) {
      console.warn('Could not save user:', error);
    }
    
    return user;
  }

  // Plant methods
  async getAllPlants(): Promise<Plant[]> {
    try {
      const files = await fs.readdir(this.plantsDir);
      const plants: Plant[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const plantData = await fs.readFile(path.join(this.plantsDir, file), 'utf8');
            const plant = JSON.parse(plantData);
            plants.push(plant);
          } catch (error) {
            console.warn(`Could not read plant file ${file}:`, error);
          }
        }
      }
      
      return plants.sort((a, b) => b.id - a.id); // Sort by newest first
    } catch (error) {
      console.warn('Could not get all plants:', error);
      return [];
    }
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    try {
      const plantFile = path.join(this.plantsDir, `${id}.json`);
      const data = await fs.readFile(plantFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return undefined;
    }
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const metadata = await this.getMetadata();
    const id = metadata.nextPlantId;
    
    // Save image to file system and get URL
    let imageUrl = insertPlant.imageUrl;
    if (insertPlant.imageUrl?.startsWith('data:')) {
      imageUrl = await this.saveImage(insertPlant.imageUrl, id);
    }
    
    // Check if plant already exists (duplicate detection)
    const existingPlants = await this.getAllPlants();
    const existingPlant = existingPlants.find(p => 
      p.scientificName === insertPlant.scientificName && 
      p.commonName === insertPlant.commonName
    );
    
    if (existingPlant) {
      // Update count instead of creating duplicate
      return await this.updatePlantCount(existingPlant.id) || existingPlant;
    }
    
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
      imageUrl: imageUrl || insertPlant.imageUrl,
      aromaLevel: insertPlant.aromaLevel ?? 5,
      identificationCount: insertPlant.identificationCount ?? 1,
      latitude: insertPlant.latitude || null,
      longitude: insertPlant.longitude || null,
      locationName: insertPlant.locationName || null,
      createdAt: new Date()
    };
    
    try {
      // Save plant data
      const plantFile = path.join(this.plantsDir, `${id}.json`);
      await fs.writeFile(plantFile, JSON.stringify(plant, null, 2));
      
      // Update metadata
      await this.saveMetadata({ ...metadata, nextPlantId: id + 1 });
      
    } catch (error) {
      console.warn('Could not save plant:', error);
    }
    
    return plant;
  }

  async updatePlantCount(id: number): Promise<Plant | undefined> {
    const plant = await this.getPlant(id);
    if (!plant) return undefined;
    
    const updatedPlant = {
      ...plant,
      identificationCount: plant.identificationCount + 1,
    };
    
    try {
      const plantFile = path.join(this.plantsDir, `${id}.json`);
      await fs.writeFile(plantFile, JSON.stringify(updatedPlant, null, 2));
    } catch (error) {
      console.warn('Could not update plant count:', error);
    }
    
    return updatedPlant;
  }

  async deletePlant(id: number): Promise<boolean> {
    try {
      // Delete plant data file
      const plantFile = path.join(this.plantsDir, `${id}.json`);
      await fs.unlink(plantFile);
      
      // Try to delete associated image
      try {
        const imageFile = path.join(this.imagesDir, `plant-${id}.jpg`);
        await fs.unlink(imageFile);
      } catch (error) {
        console.warn('Could not delete plant image:', error);
      }
      
      return true;
    } catch (error) {
      console.warn('Could not delete plant:', error);
      return false;
    }
  }

  async deleteAllPlants(): Promise<void> {
    try {
      // Delete all plant files
      const plantFiles = await fs.readdir(this.plantsDir);
      for (const file of plantFiles) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(this.plantsDir, file));
        }
      }
      
      // Delete all image files
      const imageFiles = await fs.readdir(this.imagesDir);
      for (const file of imageFiles) {
        if (file.startsWith('plant-') && file.endsWith('.jpg')) {
          await fs.unlink(path.join(this.imagesDir, file));
        }
      }
      
      // Reset metadata
      await this.saveMetadata({ nextPlantId: 1, nextUserId: 1 });
      
    } catch (error) {
      console.warn('Could not delete all plants:', error);
    }
  }
}