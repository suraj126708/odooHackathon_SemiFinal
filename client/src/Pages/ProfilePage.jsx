import React, { useEffect, useState } from "react";
import axiosInstance from "../Authorisation/axiosConfig";
import { useAuth } from "../Authorisation/AuthProvider";
import { Button } from "../components/ui/button";

const ProfilePage = () => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      // If user exists locally, show it immediately while we verify via API.
      setUser(authUser);

      if (!authUser?._id) {
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
        // Keep local authUser as a fallback.
        setUser(authUser);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [authUser?._id]);

  const profilePictureSrc =
    user?.profilePicture && typeof user.profilePicture === "string"
      ? user.profilePicture.startsWith("http")
        ? user.profilePicture
        : `http://localhost:8080${user.profilePicture}`
      : "https://flowbite.com/docs/images/people/profile-picture-3.jpg";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-8 px-4">
      <div className="max-w-xl w-full mx-auto">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-200 p-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <img
                  src={profilePictureSrc}
                  alt={user?.name || "Profile"}
                  className="w-16 h-16 rounded-full object-cover border border-gray-200"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.name || "User"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    @{user?.username || "username"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Email: {user?.email || "—"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Role: {user?.role || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={logout}
                  variant="destructive"
                  className="px-4"
                >
                  Logout
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

