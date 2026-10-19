import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Current user + display name from the profile. */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [displayName, setDisplayName] = useState("");
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let alive = true;
        const load = async (u) => {
            if (!alive)
                return;
            setUser(u);
            setReady(true);
            if (!u) {
                setDisplayName("");
                return;
            }
            const { data } = await supabase.from("profiles").select("display_name").eq("id", u.id).maybeSingle();
            if (alive)
                setDisplayName(data?.display_name || u.email?.split("@")[0] || "Scorer");
        };
        const { data } = supabase.auth.onAuthStateChange((_e, session) => {
            setTimeout(() => load(session?.user ?? null), 0);
        });
        return () => {
            alive = false;
            data.subscription.unsubscribe();
        };
    }, []);
    return { user, displayName, ready };
}
