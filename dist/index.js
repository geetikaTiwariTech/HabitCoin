var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import session2 from "express-session";
import createMemoryStore from "memorystore";

// server/db.ts
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activities: () => activities,
  badges: () => badges,
  childBadges: () => childBadges,
  insertActivitySchema: () => insertActivitySchema,
  insertBadgeSchema: () => insertBadgeSchema,
  insertChildBadgeSchema: () => insertChildBadgeSchema,
  insertRedemptionRequestSchema: () => insertRedemptionRequestSchema,
  insertRewardSchema: () => insertRewardSchema,
  insertRuleSchema: () => insertRuleSchema,
  insertUserSchema: () => insertUserSchema,
  redemptionRequests: () => redemptionRequests,
  rewards: () => rewards,
  rules: () => rules,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["parent", "child"] }).notNull(),
  parentId: integer("parent_id").references(() => users.id),
  age: integer("age"),
  totalPoints: integer("total_points").default(0),
  imageUrl: text("image_url")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  parentId: true,
  age: true
});
var activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  date: timestamp("date").notNull().defaultNow()
});
var insertActivitySchema = createInsertSchema(activities).pick({
  childId: true,
  description: true,
  points: true
}).extend({
  date: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date())
});
var rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  pointsCost: integer("points_cost").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isGlobal: boolean("is_global").default(true)
});
var insertRewardSchema = createInsertSchema(rewards).pick({
  name: true,
  description: true,
  imageUrl: true,
  pointsCost: true,
  createdBy: true,
  isGlobal: true
});
var redemptionRequests = pgTable("redemption_requests", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  note: text("note")
});
var insertRedemptionRequestSchema = createInsertSchema(redemptionRequests).pick({
  childId: true,
  rewardId: true,
  note: true
});
var rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull()
});
var insertRuleSchema = createInsertSchema(rules).pick({
  parentId: true,
  name: true,
  description: true,
  points: true
});
var badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requiredDays: integer("required_days").notNull(),
  activityType: text("activity_type").notNull(),
  parentId: integer("parent_id").notNull().references(() => users.id)
});
var insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  icon: true,
  requiredDays: true,
  activityType: true,
  parentId: true
});
var childBadges = pgTable("child_badges", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  dateEarned: timestamp("date_earned").notNull().defaultNow()
});
var insertChildBadgeSchema = createInsertSchema(childBadges).pick({
  childId: true,
  badgeId: true
});

// server/db.ts
var { Pool } = pg;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("DATABASE_URL =", process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.db.ts
import { eq, and, inArray, or, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  // Using any to fix the type issue
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    this.initializeSampleRewards();
  }
  // Helper function to initialize sample rewards if needed
  async initializeSampleRewards() {
    try {
      console.log("Sample rewards will be created when the first parent user registers");
    } catch (error) {
      console.error("Error initializing rewards system:", error);
    }
  }
  // This method will be called when a parent user is created to add sample rewards
  async createSampleRewardsForParent(parentId) {
    try {
      const existingRewards = await db.select().from(rewards).where(eq(rewards.createdBy, parentId));
      if (existingRewards.length === 0) {
        const sampleRewards = [
          {
            name: "Video Game: Minecraft",
            description: "Popular sandbox game",
            imageUrl: "https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
            pointsCost: 250,
            createdBy: parentId,
            isGlobal: true
          },
          {
            name: "Lego Friends Set",
            description: "Building blocks set",
            imageUrl: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
            pointsCost: 150,
            createdBy: parentId,
            isGlobal: true
          },
          {
            name: "Bike Accessory Kit",
            description: "Accessories for your bike",
            imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
            pointsCost: 100,
            createdBy: parentId,
            isGlobal: true
          },
          {
            name: "Ice Cream Trip",
            description: "Trip to get ice cream",
            imageUrl: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
            pointsCost: 50,
            createdBy: parentId,
            isGlobal: true
          },
          {
            name: "Extra Tablet Time (1hr)",
            description: "One hour of extra tablet time",
            imageUrl: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
            pointsCost: 30,
            createdBy: parentId,
            isGlobal: true
          },
          {
            name: "Family Movie Night",
            description: "Choose a movie for family night",
            imageUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
            pointsCost: 75,
            createdBy: parentId,
            isGlobal: true
          }
        ];
        for (const reward of sampleRewards) {
          await db.insert(rewards).values(reward);
        }
        console.log(`Created sample rewards for parent ID: ${parentId}`);
      }
    } catch (error) {
      console.error("Error creating sample rewards for parent:", error);
    }
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values({
      ...user,
      totalPoints: 0
    }).returning();
    if (user.role === "parent") {
      await this.createSampleRewardsForParent(newUser.id);
    }
    return newUser;
  }
  async updateUser(id, data) {
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }
  async getChildrenByParentId(parentId) {
    return db.select().from(users).where(
      and(
        eq(users.parentId, parentId),
        eq(users.role, "child")
      )
    );
  }
  // Activity operations
  async getActivitiesByChildId(childId) {
    return db.select().from(activities).where(eq(activities.childId, childId)).orderBy(desc(activities.date));
  }
  async createActivity(activity) {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    const child = await this.getUser(activity.childId);
    if (child) {
      await this.updateUser(child.id, {
        totalPoints: (child.totalPoints || 0) + activity.points
      });
    }
    return newActivity;
  }
  async deleteActivity(id) {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    if (activity) {
      const child = await this.getUser(activity.childId);
      if (child) {
        await this.updateUser(child.id, {
          totalPoints: Math.max(0, (child.totalPoints || 0) - activity.points)
        });
      }
      await db.delete(activities).where(eq(activities.id, id));
    }
    return true;
  }
  // Reward operations
  async getRewards() {
    return db.select().from(rewards);
  }
  async getRewardsByParentId(parentId) {
    return db.select().from(rewards).where(
      or(
        eq(rewards.createdBy, parentId),
        eq(rewards.isGlobal, true)
      )
    );
  }
  async getReward(id) {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }
  async createReward(reward) {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }
  async updateReward(id, data) {
    const [updatedReward] = await db.update(rewards).set(data).where(eq(rewards.id, id)).returning();
    return updatedReward;
  }
  async deleteReward(id) {
    await db.delete(rewards).where(eq(rewards.id, id));
    return true;
  }
  // Redemption request operations
  async getRedemptionRequestsByChildId(childId) {
    return db.select().from(redemptionRequests).where(eq(redemptionRequests.childId, childId)).orderBy(desc(redemptionRequests.requestDate));
  }
  async getRedemptionRequestsByParentId(parentId) {
    const children = await this.getChildrenByParentId(parentId);
    const childIds = children.map((child) => child.id);
    if (childIds.length === 0) {
      return [];
    }
    return db.select().from(redemptionRequests).where(inArray(redemptionRequests.childId, childIds)).orderBy(desc(redemptionRequests.requestDate));
  }
  async createRedemptionRequest(request) {
    const [newRequest] = await db.insert(redemptionRequests).values({
      ...request,
      status: "pending",
      requestDate: /* @__PURE__ */ new Date()
    }).returning();
    return newRequest;
  }
  async updateRedemptionRequest(id, data) {
    const [currentRequest] = await db.select().from(redemptionRequests).where(eq(redemptionRequests.id, id));
    if (!currentRequest) return void 0;
    const [updatedRequest] = await db.update(redemptionRequests).set(data).where(eq(redemptionRequests.id, id)).returning();
    if (currentRequest.status !== "approved" && updatedRequest.status === "approved") {
      const reward = await this.getReward(currentRequest.rewardId);
      const child = await this.getUser(currentRequest.childId);
      if (reward && child) {
        await this.updateUser(child.id, {
          totalPoints: Math.max(0, (child.totalPoints || 0) - reward.pointsCost)
        });
      }
    }
    return updatedRequest;
  }
  async getRedemptionRequest(id) {
    const [request] = await db.select().from(redemptionRequests).where(eq(redemptionRequests.id, id));
    return request;
  }
  // Rule operations
  async getRulesByParentId(parentId) {
    return db.select().from(rules).where(eq(rules.parentId, parentId));
  }
  async createRule(rule) {
    const [newRule] = await db.insert(rules).values(rule).returning();
    return newRule;
  }
  async updateRule(id, data) {
    const [updatedRule] = await db.update(rules).set(data).where(eq(rules.id, id)).returning();
    return updatedRule;
  }
  async deleteRule(id) {
    await db.delete(rules).where(eq(rules.id, id));
    return true;
  }
  // Badge operations
  async getBadgesByParentId(parentId) {
    return db.select().from(badges).where(eq(badges.parentId, parentId));
  }
  async createBadge(badge) {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }
  async updateBadge(id, data) {
    const [updatedBadge] = await db.update(badges).set(data).where(eq(badges.id, id)).returning();
    return updatedBadge;
  }
  async deleteBadge(id) {
    await db.delete(badges).where(eq(badges.id, id));
    return true;
  }
  async getBadge(id) {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }
  async checkChildHasBadge(childId, badgeId) {
    const result = await db.select().from(childBadges).where(
      and(
        eq(childBadges.childId, childId),
        eq(childBadges.badgeId, badgeId)
      )
    );
    return result.length > 0;
  }
  async awardBadgeToChild(data) {
    const [inserted] = await db.insert(childBadges).values(data).returning();
    return inserted;
  }
  // Child Badge operations
  async getChildBadgesByChildId(childId) {
    return db.select().from(childBadges).where(eq(childBadges.childId, childId));
  }
  async createChildBadge(childBadge) {
    const [newChildBadge] = await db.insert(childBadges).values({
      ...childBadge,
      dateEarned: /* @__PURE__ */ new Date()
    }).returning();
    return newChildBadge;
  }
};

// server/storage.ts
var MemoryStore = createMemoryStore(session2);
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session3 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = randomBytes(32).toString("hex");
  }
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session3(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name, role, parentId, age } = req.body;
      if (!username || !password || !name || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (role !== "parent" && role !== "child") {
        return res.status(400).json({ message: "Invalid role" });
      }
      if (role === "child" && !parentId) {
        return res.status(400).json({ message: "Children must have a parent" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (role === "child" && parentId) {
        const parent = await storage.getUser(parentId);
        if (!parent || parent.role !== "parent") {
          return res.status(400).json({ message: "Invalid parent" });
        }
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        role,
        parentId: role === "child" ? parentId : void 0,
        age: role === "child" ? age : void 0,
        imageUrl: req.body.imageUrl || null
      });
      const { password: _, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err2) => {
        if (err2) return next(err2);
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

// server/routes.ts
import { z as z2 } from "zod";
import { scrypt as scrypt2, randomBytes as randomBytes2 } from "crypto";
import { promisify as promisify2 } from "util";
var isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
var isParent = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.role === "parent") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Parent access required" });
};
var isChild = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.role === "child") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Child access required" });
};
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/children", isParent, async (req, res) => {
    try {
      const children = await storage.getChildrenByParentId(req.user.id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ message: "Failed to get children" });
    }
  });
  app2.post("/api/children", isParent, async (req, res) => {
    try {
      req.body.parentId = req.user.id;
      req.body.role = "child";
      req.body.imageUrl = req.body.imageUrl || null;
      const response = await fetch(`http://localhost:${process.env.PORT || 5e3}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create child account" });
    }
  });
  app2.put("/api/children/:id", isParent, async (req, res) => {
    const childId = parseInt(req.params.id);
    const { name, age, username, password, imageUrl } = req.body;
    try {
      const child = await storage.getUser(childId);
      if (!child || child.role !== "child") {
        return res.status(404).json({ message: "Child not found" });
      }
      if (child.parentId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      if (!name || !username || !age) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (username !== child.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      const updateData = {
        name,
        age,
        username
      };
      if (password) {
        updateData.password = await hashPassword2(password);
      }
      if (imageUrl) updateData.imageUrl = imageUrl;
      const updatedChild = await storage.updateUser(childId, updateData);
      const { password: _, ...childWithoutPassword } = updatedChild;
      res.json(childWithoutPassword);
    } catch (err) {
      console.error("Update failed:", err);
      res.status(500).json({ message: "Failed to update child account" });
    }
  });
  app2.get("/api/activities/:childId", isAuthenticated, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      if (req.user.role === "parent") {
        const children = await storage.getChildrenByParentId(req.user.id);
        if (!children.some((child) => child.id === childId)) {
          return res.status(403).json({ message: "You don't have access to this child's activities" });
        }
      } else if (req.user.role === "child" && req.user.id !== childId) {
        return res.status(403).json({ message: "You can only view your own activities" });
      }
      const activities2 = await storage.getActivitiesByChildId(childId);
      res.json(activities2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });
  app2.post("/api/activities", isParent, async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const children = await storage.getChildrenByParentId(req.user.id);
      if (!children.some((child) => child.id === activityData.childId)) {
        return res.status(403).json({ message: "You don't have access to this child" });
      }
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create activity" });
      }
    }
  });
  app2.get("/api/rewards", isAuthenticated, async (req, res) => {
    try {
      let rewards2;
      if (req.user.role === "parent") {
        rewards2 = await storage.getRewardsByParentId(req.user.id);
      } else {
        const child = req.user;
        if (!child.parentId) {
          return res.status(400).json({ message: "Child does not have a parent" });
        }
        rewards2 = await storage.getRewardsByParentId(child.parentId);
      }
      res.json(rewards2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rewards" });
    }
  });
  app2.post("/api/rewards", isParent, async (req, res) => {
    try {
      const rewardData = insertRewardSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid reward data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create reward" });
      }
    }
  });
  app2.put("/api/rewards/:id", isParent, async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const existingReward = await storage.getReward(rewardId);
      if (!existingReward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      if (existingReward.createdBy !== req.user.id && existingReward.createdBy !== 0) {
        return res.status(403).json({ message: "You can only edit your own rewards" });
      }
      const updatedReward = await storage.updateReward(rewardId, req.body);
      res.json(updatedReward);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reward" });
    }
  });
  app2.delete("/api/rewards/:id", isParent, async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const existingReward = await storage.getReward(rewardId);
      if (!existingReward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      if (existingReward.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own rewards" });
      }
      await storage.deleteReward(rewardId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });
  app2.get("/api/redemption-requests", isAuthenticated, async (req, res) => {
    try {
      let requests;
      if (req.user.role === "parent") {
        requests = await storage.getRedemptionRequestsByParentId(req.user.id);
      } else {
        requests = await storage.getRedemptionRequestsByChildId(req.user.id);
      }
      const requestsWithRewards = await Promise.all(
        requests.map(async (request) => {
          const reward = await storage.getReward(request.rewardId);
          return { ...request, reward };
        })
      );
      res.json(requestsWithRewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get redemption requests" });
    }
  });
  app2.post("/api/redemption-requests", isChild, async (req, res) => {
    try {
      const requestData = insertRedemptionRequestSchema.parse({
        ...req.body,
        childId: req.user.id
      });
      const reward = await storage.getReward(requestData.rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      if (req.user.totalPoints < reward.pointsCost) {
        return res.status(400).json({ message: "Not enough points" });
      }
      const request = await storage.createRedemptionRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create redemption request" });
      }
    }
  });
  app2.put("/api/redemption-requests/:id", isParent, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status" });
      }
      const request = await storage.getRedemptionRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      const children = await storage.getChildrenByParentId(req.user.id);
      if (!children.some((child) => child.id === request.childId)) {
        return res.status(403).json({ message: "You don't have access to this request" });
      }
      const updatedRequest = await storage.updateRedemptionRequest(requestId, { status });
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update redemption request" });
    }
  });
  app2.get("/api/rules", isParent, async (req, res) => {
    try {
      const rules2 = await storage.getRulesByParentId(req.user.id);
      res.json(rules2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rules" });
    }
  });
  app2.post("/api/rules", isParent, async (req, res) => {
    try {
      const ruleData = insertRuleSchema.parse({
        ...req.body,
        parentId: req.user.id
      });
      const rule = await storage.createRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create rule" });
      }
    }
  });
  app2.put("/api/rules/:id", isParent, async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      const updatedRule = await storage.updateRule(ruleId, req.body);
      if (!updatedRule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      res.json(updatedRule);
    } catch (error) {
      res.status(500).json({ message: "Failed to update rule" });
    }
  });
  app2.delete("/api/rules/:id", isParent, async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      await storage.deleteRule(ruleId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });
  app2.get("/api/badges", isAuthenticated, async (req, res) => {
    try {
      let badges2;
      if (req.user.role === "parent") {
        badges2 = await storage.getBadgesByParentId(req.user.id);
      } else {
        const child = req.user;
        if (!child.parentId) {
          return res.status(400).json({ message: "Child does not have a parent" });
        }
        badges2 = await storage.getBadgesByParentId(child.parentId);
      }
      res.json(badges2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get badges" });
    }
  });
  app2.post("/api/badges", isParent, async (req, res) => {
    try {
      const badgeData = insertBadgeSchema.parse({
        ...req.body,
        parentId: req.user.id
      });
      const badge = await storage.createBadge(badgeData);
      res.status(201).json(badge);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid badge data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create badge" });
      }
    }
  });
  app2.put("/api/badges/:id", isParent, async (req, res) => {
    try {
      const updated = await storage.updateBadge(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Badge not found" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update badge" });
    }
  });
  app2.delete("/api/badges/:id", isParent, async (req, res) => {
    try {
      const deleted = await storage.deleteBadge(parseInt(req.params.id));
      res.status(deleted ? 200 : 404).json({ message: deleted ? "Deleted" : "Not found" });
    } catch {
      res.status(500).json({ message: "Failed to delete badge" });
    }
  });
  app2.post("/api/badges/allot", isParent, async (req, res) => {
    try {
      console.log("Inside Allot");
      const parentId = req.user.id;
      const badges2 = await storage.getBadgesByParentId(parentId);
      const children = await storage.getChildrenByParentId(parentId);
      const rules2 = await storage.getRulesByParentId(parentId);
      console.log("Children::", children);
      for (const child of children) {
        const activities2 = await storage.getActivitiesByChildId(child.id);
        console.log(`${child.name} Actvities::`, activities2);
        for (const badge of badges2) {
          console.log("Badge:::", badge);
          const ruleName = badge.activityType;
          const streakDates = getSortedActivityDates(activities2, ruleName);
          console.log("StreakDates::", streakDates);
          const streak = countConsecutiveDays(streakDates);
          const alreadyHas = await storage.checkChildHasBadge(child.id, badge.id);
          console.log("Streak::", streak);
          console.log("alreadyHas::", alreadyHas);
          if (streak >= badge.requiredDays && !alreadyHas) {
            const response = await storage.awardBadgeToChild({
              childId: child.id,
              badgeId: badge.id
            });
          }
        }
      }
      res.status(200).json({ message: "Badges allotted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to allot badges" });
    }
  });
  function getSortedActivityDates(activities2, ruleName) {
    const filtered = activities2.filter((a) => a.description.toLowerCase() === ruleName.toLowerCase()).map((a) => a.date.toISOString().split("T")[0]);
    return [...new Set(filtered)].sort();
  }
  function countConsecutiveDays(dates) {
    if (dates.length === 0) return 0;
    let streak = 1;
    let maxStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1e3 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }
    return maxStreak;
  }
  app2.get("/api/child-badges/:childId", isAuthenticated, async (req, res) => {
    try {
      console.log("Child Id::GET ");
      const childId = parseInt(req.params.childId);
      console.log("Child Id::", childId);
      console.log("User Role ::", req.user.role);
      if (req.user.role === "parent") {
        const children = await storage.getChildrenByParentId(req.user.id);
        if (!children.some((child) => child.id === childId)) {
          return res.status(403).json({ message: "You don't have access to this child's badges" });
        }
      } else if (req.user.role === "child" && req.user.id !== childId) {
        return res.status(403).json({ message: "You can only view your own badges" });
      }
      const childBadges2 = await storage.getChildBadgesByChildId(childId);
      const badgeDetails = await Promise.all(
        childBadges2.map(async (childBadge) => {
          const badge = await storage.getBadgesByParentId(req.user.role === "parent" ? req.user.id : req.user.parentId);
          const matchingBadge = badge.find((b) => b.id === childBadge.badgeId);
          return { ...childBadge, badge: matchingBadge };
        })
      );
      console.log("badgeDetails:::", badgeDetails);
      res.json(badgeDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get child badges" });
    }
  });
  const scryptAsync2 = promisify2(scrypt2);
  async function hashPassword2(password) {
    const salt = randomBytes2(16).toString("hex");
    const buf = await scryptAsync2(password, salt, 64);
    return `${buf.toString("hex")}.${salt}`;
  }
  app2.get("/api/reports/rewards", isParent, async (req, res) => {
    try {
      const rewards2 = await storage.getRedemptionRequestsByParentId(req.user.id);
      const rewardsWithDetails = await Promise.all(
        rewards2.map(async (r) => {
          const reward = await storage.getReward(r.rewardId);
          const child = await storage.getUser(r.childId);
          return {
            id: r.id,
            child: child.name,
            reward: reward.name,
            date: r.requestDate
          };
        })
      );
      res.json(rewardsWithDetails);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch rewards report" });
    }
  });
  app2.get("/api/reports/top-rules", isParent, async (req, res) => {
    try {
      const { child } = req.query;
      let children = await storage.getChildrenByParentId(req.user.id);
      const allActivities = [];
      if (child && child !== "all") {
        children = children.filter((c) => c.name === child);
      }
      for (const child2 of children) {
        const activities2 = await storage.getActivitiesByChildId(child2.id);
        const positiveActivities = activities2.filter((act) => act.points > 0);
        allActivities.push(...positiveActivities);
      }
      const ruleMap = /* @__PURE__ */ new Map();
      for (const act of allActivities) {
        const desc2 = act.description;
        ruleMap.set(desc2, (ruleMap.get(desc2) || 0) + 1);
      }
      const topRules = Array.from(ruleMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      res.json(topRules);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch top rules" });
    }
  });
  app2.get("/api/reports/points-trend", isParent, async (req, res) => {
    try {
      const { child } = req.query;
      let children = await storage.getChildrenByParentId(req.user.id);
      const allActivities = [];
      if (child && child !== "all") {
        children = children.filter((c) => c.name === child);
      }
      for (const child2 of children) {
        const activities2 = await storage.getActivitiesByChildId(child2.id);
        allActivities.push(...activities2);
      }
      const trendMap = /* @__PURE__ */ new Map();
      for (const act of allActivities) {
        const date = new Date(act.date).toISOString().split("T")[0];
        trendMap.set(date, (trendMap.get(date) || 0) + act.points);
      }
      const result = Array.from(trendMap.entries()).map(([date, points]) => ({ date, points })).sort((a, b) => new Date(a.date) - new Date(b.date));
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch points trend" });
    }
  });
  app2.get("/api/reports/top-badges", isParent, async (req, res) => {
    try {
      const { child } = req.query;
      let children = await storage.getChildrenByParentId(req.user.id);
      const allBadges = [];
      if (child && child !== "all") {
        children = children.filter((c) => c.name === child);
      }
      for (const child2 of children) {
        const childBadges2 = await storage.getChildBadgesByChildId(child2.id);
        console.log("childBadges::", childBadges2);
        allBadges.push(...childBadges2);
      }
      const badgeMap = /* @__PURE__ */ new Map();
      console.log("allBadges::", allBadges);
      for (const b of allBadges) {
        console.log("Badge::", b);
        const badge = await storage.getBadge(b.badgeId);
        console.log("Badge::", badge);
        badgeMap.set(badge.name, (badgeMap.get(badge.name) || 0) + 1);
      }
      console.log("badgeMap::", badgeMap);
      const result = Array.from(badgeMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      console.log("result:", result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5001;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
