import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlantSchema } from "@shared/schema";
import { z } from "zod";

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
      const { imageData, aromaLevel } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data required" });
      }

      // Mock AI plant identification
      const mockPlants = [
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
        }
      ];

      // Randomly select a plant for mock identification
      const identifiedPlant = mockPlants[Math.floor(Math.random() * mockPlants.length)];
      
      const plantData = {
        ...identifiedPlant,
        imageUrl: imageData,
        aromaLevel: aromaLevel || 5,
        identificationCount: 1,
      };

      const plant = await storage.createPlant(plantData);
      res.json(plant);
    } catch (error) {
      res.status(500).json({ message: "Failed to identify plant" });
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
