import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlantSchema } from "@shared/schema";
import { z } from "zod";
import { identifyPlantWithAI } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all plants
  app.get("/api/plants", async (req, res) => {
    try {
      const plants = await storage.getAllPlants();
      res.json(plants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plants" });
    }
  });

  // Get single plant
  app.get("/api/plants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plant = await storage.getPlant(id);
      
      if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
      }
      
      res.json(plant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plant" });
    }
  });

  // Identify plant (mock AI endpoint)
  app.post("/api/plants/identify", async (req, res) => {
    try {
      const { imageData, aromaLevel, latitude, longitude, locationName } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data required" });
      }

      // Use OpenAI to identify the plant
      console.log("Identifying plant with OpenAI API...");
      const identifiedPlant = await identifyPlantWithAI(imageData, aromaLevel);
      
      const plantData = {
        ...identifiedPlant,
        imageUrl: imageData,
        aromaLevel: aromaLevel !== undefined ? aromaLevel : 5,
        identificationCount: 1,
        latitude: latitude || null,
        longitude: longitude || null,
        locationName: locationName || null,
      };

      const plant = await storage.createPlant(plantData);
      res.json(plant);
    } catch (error) {
      console.error("Plant identification error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to identify plant" 
      });
    }
  });

  // Serve images from object storage
  app.get("/api/images/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const imagePath = `images/${filename}`;
      
      // Check if image exists in object storage
      const exists = await (storage as any).client?.exists(imagePath);
      if (!exists || !(exists as any).ok) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Download image from object storage
      const response = await (storage as any).client.downloadAsBytes(imagePath);
      
      // Handle Replit Object Storage response format
      let buffer: Buffer;
      if (response && typeof response === 'object' && 'value' in response) {
        const bufferArray = (response as any).value;
        if (Array.isArray(bufferArray) && bufferArray.length > 0) {
          buffer = bufferArray[0];
        } else {
          return res.status(404).json({ message: "Image data not found" });
        }
      } else if (Buffer.isBuffer(response)) {
        buffer = response;
      } else {
        return res.status(404).json({ message: "Invalid image data" });
      }

      // Set appropriate content type
      const ext = filename.split('.').pop()?.toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === 'png') contentType = 'image/png';
      else if (ext === 'gif') contentType = 'image/gif';
      else if (ext === 'webp') contentType = 'image/webp';

      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(buffer);
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  // Update plant identification count
  app.patch("/api/plants/:id/count", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plant = await storage.updatePlantCount(id);
      
      if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
      }
      
      res.json(plant);
    } catch (error) {
      res.status(500).json({ message: "Failed to update plant count" });
    }
  });

  // Delete single plant
  app.delete("/api/plants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePlant(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Plant not found" });
      }
      
      res.json({ message: "Plant deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete plant" });
    }
  });

  // Delete all plants
  app.delete("/api/plants", async (req, res) => {
    try {
      await storage.deleteAllPlants();
      res.json({ message: "All plants deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete plants" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
