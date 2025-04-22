import { activities, badges, childBadges, redemptionRequests, rewards, rules, users, type User, type InsertUser, type Activity, type InsertActivity, type Reward, type InsertReward, type RedemptionRequest, type InsertRedemptionRequest, type Rule, type InsertRule, type Badge, type InsertBadge, type ChildBadge, type InsertChildBadge } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getChildrenByParentId(parentId: number): Promise<User[]>;

  // Activity operations
  getActivitiesByChildId(childId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: number): Promise<boolean>;

  // Reward operations
  getRewards(): Promise<Reward[]>;
  getRewardsByParentId(parentId: number): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, data: Partial<Reward>): Promise<Reward | undefined>;
  deleteReward(id: number): Promise<boolean>;

  // Redemption request operations
  getRedemptionRequestsByChildId(childId: number): Promise<RedemptionRequest[]>;
  getRedemptionRequestsByParentId(parentId: number): Promise<RedemptionRequest[]>;
  createRedemptionRequest(request: InsertRedemptionRequest): Promise<RedemptionRequest>;
  updateRedemptionRequest(id: number, data: Partial<RedemptionRequest>): Promise<RedemptionRequest | undefined>;
  getRedemptionRequest(id: number): Promise<RedemptionRequest | undefined>;

  // Rule operations
  getRulesByParentId(parentId: number): Promise<Rule[]>;
  createRule(rule: InsertRule): Promise<Rule>;
  updateRule(id: number, data: Partial<Rule>): Promise<Rule | undefined>;
  deleteRule(id: number): Promise<boolean>;

  // Badge operations
  getBadgesByParentId(parentId: number): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined>;
  deleteBadge(id: number): Promise<boolean>;
  checkChildHasBadge(childId: number, badgeId: number): Promise<boolean>;
  awardBadgeToChild(data: InsertChildBadge): Promise<ChildBadge>;
  

  // Child Badge operations
  getChildBadgesByChildId(childId: number): Promise<ChildBadge[]>;
  createChildBadge(childBadge: InsertChildBadge): Promise<ChildBadge>;

  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private activitiesMap: Map<number, Activity>;
  private rewardsMap: Map<number, Reward>;
  private redemptionRequestsMap: Map<number, RedemptionRequest>;
  private rulesMap: Map<number, Rule>;
  private badgesMap: Map<number, Badge>;
  private childBadgesMap: Map<number, ChildBadge>;
  private userIdCounter: number;
  private activityIdCounter: number;
  private rewardIdCounter: number;
  private redemptionRequestIdCounter: number;
  private ruleIdCounter: number;
  private badgeIdCounter: number;
  private childBadgeIdCounter: number;
  
  sessionStore: any;

  constructor() {
    this.usersMap = new Map();
    this.activitiesMap = new Map();
    this.rewardsMap = new Map();
    this.redemptionRequestsMap = new Map();
    this.rulesMap = new Map();
    this.badgesMap = new Map();
    this.childBadgesMap = new Map();
    this.userIdCounter = 1;
    this.activityIdCounter = 1;
    this.rewardIdCounter = 1;
    this.redemptionRequestIdCounter = 1;
    this.ruleIdCounter = 1;
    this.badgeIdCounter = 1;
    this.childBadgeIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add some sample rewards that all parents can use
    this.addSampleRewards();
  }

  // Add sample rewards for testing
  private addSampleRewards() {
    const sampleRewards: InsertReward[] = [
      {
        name: "Video Game: Minecraft",
        description: "Popular sandbox game",
        imageUrl: "https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        pointsCost: 250,
        createdBy: 0, // System created
        isGlobal: true
      },
      {
        name: "Lego Friends Set",
        description: "Building blocks set",
        imageUrl: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        pointsCost: 150,
        createdBy: 0, // System created
        isGlobal: true
      },
      {
        name: "Bike Accessory Kit",
        description: "Accessories for your bike",
        imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        pointsCost: 100,
        createdBy: 0, // System created
        isGlobal: true
      },
      {
        name: "Ice Cream Trip",
        description: "Trip to get ice cream",
        imageUrl: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        pointsCost: 50,
        createdBy: 0, // System created
        isGlobal: true
      },
      {
        name: "Extra Tablet Time (1hr)",
        description: "One hour of extra tablet time",
        imageUrl: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        pointsCost: 30,
        createdBy: 0, // System created
        isGlobal: true
      },
      {
        name: "Family Movie Night",
        description: "Choose a movie for family night",
        imageUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
        pointsCost: 75,
        createdBy: 0, // System created
        isGlobal: true
      }
    ];

    sampleRewards.forEach(reward => {
      const id = this.rewardIdCounter++;
      this.rewardsMap.set(id, { ...reward, id });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id, totalPoints: 0 };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  async getChildrenByParentId(parentId: number): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(
      (user) => user.parentId === parentId && user.role === "child"
    );
  }

  // Activity operations
  async getActivitiesByChildId(childId: number): Promise<Activity[]> {
    return Array.from(this.activitiesMap.values())
      .filter((activity) => activity.childId === childId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const newActivity: Activity = { ...activity, id };
    this.activitiesMap.set(id, newActivity);

    // Update child's total points
    const child = this.usersMap.get(activity.childId);
    if (child) {
      const updatedPoints = (child.totalPoints || 0) + activity.points;
      this.usersMap.set(child.id, { ...child, totalPoints: updatedPoints });
    }

    return newActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const activity = this.activitiesMap.get(id);
    if (!activity) return false;

    // Revert points from child's total
    const child = this.usersMap.get(activity.childId);
    if (child) {
      const updatedPoints = (child.totalPoints || 0) - activity.points;
      this.usersMap.set(child.id, { ...child, totalPoints: updatedPoints });
    }

    return this.activitiesMap.delete(id);
  }

  // Reward operations
  async getRewards(): Promise<Reward[]> {
    return Array.from(this.rewardsMap.values());
  }

  async getRewardsByParentId(parentId: number): Promise<Reward[]> {
    return Array.from(this.rewardsMap.values()).filter(
      (reward) => reward.createdBy === parentId || reward.isGlobal
    );
  }

  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewardsMap.get(id);
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const id = this.rewardIdCounter++;
    const newReward: Reward = { ...reward, id };
    this.rewardsMap.set(id, newReward);
    return newReward;
  }

  async updateReward(id: number, data: Partial<Reward>): Promise<Reward | undefined> {
    const reward = this.rewardsMap.get(id);
    if (!reward) return undefined;
    
    const updatedReward = { ...reward, ...data };
    this.rewardsMap.set(id, updatedReward);
    return updatedReward;
  }

  async deleteReward(id: number): Promise<boolean> {
    return this.rewardsMap.delete(id);
  }

  // Redemption request operations
  async getRedemptionRequestsByChildId(childId: number): Promise<RedemptionRequest[]> {
    return Array.from(this.redemptionRequestsMap.values())
      .filter((request) => request.childId === childId)
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }

  async getRedemptionRequestsByParentId(parentId: number): Promise<RedemptionRequest[]> {
    const children = await this.getChildrenByParentId(parentId);
    const childIds = children.map(child => child.id);
    
    return Array.from(this.redemptionRequestsMap.values())
      .filter((request) => childIds.includes(request.childId))
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }

  async createRedemptionRequest(request: InsertRedemptionRequest): Promise<RedemptionRequest> {
    const id = this.redemptionRequestIdCounter++;
    const newRequest: RedemptionRequest = { 
      ...request, 
      id, 
      requestDate: new Date(), 
      status: "pending" 
    };
    
    this.redemptionRequestsMap.set(id, newRequest);
    return newRequest;
  }

  async updateRedemptionRequest(id: number, data: Partial<RedemptionRequest>): Promise<RedemptionRequest | undefined> {
    const request = this.redemptionRequestsMap.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...data };
    this.redemptionRequestsMap.set(id, updatedRequest);

    // If the request is approved, deduct points from the child
    if (data.status === "approved" && request.status !== "approved") {
      const reward = await this.getReward(request.rewardId);
      const child = await this.getUser(request.childId);
      
      if (reward && child) {
        const updatedPoints = Math.max(0, (child.totalPoints || 0) - reward.pointsCost);
        await this.updateUser(child.id, { totalPoints: updatedPoints });
      }
    }
    
    return updatedRequest;
  }

  async getRedemptionRequest(id: number): Promise<RedemptionRequest | undefined> {
    return this.redemptionRequestsMap.get(id);
  }

  // Rule operations
  async getRulesByParentId(parentId: number): Promise<Rule[]> {
    return Array.from(this.rulesMap.values()).filter(
      (rule) => rule.parentId === parentId
    );
  }

  async createRule(rule: InsertRule): Promise<Rule> {
    const id = this.ruleIdCounter++;
    const newRule: Rule = { ...rule, id };
    this.rulesMap.set(id, newRule);
    return newRule;
  }

  async updateRule(id: number, data: Partial<Rule>): Promise<Rule | undefined> {
    const rule = this.rulesMap.get(id);
    if (!rule) return undefined;
    
    const updatedRule = { ...rule, ...data };
    this.rulesMap.set(id, updatedRule);
    return updatedRule;
  }

  async deleteRule(id: number): Promise<boolean> {
    return this.rulesMap.delete(id);
  }

  // Badge operations
  async getBadgesByParentId(parentId: number): Promise<Badge[]> {
    return Array.from(this.badgesMap.values()).filter(
      (badge) => badge.parentId === parentId
    );
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.badgeIdCounter++;
    const newBadge: Badge = { ...badge, id };
    this.badgesMap.set(id, newBadge);
    return newBadge;
  }

  async updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined> {
    const badge = this.badgesMap.get(id);
    if (!badge) return undefined;
    
    const updatedBadge = { ...badge, ...data };
    this.badgesMap.set(id, updatedBadge);
    return updatedBadge;
  }

  async deleteBadge(id: number): Promise<boolean> {
    return this.badgesMap.delete(id);
  }
  
  async checkChildHasBadge(childId: number, badgeId: number): Promise<boolean> {
    return Array.from(this.childBadgesMap.values()).some(
      (cb) => cb.childId === childId && cb.badgeId === badgeId
    );
  }
  
  async awardBadgeToChild(data: InsertChildBadge): Promise<ChildBadge> {
    const id = this.childBadgeIdCounter++;
    const newEntry: ChildBadge = { ...data, id, dateEarned: new Date() };
    this.childBadgesMap.set(id, newEntry);
    return newEntry;
  }
  

  // Child Badge operations
  async getChildBadgesByChildId(childId: number): Promise<ChildBadge[]> {
    return Array.from(this.childBadgesMap.values()).filter(
      (childBadge) => childBadge.childId === childId
    );
  }

  async createChildBadge(childBadge: InsertChildBadge): Promise<ChildBadge> {
    const id = this.childBadgeIdCounter++;
    const newChildBadge: ChildBadge = { 
      ...childBadge, 
      id, 
      dateEarned: new Date() 
    };
    
    this.childBadgesMap.set(id, newChildBadge);
    return newChildBadge;
  }
}

// Import the database storage implementation
import { DatabaseStorage } from "./storage.db";

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
