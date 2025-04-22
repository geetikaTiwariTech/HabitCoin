import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertActivitySchema, insertRewardSchema, insertRedemptionRequestSchema, insertRuleSchema, insertBadgeSchema } from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is a parent
const isParent = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated() && req.user?.role === "parent") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Parent access required" });
};

// Middleware to check if user is a child
const isChild = (req: Request, res: Response, next: () => void) => {
  if (req.isAuthenticated() && req.user?.role === "child") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Child access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get current user's children (for parents)
  app.get("/api/children", isParent, async (req, res) => {
    try {
      const children = await storage.getChildrenByParentId(req.user.id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ message: "Failed to get children" });
    }
  });

  // Create a child account (for parents)
  app.post("/api/children", isParent, async (req, res) => {
    try {
      // The register endpoint will handle the validation and creation
      // We just need to make sure parentId is set
      req.body.parentId = req.user.id;
      req.body.role = "child";
      req.body.imageUrl = req.body.imageUrl || null;
      
      // Forward the request to the register endpoint
      const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
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

  // Update a child account
  app.put("/api/children/:id", isParent, async (req, res) => {
    const childId = parseInt(req.params.id);
    const { name, age, username, password, imageUrl } = req.body;

    try {
      // Fetch the child
      const child = await storage.getUser(childId);

      if (!child || child.role !== "child") {
        return res.status(404).json({ message: "Child not found" });
      }

      // Ensure the child belongs to the logged-in parent
      if (child.parentId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate required fields
      if (!name || !username || !age) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check for username uniqueness if changed
      if (username !== child.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      // Prepare update object
      const updateData: any = {
        name,
        age,
        username,
      };

      if (password) {
        updateData.password = await hashPassword(password);
      }
      
      if (imageUrl) updateData.imageUrl = imageUrl;
      // Update user in DB
      const updatedChild = await storage.updateUser(childId, updateData);

      // Omit password from response
      const { password: _, ...childWithoutPassword } = updatedChild;

      res.json(childWithoutPassword);
    } catch (err) {
      console.error("Update failed:", err);
      res.status(500).json({ message: "Failed to update child account" });
    }
  });

  // Activities
  app.get("/api/activities/:childId", isAuthenticated, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      
      // Check if user has access to this child's data
      if (req.user.role === "parent") {
        const children = await storage.getChildrenByParentId(req.user.id);
        if (!children.some(child => child.id === childId)) {
          return res.status(403).json({ message: "You don't have access to this child's activities" });
        }
      } else if (req.user.role === "child" && req.user.id !== childId) {
        return res.status(403).json({ message: "You can only view your own activities" });
      }
      
      const activities = await storage.getActivitiesByChildId(childId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  app.post("/api/activities", isParent, async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      
      // Check if the child belongs to this parent
      const children = await storage.getChildrenByParentId(req.user.id);
      if (!children.some(child => child.id === activityData.childId)) {
        return res.status(403).json({ message: "You don't have access to this child" });
      }
      
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create activity" });
      }
    }
  });

  // Rewards
  app.get("/api/rewards", isAuthenticated, async (req, res) => {
    try {
      let rewards;
      if (req.user.role === "parent") {
        rewards = await storage.getRewardsByParentId(req.user.id);
      } else {
        // For children, get the parent's rewards
        const child = req.user;
        if (!child.parentId) {
          return res.status(400).json({ message: "Child does not have a parent" });
        }
        rewards = await storage.getRewardsByParentId(child.parentId);
      }
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rewards" });
    }
  });

  app.post("/api/rewards", isParent, async (req, res) => {
    try {
      const rewardData = insertRewardSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid reward data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create reward" });
      }
    }
  });

  app.put("/api/rewards/:id", isParent, async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const existingReward = await storage.getReward(rewardId);
      
      if (!existingReward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Only allow editing rewards created by this parent
      if (existingReward.createdBy !== req.user.id && existingReward.createdBy !== 0) {
        return res.status(403).json({ message: "You can only edit your own rewards" });
      }
      
      const updatedReward = await storage.updateReward(rewardId, req.body);
      res.json(updatedReward);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reward" });
    }
  });

  app.delete("/api/rewards/:id", isParent, async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const existingReward = await storage.getReward(rewardId);
      
      if (!existingReward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Only allow deleting rewards created by this parent
      if (existingReward.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own rewards" });
      }
      
      await storage.deleteReward(rewardId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  // Redemption Requests
  app.get("/api/redemption-requests", isAuthenticated, async (req, res) => {
    try {
      let requests;
      if (req.user.role === "parent") {
        requests = await storage.getRedemptionRequestsByParentId(req.user.id);
      } else {
        requests = await storage.getRedemptionRequestsByChildId(req.user.id);
      }
      
      // Fetch reward details for each request
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

  app.post("/api/redemption-requests", isChild, async (req, res) => {
    try {
      const requestData = insertRedemptionRequestSchema.parse({
        ...req.body,
        childId: req.user.id
      });
      
      // Check if the reward exists
      const reward = await storage.getReward(requestData.rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Check if the child has enough points
      if (req.user.totalPoints < reward.pointsCost) {
        return res.status(400).json({ message: "Not enough points" });
      }
      
      const request = await storage.createRedemptionRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create redemption request" });
      }
    }
  });

  app.put("/api/redemption-requests/:id", isParent, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the request
      const request = await storage.getRedemptionRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Check if the child belongs to this parent
      const children = await storage.getChildrenByParentId(req.user.id);
      if (!children.some(child => child.id === request.childId)) {
        return res.status(403).json({ message: "You don't have access to this request" });
      }
      
      const updatedRequest = await storage.updateRedemptionRequest(requestId, { status });
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update redemption request" });
    }
  });

  // Rules
  app.get("/api/rules", isParent, async (req, res) => {
    try {
      const rules = await storage.getRulesByParentId(req.user.id);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rules" });
    }
  });

  app.post("/api/rules", isParent, async (req, res) => {
    try {
      const ruleData = insertRuleSchema.parse({
        ...req.body,
        parentId: req.user.id
      });
      
      const rule = await storage.createRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create rule" });
      }
    }
  });

  app.put("/api/rules/:id", isParent, async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      
      // Update the rule
      const updatedRule = await storage.updateRule(ruleId, req.body);
      if (!updatedRule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.json(updatedRule);
    } catch (error) {
      res.status(500).json({ message: "Failed to update rule" });
    }
  });

  app.delete("/api/rules/:id", isParent, async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id);
      await storage.deleteRule(ruleId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });

  // Badges
  app.get("/api/badges", isAuthenticated, async (req, res) => {
    try {
      let badges;
      if (req.user.role === "parent") {
        badges = await storage.getBadgesByParentId(req.user.id);
      } else {
        // For children, get the parent's badges
        const child = req.user;
        if (!child.parentId) {
          return res.status(400).json({ message: "Child does not have a parent" });
        }
        badges = await storage.getBadgesByParentId(child.parentId);
      }
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get badges" });
    }
  });

  app.post("/api/badges", isParent, async (req, res) => {
    try {
      const badgeData = insertBadgeSchema.parse({
        ...req.body,
        parentId: req.user.id
      });
      
      const badge = await storage.createBadge(badgeData);
      res.status(201).json(badge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid badge data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create badge" });
      }
    }
  });

  // PUT update badge
  app.put("/api/badges/:id", isParent, async (req, res) => {
    try {
      const updated = await storage.updateBadge(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Badge not found" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update badge" });
    }
  });

  // DELETE badge
  app.delete("/api/badges/:id", isParent, async (req, res) => {
    try {
      const deleted = await storage.deleteBadge(parseInt(req.params.id));
      res.status(deleted ? 200 : 404).json({ message: deleted ? "Deleted" : "Not found" });
    } catch {
      res.status(500).json({ message: "Failed to delete badge" });
    }
  });

  app.post("/api/badges/allot", isParent, async (req, res) => {
    try {
      console.log("Inside Allot");
      const parentId = req.user.id;
      const badges = await storage.getBadgesByParentId(parentId);
      const children = await storage.getChildrenByParentId(parentId);
      const rules = await storage.getRulesByParentId(parentId);
      console.log("Children::",children);
      for (const child of children) {
        const activities = await storage.getActivitiesByChildId(child.id);
        console.log(`${child.name} Actvities::`, activities);
        for (const badge of badges) {
          console.log("Badge:::",badge);
          const ruleName = badge.activityType;
          const streakDates = getSortedActivityDates(activities, ruleName);
          console.log("StreakDates::",streakDates);
          const streak = countConsecutiveDays(streakDates);
          const alreadyHas = await storage.checkChildHasBadge(child.id, badge.id);
          console.log("Streak::",streak);
          console.log("alreadyHas::",alreadyHas);
          if (streak >= badge.requiredDays && !alreadyHas) {
            const response = await storage.awardBadgeToChild({
              childId: child.id,
              badgeId: badge.id,
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

  function getSortedActivityDates(activities: Activity[], ruleName: string): string[] {
    const filtered = activities
      .filter((a) => a.description.toLowerCase() === ruleName.toLowerCase())
      .map((a) => a.date.toISOString().split("T")[0]); // Format as 'YYYY-MM-DD'
    return [...new Set(filtered)].sort();
  }
  
  function countConsecutiveDays(dates: string[]): number {
    if (dates.length === 0) return 0;
  
    let streak = 1;
    let maxStreak = 1;
  
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }
  
    return maxStreak;
  }
  
  
  // Child Badges
  app.get("/api/child-badges/:childId", isAuthenticated, async (req, res) => {
    try {
      console.log("Child Id::GET ");
      const childId = parseInt(req.params.childId);
      console.log("Child Id::",childId);
      console.log("User Role ::",req.user.role);
      // Check if user has access to this child's data
      if (req.user.role === "parent") {
        const children = await storage.getChildrenByParentId(req.user.id);
        if (!children.some(child => child.id === childId)) {
          return res.status(403).json({ message: "You don't have access to this child's badges" });
        }
      } else if (req.user.role === "child" && req.user.id !== childId) {
        return res.status(403).json({ message: "You can only view your own badges" });
      }
      
      const childBadges = await storage.getChildBadgesByChildId(childId);
       
      // Get the badge details for each child badge
      const badgeDetails = await Promise.all(
        childBadges.map(async (childBadge) => {
          const badge = await storage.getBadgesByParentId(req.user.role === "parent" ? req.user.id : req.user.parentId!);
          const matchingBadge = badge.find(b => b.id === childBadge.badgeId);
          return { ...childBadge, badge: matchingBadge };
        })
      );
      console.log("badgeDetails:::",badgeDetails);
      res.json(badgeDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get child badges" });
    }
  });

  const scryptAsync = promisify(scrypt);
  async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  //reports
  app.get("/api/reports/rewards", isParent, async (req, res) => {
    try {
      const rewards = await storage.getRedemptionRequestsByParentId(req.user.id);
  
      const rewardsWithDetails = await Promise.all(
        rewards.map(async (r) => {
          const reward = await storage.getReward(r.rewardId);
          const child = await storage.getUser(r.childId);
          return {
            id: r.id,
            child: child.name,
            reward: reward.name,
            date: r.requestDate,
          };
        })
      );
  
      res.json(rewardsWithDetails);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch rewards report" });
    }
  });
  
  app.get("/api/reports/top-rules", isParent, async (req, res) => {
    try {
      const { child } = req.query;
      let children = await storage.getChildrenByParentId(req.user.id);
      const allActivities = [];
  
      if (child && child !== "all") {
        children = children.filter((c) => c.name === child);
      }
  
      for (const child of children) {
        const activities = await storage.getActivitiesByChildId(child.id);
        // Only include activities with positive points
        const positiveActivities = activities.filter((act) => act.points > 0);
        allActivities.push(...positiveActivities);
      }
  
      const ruleMap = new Map();
  
      for (const act of allActivities) {
        const desc = act.description;
        ruleMap.set(desc, (ruleMap.get(desc) || 0) + 1);
      }
  
      const topRules = Array.from(ruleMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
  
      res.json(topRules);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch top rules" });
    }
  });
  
  
  app.get("/api/reports/points-trend", isParent, async (req, res) => {
    try {
      const { child } = req.query;
      let children = await storage.getChildrenByParentId(req.user.id);
      const allActivities = [];
      
      if (child && child !== "all") {
        children = children.filter((c) => c.name === child);
      }

      for (const child of children) {
        const activities = await storage.getActivitiesByChildId(child.id);
        allActivities.push(...activities);
      }
  
      const trendMap = new Map();
  
      for (const act of allActivities) {
        const date = new Date(act.date).toISOString().split("T")[0];
        trendMap.set(date, (trendMap.get(date) || 0) + act.points);
      }
  
      const result = Array.from(trendMap.entries())
        .map(([date, points]) => ({ date, points }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
  
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch points trend" });
    }
  });
  
  app.get("/api/reports/top-badges", isParent, async (req, res) => {
    try {
      const {child} = req.query;
      let children = await storage.getChildrenByParentId(req.user.id);
      const allBadges = [];
      
      if (child && child !== "all") {
        children = children.filter((c) => c.name === child);
      }
      for (const child of children) {
        const childBadges = await storage.getChildBadgesByChildId(child.id);
        console.log("childBadges::", childBadges);
        allBadges.push(...childBadges);
      }
  
      const badgeMap = new Map();
      console.log("allBadges::", allBadges);
      for (const b of allBadges) {
        console.log("Badge::", b);
        const badge = await storage.getBadge(b.badgeId);
        console.log("Badge::",badge);
        badgeMap.set(badge.name, (badgeMap.get(badge.name) || 0) + 1);
      }
      
      console.log("badgeMap::", badgeMap);
      const result = Array.from(badgeMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      console.log("result:",result);  
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });
  

  const httpServer = createServer(app);
  return httpServer;
}
