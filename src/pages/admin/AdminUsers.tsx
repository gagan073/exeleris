import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/database";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  business: "Business",
  expert: "Expert",
  super_admin: "Super Admin",
};

const ROLE_CLASSES: Record<string, string> = {
  business: "bg-blue-100 text-blue-700 border-blue-200",
  expert: "bg-purple-100 text-purple-700 border-purple-200",
  super_admin: "bg-amber-100 text-amber-800 border-amber-200",
};

const AdminUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const setActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.rpc("set_user_active", {
        p_user_id: id,
        p_active: active,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { active }) => {
      toast.success(active ? "Account reactivated." : "Account deactivated.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update the account."),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company_name ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Users</h2>
          <p className="text-muted-foreground">
            Every account on the platform. A deactivated person is signed out and
            can't post, bid, or accept.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        No users match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((u) => {
                      const isActive = u.is_active !== false;
                      const isSelf = u.id === user?.id;
                      const isAdmin = u.role === "super_admin";
                      return (
                        <TableRow key={u.id} className={cn(!isActive && "opacity-60")}>
                          <TableCell className="font-medium text-foreground">
                            {u.full_name || "—"}
                            {u.company_name && (
                              <span className="block text-xs text-muted-foreground">
                                {u.company_name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={ROLE_CLASSES[u.role] ?? ""}>
                              {ROLE_LABELS[u.role] ?? u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {format(parseISO(u.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                                Deactivated
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isAdmin || isSelf ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={setActive.isPending}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Deactivate ${u.full_name || u.email}? They'll be signed out and unable to use the site until reactivated.`
                                    )
                                  ) {
                                    setActive.mutate({ id: u.id, active: false });
                                  }
                                }}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="accent"
                                size="sm"
                                disabled={setActive.isPending}
                                onClick={() => setActive.mutate({ id: u.id, active: true })}
                              >
                                Reactivate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "user" : "users"} shown
        {search && ` (filtered from ${users?.length ?? 0})`}.
      </p>
    </div>
  );
};

export default AdminUsers;
