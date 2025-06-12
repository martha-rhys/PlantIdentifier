import { plants, type Plant, type InsertPlant, users, type User, type InsertUser } from "@shared/schema";
import { IStorage } from "./storage";
import { Client } from "@replit/object-storage";

export class ReplitObjectStorage implements IStorage {
  private client: Client;
  private currentUserId: number = 1;
  private currentPlantId: number = 1;

  constructor() {
    this.client = new Client();
  }

  private async uploadImage(imageData: string, plantId: number): Promise<string> {
    try {
      // Extract base64 data from data URL
      const base64Data = imageData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const imagePath = `images/plant-${plantId}.jpg`;
      
      console.log(`Uploading image to path: ${imagePath}`);
      
      await this.client.uploadFromBytes(imagePath, buffer);
      
      console.log(`Image uploaded successfully to: ${imagePath}`);
      
      // Return path for retrieval
      return imagePath;
    } catch (error) {
      console.error('Failed to upload image:', error);
      // Return original data URL as fallback
      return imageData;
    }
  }

  private async getNextPlantId(): Promise<number> {
    try {
      const exists = await this.client.exists('metadata/nextPlantId.json');
      if (exists) {
        const data = await this.client.downloadAsBytes('metadata/nextPlantId.json');
        const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
        const metadata = JSON.parse(text);
        return metadata.id || 1;
      }
    } catch (error) {
      console.warn('Could not get next plant ID:', error);
    }
    return this.currentPlantId;
  }

  private async saveNextPlantId(id: number): Promise<void> {
    try {
      const metadata = { id };
      await this.client.uploadFromBytes('metadata/nextPlantId.json', Buffer.from(JSON.stringify(metadata)));
    } catch (error) {
      console.warn('Could not save next plant ID:', error);
    }
  }

  // User methods (keeping minimal for plant app)
  async getUser(id: number): Promise<User | undefined> {
    try {
      const exists = await this.client.exists(`users/${id}.json`);
      if (exists) {
        const data = await this.client.downloadAsBytes(`users/${id}.json`);
        const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
        return JSON.parse(text);
      }
    } catch (error) {
      console.warn('Could not get user:', error);
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const exists = await this.client.exists(`users/by-username/${encodeURIComponent(username)}.json`);
      if (exists) {
        const data = await this.client.downloadAsBytes(`users/by-username/${encodeURIComponent(username)}.json`);
        const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
        return JSON.parse(text);
      }
    } catch (error) {
      console.warn('Could not get user by username:', error);
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    
    try {
      await this.client.uploadFromBytes(`users/${id}.json`, Buffer.from(JSON.stringify(user)));
      await this.client.uploadFromBytes(`users/by-username/${encodeURIComponent(user.username)}.json`, Buffer.from(JSON.stringify(user)));
    } catch (error) {
      console.warn('Could not save user:', error);
    }
    
    return user;
  }

  // Plant methods
  async getAllPlants(): Promise<Plant[]> {
    try {
      const exists = await this.client.exists('plants/index.json');
      console.log('Plants index exists:', exists);
      
      if (exists) {
        const data = await this.client.downloadAsBytes('plants/index.json');
        console.log('Downloaded data type:', typeof data);
        console.log('Is Buffer?', Buffer.isBuffer(data));
        console.log('Data:', data);
        
        let text: string;
        if (Buffer.isBuffer(data)) {
          text = data.toString('utf8');
        } else if (typeof data === 'string') {
          text = data;
        } else {
          console.log('Converting object to string:', data);
          text = JSON.stringify(data);
        }
        
        console.log('Text to parse:', text);
        const plantIds = JSON.parse(text);
        console.log('Parsed plant IDs:', plantIds);
        
        const plants: Plant[] = [];
        
        for (const id of plantIds) {
          const plant = await this.getPlant(id);
          if (plant) {
            plants.push(plant);
          }
        }
        
        return plants.sort((a, b) => b.id - a.id); // Sort by newest first
      }
    } catch (error) {
      console.warn('Could not get all plants:', error);
    }
    return [];
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    try {
      const exists = await this.client.exists(`plants/${id}.json`);
      if (exists) {
        const data = await this.client.downloadAsBytes(`plants/${id}.json`);
        const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
        return JSON.parse(text);
      }
    } catch (error) {
      console.warn('Could not get plant:', error);
    }
    return undefined;
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = await this.getNextPlantId();
    
    // Upload image to object storage and get path
    let imageUrl = insertPlant.imageUrl;
    if (insertPlant.imageUrl?.startsWith('data:')) {
      imageUrl = await this.uploadImage(insertPlant.imageUrl, id);
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
      await this.client.uploadFromBytes(`plants/${id}.json`, Buffer.from(JSON.stringify(plant)));
      
      // Update plant index
      const plants = await this.getAllPlants();
      const plantIds = [...plants.map(p => p.id), id];
      await this.client.uploadFromBytes('plants/index.json', Buffer.from(JSON.stringify(plantIds)));
      
      // Save next ID
      await this.saveNextPlantId(id + 1);
      
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
      await this.client.uploadFromBytes(`plants/${id}.json`, Buffer.from(JSON.stringify(updatedPlant)));
    } catch (error) {
      console.warn('Could not update plant count:', error);
    }
    
    return updatedPlant;
  }

  async deletePlant(id: number): Promise<boolean> {
    try {
      // Delete plant data
      await this.client.delete(`plants/${id}.json`);
      
      // Update plant index
      const plants = await this.getAllPlants();
      const plantIds = plants.filter(p => p.id !== id).map(p => p.id);
      await this.client.uploadFromBytes('plants/index.json', Buffer.from(JSON.stringify(plantIds)));
      
      // Try to delete associated image
      try {
        await this.client.delete(`images/plant-${id}.jpg`);
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
      const plants = await this.getAllPlants();
      
      // Delete all plant data
      for (const plant of plants) {
        await this.deletePlant(plant.id);
      }
      
      // Clear plant index
      await this.client.uploadFromBytes('plants/index.json', Buffer.from(JSON.stringify([])));
      
    } catch (error) {
      console.warn('Could not delete all plants:', error);
    }
  }
}