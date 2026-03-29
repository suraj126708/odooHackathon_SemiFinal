import { useEffect, useState } from "react";
import axiosInstance from "../Authorisation/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setUser(authUser);

      if (!authUser?.id && !authUser?._id) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get("/api/auth/profile");
        if (response?.data?.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setUser(authUser);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [authUser?.id, authUser?._id]);

  const profilePictureSrc =
    user?.profilePicture && typeof user.profilePicture === "string"
      ? user.profilePicture.startsWith("http")
        ? user.profilePicture
        : `http://localhost:8080${user.profilePicture}`
      : "https://flowbite.com/docs/images/people/profile-picture-3.jpg";

  return (
    <div className="page-shell flex min-h-[calc(100vh-3.5rem)] flex-col justify-center">
      <Card className="surface-glow mx-auto w-full max-w-xl border-cyan-500/15">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <img
                  src={profilePictureSrc}
                  alt={user?.name || "Profile"}
                  className="h-16 w-16 rounded-full border border-border object-cover"
                />
                <div className="flex-1 space-y-1">
                  <h2 className="text-2xl font-semibold text-foreground">
                    {user?.name || "User"}
                  </h2>
                  {user?.username && (
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Email: {user?.email || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Role: {user?.role || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button variant="destructive" onClick={logout}>
                  Logout
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
