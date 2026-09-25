import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProfile = async (userId) => {
    try {
      console.log("=================================");
      console.log("Mencari profile...");
      console.log("User ID:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.log("Profile error:", error);
        return null;
      }

      if (!data) {
        console.log("Profile tidak ditemukan.");
        return null;
      }

      console.log("Profile ditemukan:", data);
      console.log("Nama:", data.nama);
      console.log("Role:", data.role);
      console.log("Jabatan:", data.jabatan);
      console.log("Divisi:", data.divisi);

      return data;
    } catch (error) {
      console.log("Get profile error:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);

        if (session?.user?.id) {
          const userProfile = await getProfile(
            session.user.id
          );

          if (mounted) {
            setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.log("Auth initialize error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("AUTH EVENT:", event);
        console.log("AUTH SESSION:", currentSession);

        if (!mounted) return;

        setSession(currentSession);

        if (currentSession?.user?.id) {
          const userProfile = await getProfile(
            currentSession.user.id
          );

          if (mounted) {
            setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    console.log("=================================");
    console.log("LOGIN START");
    console.log("Email:", email);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.log("Login Supabase error:", error);
      throw error;
    }

    if (!data?.user) {
      throw new Error("User tidak ditemukan.");
    }

    console.log("Login berhasil.");
    console.log("Auth User ID:", data.user.id);

    const userProfile = await getProfile(
      data.user.id
    );

    if (!userProfile) {
      await supabase.auth.signOut();

      throw new Error(
        "Profile pengguna tidak ditemukan di database."
      );
    }

    setSession(data.session);
    setProfile(userProfile);

    return {
      ...data,
      profile: userProfile,
    };
  };

  const logout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!session?.user?.id) {
      return null;
    }

    const userProfile = await getProfile(
      session.user.id
    );

    setProfile(userProfile);

    return userProfile;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};