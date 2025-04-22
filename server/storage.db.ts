import { db, pool } from "./db";
import { eq, and, inArray, or, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { 
  users, activities, rewards, redemptionRequests, 
  rules, badges, childBadges, 
  User, InsertUser, Activity, InsertActivity, 
  Reward, InsertReward, RedemptionRequest, InsertRedemptionRequest,
  Rule, InsertRule, Badge, InsertBadge, ChildBadge, InsertChildBadge
} from "@shared/schema";
import { IStorage } from "./storage";

// Configure session store with PostgreSQL
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any to fix the type issue

  constructor() {
    // Set up session store with our PostgreSQL connection
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });

    // Add sample rewards if none exist yet
    this.initializeSampleRewards();
  }

  // Helper function to initialize sample rewards if needed
  private async initializeSampleRewards() {
    try {
      // We'll add sample rewards when the first parent is created
      // This is safer as it ensures we have a valid user ID for foreign key constraints
      console.log("Sample rewards will be created when the first parent user registers");
    } catch (error) {
      console.error("Error initializing rewards system:", error);
    }
  }
  
  // This method will be called when a parent user is created to add sample rewards
  private async createSampleRewardsForParent(parentId: number) {
    try {
      // Check if we already have rewards for this parent
      const existingRewards = await db.select()
        .from(rewards)
        .where(eq(rewards.createdBy, parentId));
      
      // Only add sample rewards if this parent doesn't have any yet
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
  
        // Insert each reward
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
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      totalPoints: 0
    }).returning();
    
    // If this is a parent user, create sample rewards for them
    if (user.role === "parent") {
      await this.createSampleRewardsForParent(newUser.id);
    }
    
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true; // PostgreSQL doesn't return boolean for delete operations
  }

  async getChildrenByParentId(parentId: number): Promise<User[]> {
    return db.select().from(users).where(
      and(
        eq(users.parentId, parentId),
        eq(users.role, "child")
      )
    );
  }

  // Activity operations
  async getActivitiesByChildId(childId: number): Promise<Activity[]> {
    return db.select()
      .from(activities)
      .where(eq(activities.childId, childId))
      .orderBy(desc(activities.date));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    
    // Update child's total points
    const child = await this.getUser(activity.childId);
    if (child) {
      await this.updateUser(child.id, {
        totalPoints: (child.totalPoints || 0) + activity.points,
      });
    }
    
    return newActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    // Get the activity first to update points
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    
    if (activity) {
      // Update child's total points
      const child = await this.getUser(activity.childId);
      if (child) {
        await this.updateUser(child.id, {
          totalPoints: Math.max(0, (child.totalPoints || 0) - activity.points),
        });
      }
      
      await db.delete(activities).where(eq(activities.id, id));
    }
    
    return true;
  }

  // Reward operations
  async getRewards(): Promise<Reward[]> {
    return db.select().from(rewards);
  }

  async getRewardsByParentId(parentId: number): Promise<Reward[]> {
    return db.select().from(rewards).where(
      or(
        eq(rewards.createdBy, parentId),
        eq(rewards.isGlobal, true)
      )
    );
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async updateReward(id: number, data: Partial<Reward>): Promise<Reward | undefined> {
    const [updatedReward] = await db.update(rewards)
      .set(data)
      .where(eq(rewards.id, id))
      .returning();
    return updatedReward;
  }

  async deleteReward(id: number): Promise<boolean> {
    await db.delete(rewards).where(eq(rewards.id, id));
    return true;
  }

  // Redemption request operations
  async getRedemptionRequestsByChildId(childId: number): Promise<RedemptionRequest[]> {
    return db.select()
      .from(redemptionRequests)
      .where(eq(redemptionRequests.childId, childId))
      .orderBy(desc(redemptionRequests.requestDate));
  }

  async getRedemptionRequestsByParentId(parentId: number): Promise<RedemptionRequest[]> {
    // Get all children for this parent
    const children = await this.getChildrenByParentId(parentId);
    const childIds = children.map(child => child.id);
    
    if (childIds.length === 0) {
      return [];
    }
    
    // Get redemption requests for all children
    return db.select()
      .from(redemptionRequests)
      .where(inArray(redemptionRequests.childId, childIds))
      .orderBy(desc(redemptionRequests.requestDate));
  }

  async createRedemptionRequest(request: InsertRedemptionRequest): Promise<RedemptionRequest> {
    const [newRequest] = await db.insert(redemptionRequests)
      .values({
        ...request,
        status: "pending",
        requestDate: new Date(),
      })
      .returning();
      
    return newRequest;
  }

  async updateRedemptionRequest(id: number, data: Partial<RedemptionRequest>): Promise<RedemptionRequest | undefined> {
    // Get the current request first
    const [currentRequest] = await db.select().from(redemptionRequests)
      .where(eq(redemptionRequests.id, id));
      
    if (!currentRequest) return undefined;
    
    // Update the request
    const [updatedRequest] = await db.update(redemptionRequests)
      .set(data)
      .where(eq(redemptionRequests.id, id))
      .returning();
      
    // If status changed to approved, update points
    if (currentRequest.status !== "approved" && updatedRequest.status === "approved") {
      const reward = await this.getReward(currentRequest.rewardId);
      const child = await this.getUser(currentRequest.childId);
      
      if (reward && child) {
        await this.updateUser(child.id, {
          totalPoints: Math.max(0, (child.totalPoints || 0) - reward.pointsCost),
        });
      }
    }
    
    return updatedRequest;
  }

  async getRedemptionRequest(id: number): Promise<RedemptionRequest | undefined> {
    const [request] = await db.select().from(redemptionRequests)
      .where(eq(redemptionRequests.id, id));
    return request;
  }

  // Rule operations
  async getRulesByParentId(parentId: number): Promise<Rule[]> {
    return db.select().from(rules).where(eq(rules.parentId, parentId));
  }

  async createRule(rule: InsertRule): Promise<Rule> {
    const [newRule] = await db.insert(rules).values(rule).returning();
    return newRule;
  }

  async updateRule(id: number, data: Partial<Rule>): Promise<Rule | undefined> {
    const [updatedRule] = await db.update(rules)
      .set(data)
      .where(eq(rules.id, id))
      .returning();
    return updatedRule;
  }

  async deleteRule(id: number): Promise<boolean> {
    await db.delete(rules).where(eq(rules.id, id));
    return true;
  }

  // Badge operations
  async getBadgesByParentId(parentId: number): Promise<Badge[]> {
    return db.select().from(badges).where(eq(badges.parentId, parentId));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined> {
    const [updatedBadge] = await db.update(badges)
      .set(data)
      .where(eq(badges.id, id))
      .returning();
    return updatedBadge;
  }

  async deleteBadge(id: number): Promise<boolean> {
    await db.delete(badges).where(eq(badges.id, id));
    return true;
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async checkChildHasBadge(childId: number, badgeId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(childBadges)
      .where(
        and(
          eq(childBadges.childId, childId),
          eq(childBadges.badgeId, badgeId)
        )
      );
  
    return result.length > 0;
  }
  
  async awardBadgeToChild(data: InsertChildBadge): Promise<ChildBadge> {
    const [inserted] = await db
      .insert(childBadges)
      .values(data)
      .returning();
  
    return inserted;
  }

  // Child Badge operations
  async getChildBadgesByChildId(childId: number): Promise<ChildBadge[]> {
    return db.select().from(childBadges).where(eq(childBadges.childId, childId));
  }

  async createChildBadge(childBadge: InsertChildBadge): Promise<ChildBadge> {
    const [newChildBadge] = await db.insert(childBadges)
      .values({
        ...childBadge,
        dateEarned: new Date()
      })
      .returning();
    return newChildBadge;
  }
}