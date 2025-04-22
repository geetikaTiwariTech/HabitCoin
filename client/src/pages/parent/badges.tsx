import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Pencil,
    Trash2,
    Loader2,
} from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";


interface Badge {
    id: number;
    name: string;
    description: string;
    icon: string;
    requiredDays: number;
    activityType: string;
    parentId: number;
}

//const ICONS = ["⭐", "🏅", "🎖️", "👑", "💎", "🎯"];
const ICONS = [
    "🏅", // medal
    "🎖️", // military medal
    "👑", // crown
    "💎", // diamond
    "⭐", // star
    "🌟", // glowing star
    "🚀", // rocket
    "🔥", // fire
    "🎯", // dart board / focus
    "🧠", // brain
    "📚", // books
    "🧹", // cleaning
    "💡", // idea
    "🏆", // trophy
    "🪄", // magic wand
    "⚡", // lightning
    "🌈", // rainbow
    "🎮", // game controller
    "🧸", // teddy bear
    "🦸",   // superhero
];


export default function ParentBadges() {
    const { toast } = useToast();
    const [badgeName, setBadgeName] = useState("");
    const [badgeDesc, setBadgeDesc] = useState("");
    const [icon, setIcon] = useState("");
    const [requiredDays, setRequiredDays] = useState<number>(1);
    const [activityType, setActivityType] = useState("");
    const [editId, setEditId] = useState<number | null>(null);

    const { data: rules = [] } = useQuery<{ id: number; name: string }[]>({
        queryKey: ["/api/rules"],
    });

    const { data: badges = [], isLoading, refetch } = useQuery<Badge[]>({
        queryKey: ["/api/badges"],
        queryFn: async () => {
      const response = await fetch("/api/badges", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch badges");
      return response.json();
    },
    });

    const resetForm = () => {
        setBadgeName("");
        setBadgeDesc("");
        setIcon("");
        setActivityType("");
        setRequiredDays(1);
        setEditId(null);
    };

    const createBadgeMutation = useMutation({
        mutationFn: async () => {
            if (!badgeName || !badgeDesc || !icon || !activityType || !requiredDays) {
                throw new Error("All fields are required");
            }

            const payload = {
                name: badgeName,
                description: badgeDesc,
                icon,
                requiredDays,
                activityType,
            };

            if (editId) {
                await apiRequest("PUT", `/api/badges/${editId}`, payload);
            } else {
                await apiRequest("POST", "/api/badges", payload);
            }
        },
        onSuccess: () => {
            toast({
                title: editId ? "Badge updated" : "Badge created",
            });
            refetch();
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: "Error saving badge",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const allotBadgesMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/badges/allot");
        },
        onSuccess: () => {
            toast({
                title: "Badges Allotted Successfully 🎉",
                description: "Children who met streak goals have received their badges.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error allotting badges",
                description: error.message,
                variant: "destructive",
            });
        },
    });


    const deleteBadgeMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/badges/${id}`);
        },
        onSuccess: () => {
            toast({ title: "Badge deleted" });
            refetch();
        },
    });

    return (
        <div className="py-6 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Badges</h2>
                    <p className="text-gray-600">Create and manage badges based on rule streaks</p>
                </div>
                <Button variant="outline" onClick={() => allotBadgesMutation.mutate()}
                    disabled={allotBadgesMutation.isPending}>
                    {allotBadgesMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Allotting...
                        </>
                    ) : (
                        "Allot Badges"
                    )}
                </Button>

            </div>


            {/* Create/Edit Badge Form */}
            <Card className="mb-10">
                <CardHeader>
                    <CardTitle>{editId ? "Edit Badge" : "Create a New Badge"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Badge Name</label>
                        <Input value={badgeName} onChange={(e) => setBadgeName(e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <Textarea value={badgeDesc} onChange={(e) => setBadgeDesc(e.target.value)} />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Streak Required (Days)</label>
                        <Input
                            type="number"
                            min={1}
                            value={requiredDays}
                            onChange={(e) => setRequiredDays(parseInt(e.target.value))}
                            placeholder="e.g. 7"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Rule to Link</label>
                        <Select value={activityType} onValueChange={setActivityType}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Rule" />
                            </SelectTrigger>
                            <SelectContent>
                                {rules.map((rule) => (
                                    <SelectItem key={rule.id} value={rule.name}>
                                        {rule.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Select Icon</label>
                        <div className="flex gap-2 flex-wrap">
                            {ICONS.map((i) => (
                                <button
                                    key={i}
                                    onClick={() => setIcon(i)}
                                    className={`text-2xl p-2 border rounded ${icon === i ? "bg-blue-200" : "hover:bg-gray-100"}`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button onClick={() => createBadgeMutation.mutate()} disabled={createBadgeMutation.isPending}>
                        {createBadgeMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        {editId ? "Update Badge" : "Create Badge"}
                    </Button>
                </CardContent>
            </Card>

            {/* Existing Badges */}
            <Card>
                <CardHeader>
                    <CardTitle>Existing Badges</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center p-6">
                            <Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" />
                            <p>Loading badges...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {badges.map((badge) => (
                                <div key={badge.id} className="border p-4 rounded text-center">
                                    <div className="text-4xl">{badge.icon}</div>
                                    <h3 className="font-semibold mt-2">{badge.name}</h3>
                                    <p className="text-sm text-gray-500">{badge.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Rule: <strong>{badge.activityType}</strong> | Streak: {badge.requiredDays} days
                                    </p>
                                    <div className="flex justify-center gap-2 mt-3">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditId(badge.id);
                                                setBadgeName(badge.name);
                                                setBadgeDesc(badge.description);
                                                setIcon(badge.icon);
                                                setRequiredDays(badge.requiredDays);
                                                setActivityType(badge.activityType);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        {/* Delete with Confirmation */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="ghost" className="text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                                </DialogHeader>
                                                <p className="text-sm text-gray-600">
                                                    Are you sure you want to delete <strong>{badge.name}</strong>? This cannot be undone.
                                                </p>
                                                <DialogFooter>
                                                    <Button variant="outline">Cancel</Button>
                                                    <Button variant="destructive" onClick={() => deleteBadgeMutation.mutate(badge.id)}>
                                                        Delete
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
