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
