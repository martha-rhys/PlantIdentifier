import { plants, type Plant, type InsertPlant, users, type User, type InsertUser } from "@shared/schema";
import { IStorage } from "./storage";

export class ReplitObjectStorage implements IStorage {
  private bucketId = "replit-objstore-41dfb480-8c50-47c9-84e6-470af0db997c";
  private baseUrl = `https://objstore.replit.com/${this.bucketId}`;
  private currentUserId: number = 1;
  private currentPlantId: number = 1;

  private async makeRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Object storage request failed: ${response.statusText}`);
    }
    
    return response;
  }

  private async uploadImage(imageData: string, plantId: number): Promise<string> {
    // Extract base64 data from data URL
    const base64Data = imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const imagePath = `/images/plant-${plantId}.jpg`;
    
    const response = await fetch(`${this.baseUrl}${imagePath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: buffer,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }
    
    return `${this.baseUrl}${imagePath}`;
  }

  private async getNextPlantId(): Promise<number> {
    try {
      const response = await this.makeRequest('/metadata/nextPlantId');
      if (response.ok) {
        const data = await response.json();
        return data.id || 1;
      }
    } catch (error) {
      console.warn('Could not get next plant ID, using default:', error);
    }
    return this.currentPlantId;
  }

  private async saveNextPlantId(id: number): Promise<void> {
    try {
      await this.makeRequest('/metadata/nextPlantId', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.warn('Could not save next plant ID:', error);
    }
  }

  // User methods (keeping minimal for plant app)
  async getUser(id: number): Promise<User | undefined> {
    try {
      const response = await this.makeRequest(`/users/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Could not get user:', error);
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const response = await this.makeRequest(`/users/by-username/${encodeURIComponent(username)}`);
      if (response.ok) {
        return await response.json();
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
      await this.makeRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
      });
    } catch (error) {
      console.warn('Could not save user:', error);
    }
    
    return user;
  }

  // Plant methods
  async getAllPlants(): Promise<Plant[]> {
    try {
      const response = await this.makeRequest('/plants/index');
      if (response.ok) {
        const plantIds = await response.json();
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
      const response = await this.makeRequest(`/plants/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Could not get plant:', error);
    }
    return undefined;
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = await this.getNextPlantId();
    
    // Upload image to object storage and get URL
    let imageUrl = insertPlant.imageUrl;
    if (insertPlant.imageUrl?.startsWith('data:')) {
      try {
        imageUrl = await this.uploadImage(insertPlant.imageUrl, id);
      } catch (error) {
        console.warn('Could not upload image, using data URL:', error);
        // Keep original data URL as fallback
      }
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
      await this.makeRequest(`/plants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plant),
      });
      
      // Update plant index
      const plants = await this.getAllPlants();
      const plantIds = [...plants.map(p => p.id), id];
      await this.makeRequest('/plants/index', {
        method: 'PUT',
        body: JSON.stringify(plantIds),
      });
      
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
      await this.makeRequest(`/plants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedPlant),
      });
    } catch (error) {
      console.warn('Could not update plant count:', error);
    }
    
    return updatedPlant;
  }

  async deletePlant(id: number): Promise<boolean> {
    try {
      // Delete plant data
      const response = await this.makeRequest(`/plants/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Update plant index
        const plants = await this.getAllPlants();
        const plantIds = plants.filter(p => p.id !== id).map(p => p.id);
        await this.makeRequest('/plants/index', {
          method: 'PUT',
          body: JSON.stringify(plantIds),
        });
        
        // Try to delete associated image
        try {
          await this.makeRequest(`/images/plant-${id}.jpg`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.warn('Could not delete plant image:', error);
        }
        
        return true;
      }
    } catch (error) {
      console.warn('Could not delete plant:', error);
    }
    return false;
  }

  async deleteAllPlants(): Promise<void> {
    try {
      const plants = await this.getAllPlants();
      
      // Delete all plant data
      for (const plant of plants) {
        await this.deletePlant(plant.id);
      }
      
      // Clear plant index
      await this.makeRequest('/plants/index', {
        method: 'PUT',
        body: JSON.stringify([]),
      });
      
    } catch (error) {
      console.warn('Could not delete all plants:', error);
    }
  }
}