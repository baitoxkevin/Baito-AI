import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return null;
  }

  if (session) {
    // Check user role and redirect accordingly
    // For now, redirect to worker
    return <Redirect href="/worker" />;
  }

  return <Redirect href="/auth/login" />;
}
