import { supabase } from "@/integrations/supabase/client";
import { loadMatches, saveMatches } from "@/lib/matches";

/**
 * Keeps this device's matches (localStorage) mirrored to the signed-in
 * account. Guests stay local-only. On first sign-in, unowned local matches
 * are moved into the account.
 */
const OWNER_KEY = "localscore.owner.v1";
let userId = null;
let suppress = false;
let timer = null;
let started = false;
const lastSent = new Map();

function writeLocal(list) {
    suppress = true;
    try {
        saveMatches(list);
    }
    finally {
        suppress = false;
    }
}

async function pushChanges() {
    if (!userId)
        return;
    const uid = userId;
    const rows = [];
    for (const m of loadMatches()) {
        const json = JSON.stringify(m);
        if (lastSent.get(m.id) === json)
            continue;
        rows.push({ user_id: uid, id: m.id, data: m, updated_at: new Date().toISOString() });
        lastSent.set(m.id, json);
    }
    if (!rows.length)
        return;
    const { error } = await supabase.from("matches").upsert(rows);
    if (error) {
        rows.forEach((r) => lastSent.delete(r.id));
        console.error("Match sync failed", error);
    }
}

function schedulePush() {
    if (suppress || !userId)
        return;
    clearTimeout(timer);
    timer = setTimeout(pushChanges, 600);
}

async function onSignedIn(uid) {
    if (userId === uid)
        return;
    userId = uid;
    lastSent.clear();
    const owner = window.localStorage.getItem(OWNER_KEY);
    // Matches left by a different account on this device are not uploaded.
    let local = owner && owner !== uid ? [] : loadMatches();
    if (local.length) {
        const { error } = await supabase.from("matches").upsert(local.map((m) => ({ user_id: uid, id: m.id, data: m, updated_at: new Date().toISOString() })));
        if (error)
            console.error("Moving matches to account failed", error);
    }
    const { data, error } = await supabase.from("matches").select("id, data").order("updated_at", { ascending: false });
    if (error) {
        console.error("Loading account matches failed", error);
        return;
    }
    const remote = (data ?? []).map((r) => r.data);
    remote.forEach((m) => lastSent.set(m.id, JSON.stringify(m)));
    window.localStorage.setItem(OWNER_KEY, uid);
    writeLocal(remote);
}

function onSignedOut() {
    if (!userId && !window.localStorage.getItem(OWNER_KEY))
        return;
    userId = null;
    lastSent.clear();
    clearTimeout(timer);
    window.localStorage.removeItem(OWNER_KEY);
    writeLocal([]);
}

/** Remove a match from the account (call alongside deleteMatch). */
export async function deleteRemoteMatch(id) {
    lastSent.delete(id);
    if (!userId)
        return;
    const { error } = await supabase.from("matches").delete().eq("id", id).eq("user_id", userId);
    if (error)
        console.error("Deleting match from account failed", error);
}

export function startCloudSync() {
    if (started)
        return () => { };
    started = true;
    window.addEventListener("localscore:update", schedulePush);
    window.addEventListener("localscore:delete", (e) => deleteRemoteMatch(e.detail));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user)
            setTimeout(() => onSignedIn(session.user.id), 0);
        else if (event === "SIGNED_OUT" || event === "INITIAL_SESSION")
            onSignedOut();
    });
    return () => {
        started = false;
        window.removeEventListener("localscore:update", schedulePush);
        data.subscription.unsubscribe();
    };
}
