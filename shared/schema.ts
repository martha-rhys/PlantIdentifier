import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  scientificName: text("scientific_name").notNull(),
  commonName: text("common_name").notNull(),
  family: text("family").notNull(),
  origin: text("origin").notNull(),
  careLevel: text("care_level").notNull(),
  lightRequirements: text("light_requirements").notNull(),
  watering: text("watering").notNull(),
  specialFeatures: text("special_features").notNull(),
  confidence: integer("confidence").notNull(), // percentage 0-100
  imageUrl: text("image_url").notNull(),
  aromaLevel: integer("aroma_level").notNull().default(5), // 0-10 scale
  identificationCount: integer("identification_count").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
  createdAt: true,
});

export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Plant = typeof plants.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
