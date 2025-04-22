import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["parent", "child"] }).notNull(),
  parentId: integer("parent_id").references(() => users.id),
  age: integer("age"),
  totalPoints: integer("total_points").default(0),
  imageUrl: text("image_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  parentId: true,
  age: true,
});

// Activities model
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  childId: true,
  description: true,
  points: true,
}).extend({
  date: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
  }, z.date()),
});

// Rewards model
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  pointsCost: integer("points_cost").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isGlobal: boolean("is_global").default(true),
});

export const insertRewardSchema = createInsertSchema(rewards).pick({
  name: true,
  description: true,
  imageUrl: true,
  pointsCost: true,
  createdBy: true,
  isGlobal: true,
});

// Redemption requests model
export const redemptionRequests = pgTable("redemption_requests", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  note: text("note"),
});

export const insertRedemptionRequestSchema = createInsertSchema(redemptionRequests).pick({
  childId: true,
  rewardId: true,
  note: true,
});

// Rules model
export const rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  
});

export const insertRuleSchema = createInsertSchema(rules).pick({
  parentId: true,
  name: true,
  description: true,
  points: true,
});

// Badges model
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requiredDays: integer("required_days").notNull(),
  activityType: text("activity_type").notNull(),
  parentId: integer("parent_id").notNull().references(() => users.id),
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  icon: true,
  requiredDays: true,
  activityType: true,
  parentId: true,
});

// Child Badges model for tracking earned badges
export const childBadges = pgTable("child_badges", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  dateEarned: timestamp("date_earned").notNull().defaultNow(),
});

export const insertChildBadgeSchema = createInsertSchema(childBadges).pick({
  childId: true,
  badgeId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type RedemptionRequest = typeof redemptionRequests.$inferSelect;
export type InsertRedemptionRequest = z.infer<typeof insertRedemptionRequestSchema>;
export type Rule = typeof rules.$inferSelect;
export type InsertRule = z.infer<typeof insertRuleSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type ChildBadge = typeof childBadges.$inferSelect;
export type InsertChildBadge = z.infer<typeof insertChildBadgeSchema>;
