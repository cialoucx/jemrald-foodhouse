import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

const AuthContext = createContext();

function buildUser(authUser, profile) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: profile?.name || authUser.email,
    role: profile?.role || 'customer',
    phone: profile?.phone || '',
    address: profile?.address || '',
    avatar_url: profile?.avatar_url || '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    setUser(buildUser(authUser, profile));
    setLoading(false);
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const userData = buildUser(data.user, profile);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;

    let userData = {
      id: data.user?.id,
      email: data.user?.email,
      name,
      role: 'customer',
      phone: '',
      address: '',
      avatar_url: '',
    };

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, name, email, role: 'customer' });
      if (profileError) throw profileError;
      setUser(userData);
    }
    return userData;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');

    // Filter to only safe fields
    const allowed = ['name', 'phone', 'address', 'avatar_url'];
    const filtered = {};
    for (const key of allowed) {
      if (key in updates) filtered[key] = updates[key];
    }

    if (Object.keys(filtered).length === 0) {
      showToast('No changes to save.');
      return;
    }

    const { error } = await supabase.from('profiles').update(filtered).eq('id', user.id);

    if (error) throw error;

    setUser((prev) => ({ ...prev, ...filtered }));
    showToast('Profile updated successfully!');
  };

  const uploadAvatar = async (file) => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        throw new Error('Storage not configured. Please contact support to set up image uploads.');
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
    await updateProfile({ avatar_url: avatarUrl });
    return avatarUrl;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    showToast('You have been logged out.');
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateProfile, uploadAvatar, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
