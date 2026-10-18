import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Workspace, WorkspaceMember, SubscriptionStatus } from '@/types';

type Role = 'pastor' | 'member' | 'coordinator';

export interface MfaChallengeState {
  factorId: string | null;
  challengeId: string | null;
  needsPhone: boolean;
}

interface PendingAuth {
  workspace: Workspace;
  role: Role;
  displayName: string;
  ownerEmail: string | null;
  freeAccess: boolean;
}

interface WorkspaceState {
  workspace: Workspace | null;
  role: Role | null;
  displayName: string | null;
  ownerEmail: string | null;
  hasFreeAccess: boolean;
  trialDaysLeft: number;
  isTrialActive: boolean;
  hasActiveSubscription: boolean;
  canUseApp: boolean;
  loading: boolean;
}

interface WorkspaceContextValue extends WorkspaceState {
  createWorkspace: (name: string, pastorName: string, ownerEmail: string, description?: string) => Promise<Workspace>;
  joinWorkspace: (joinCode: string, displayName: string) => Promise<Workspace | null>;
  signUpPastor: (email: string, password: string, churchName: string, pastorName: string) => Promise<void>;
  signInPastor: (email: string, password: string) => Promise<MfaChallengeState | null>;
  signUpCoordinator: (email: string, password: string, joinCode: string, displayName: string) => Promise<void>;
  signInCoordinator: (email: string, password: string) => Promise<MfaChallengeState | null>;
  enrollPhoneAndChallenge: (phone: string) => Promise<MfaChallengeState>;
  verifyMfaCode: (challengeId: string, factorId: string, code: string) => Promise<void>;
  signOutPastor: () => Promise<void>;
  leaveWorkspace: () => void;
  refreshWorkspace: () => Promise<void>;
  createCheckoutSession: (plan?: 'monthly' | 'yearly') => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_KEY = 'glory-workspace-session';

interface StoredSession {
  workspaceId: string;
  role: Role;
  displayName: string;
  ownerEmail: string | null;
}

function computeTrialDaysLeft(trialEnd: string): number {
  const end = new Date(trialEnd).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

function computeHasActiveSubscription(status: SubscriptionStatus, subEnd: string | null): boolean {
  if (status === 'active') return true;
  if (status === 'past_due' || status === 'canceled') {
    if (!subEnd) return false;
    return new Date(subEnd).getTime() > Date.now();
  }
  return false;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>({
    workspace: null,
    role: null,
    displayName: null,
    ownerEmail: null,
    hasFreeAccess: false,
    trialDaysLeft: 0,
    isTrialActive: false,
    hasActiveSubscription: false,
    canUseApp: false,
    loading: true,
  });

  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);

  const checkFreeAccess = useCallback(async (email: string | null): Promise<boolean> => {
    if (!email) return false;
    const { data } = await supabase
      .from('free_access_emails')
      .select('email')
      .ilike('email', email.trim())
      .maybeSingle();
    return !!data;
  }, []);

  const buildState = useCallback((
    ws: Workspace,
    role: Role,
    displayName: string,
    ownerEmail: string | null,
    freeAccess: boolean
  ): WorkspaceState => {
    const trialDaysLeft = computeTrialDaysLeft(ws.trial_end);
    const isTrialActive = trialDaysLeft > 0;
    const hasActiveSubscription = computeHasActiveSubscription(ws.subscription_status, ws.subscription_end);
    const canUseApp = freeAccess || isTrialActive || hasActiveSubscription;

    return {
      workspace: ws,
      role,
      displayName,
      ownerEmail,
      hasFreeAccess: freeAccess,
      trialDaysLeft,
      isTrialActive,
      hasActiveSubscription,
      canUseApp,
      loading: false,
    };
  }, []);

  const loadWorkspaceByOwnerUserId = useCallback(async (userId: string): Promise<Workspace | null> => {
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle();
    return (data as Workspace) ?? null;
  }, []);

  const loadWorkspace = useCallback(async (session: StoredSession) => {
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', session.workspaceId)
      .maybeSingle();

    if (data) {
      const ws = data as Workspace;
      const { data: authSession } = await supabase.auth.getSession();
      if (!authSession.session && (session.role === 'pastor' || session.role === 'coordinator')) {
        sessionStorage.setItem('glory-join-code', ws.join_code);
        localStorage.removeItem(STORAGE_KEY);
        setState({
          workspace: null, role: null, displayName: null, ownerEmail: null,
          hasFreeAccess: false, trialDaysLeft: 0, isTrialActive: false,
          hasActiveSubscription: false, canUseApp: false, loading: false,
        });
        return;
      }
      if (session.role === 'pastor' || session.role === 'coordinator') {
        // MFA is optional — only enforce if the user has verified factors
        const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasVerifiedFactor = factors?.phone?.some((f) => f.status === 'verified');
        if (hasVerifiedFactor && assurance?.currentLevel !== 'aal2') {
          await supabase.auth.signOut({ scope: 'local' });
          localStorage.removeItem(STORAGE_KEY);
          setState({
            workspace: null, role: null, displayName: null, ownerEmail: null,
            hasFreeAccess: false, trialDaysLeft: 0, isTrialActive: false,
            hasActiveSubscription: false, canUseApp: false, loading: false,
          });
          return;
        }
      }
      const freeAccess = await checkFreeAccess(session.ownerEmail ?? ws.owner_email);
      setState(buildState(ws, session.role, session.displayName, session.ownerEmail ?? ws.owner_email, freeAccess));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setState({
        workspace: null, role: null, displayName: null, ownerEmail: null,
        hasFreeAccess: false, trialDaysLeft: 0, isTrialActive: false,
        hasActiveSubscription: false, canUseApp: false, loading: false,
      });
    }
  }, [checkFreeAccess, buildState]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as StoredSession;
        loadWorkspace(session);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState({
          workspace: null, role: null, displayName: null, ownerEmail: null,
          hasFreeAccess: false, trialDaysLeft: 0, isTrialActive: false,
          hasActiveSubscription: false, canUseApp: false, loading: false,
        });
      }
    } else {
      setState({
        workspace: null, role: null, displayName: null, ownerEmail: null,
        hasFreeAccess: false, trialDaysLeft: 0, isTrialActive: false,
        hasActiveSubscription: false, canUseApp: false, loading: false,
      });
    }
  }, [loadWorkspace]);

  const persistSession = (wsId: string, role: Role, name: string, email: string | null) => {
    const session: StoredSession = { workspaceId: wsId, role, displayName: name, ownerEmail: email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const createWorkspace = async (
    name: string,
    pastorName: string,
    ownerEmail: string,
    description?: string
  ): Promise<Workspace> => {
    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        pastor_name: pastorName.trim(),
        description: description?.trim() || null,
        owner_email: ownerEmail.trim() || null,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: 'trial',
      })
      .select()
      .single();

    if (error || !ws) throw new Error(error?.message ?? 'Failed to create church space');

    const newWorkspace = ws as Workspace;

    await supabase.from('workspace_members').insert({
      workspace_id: newWorkspace.id,
      display_name: pastorName.trim(),
      role: 'pastor',
    });

    const freeAccess = await checkFreeAccess(ownerEmail);
    persistSession(newWorkspace.id, 'pastor', pastorName.trim(), ownerEmail.trim() || null);
    setState(buildState(newWorkspace, 'pastor', pastorName.trim(), ownerEmail.trim() || null, freeAccess));

    return newWorkspace;
  };

  const joinWorkspace = async (joinCode: string, displayName: string): Promise<Workspace | null> => {
    const code = joinCode.trim().toUpperCase();
    const { data: ws, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('join_code', code)
      .maybeSingle();

    if (error || !ws) return null;

    const workspace = ws as Workspace;

    const { data: existing } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('display_name', displayName.trim())
      .maybeSingle();

    if (!existing) {
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        display_name: displayName.trim(),
        role: 'coordinator',
      });
    }

    const role = (existing?.role as Role) ?? 'coordinator';
    persistSession(workspace.id, role, displayName.trim(), null);
    setState(buildState(workspace, role, displayName.trim(), null, false));

    return workspace;
  };

  const signUpPastor = async (email: string, password: string, churchName: string, pastorName: string): Promise<void> => {
    // 1. Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Failed to create account');

    // 2. Create workspace linked to auth user
    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .insert({
        name: churchName.trim(),
        pastor_name: pastorName.trim(),
        description: null,
        owner_email: email.trim().toLowerCase(),
        owner_user_id: authData.user.id,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: 'trial',
      })
      .select()
      .single();

    if (wsErr || !ws) throw new Error(wsErr?.message ?? 'Failed to create church space');

    const newWorkspace = ws as Workspace;

    await supabase.from('workspace_members').insert({
      workspace_id: newWorkspace.id,
      display_name: pastorName.trim(),
      role: 'pastor',
      user_id: authData.user.id,
    });

    const freeAccess = await checkFreeAccess(email);
    persistSession(newWorkspace.id, 'pastor', pastorName.trim(), email.trim().toLowerCase());
    setState(buildState(newWorkspace, 'pastor', pastorName.trim(), email.trim().toLowerCase(), freeAccess));
  };

  const loadWorkspaceByMemberUserId = useCallback(async (userId: string): Promise<{ ws: Workspace; role: Role; displayName: string } | null> => {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, display_name')
      .eq('user_id', userId)
      .maybeSingle();
    if (!member) return null;
    const { data: wsData } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', member.workspace_id)
      .maybeSingle();
    if (!wsData) return null;
    return { ws: wsData as Workspace, role: member.role as Role, displayName: member.display_name };
  }, []);

  const linkPastorMemberToAuthUser = useCallback(async (userId: string, workspaceId: string) => {
    await supabase
      .from('workspace_members')
      .update({ user_id: userId })
      .eq('workspace_id', workspaceId)
      .eq('role', 'pastor')
      .is('user_id', null);
  }, []);

  const beginMfaChallenge = async (auth: PendingAuth): Promise<MfaChallengeState> => {
    setPendingAuth(auth);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        finishPendingAuth();
        return { factorId: null, challengeId: null, needsPhone: false };
      }
      const phoneFactor = data?.phone.find((factor) => factor.status === 'verified');
      if (!phoneFactor) {
        finishPendingAuth();
        return { factorId: null, challengeId: null, needsPhone: false };
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: phoneFactor.id, channel: 'sms' });
      if (challengeError || !challenge) {
        finishPendingAuth();
        return { factorId: null, challengeId: null, needsPhone: false };
      }
      return { factorId: phoneFactor.id, challengeId: challenge.id, needsPhone: false };
    } catch {
      finishPendingAuth();
      return { factorId: null, challengeId: null, needsPhone: false };
    }
  };

  const finishPendingAuth = () => {
    if (!pendingAuth) throw new Error('Login session expired. Please sign in again.');
    const { workspace: ws, role, displayName, ownerEmail, freeAccess } = pendingAuth;
    persistSession(ws.id, role, displayName, ownerEmail);
    setState(buildState(ws, role, displayName, ownerEmail, freeAccess));
    setPendingAuth(null);
  };

  const signInPastor = async (email: string, password: string): Promise<MfaChallengeState | null> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Login failed');

    const ws = await loadWorkspaceByOwnerUserId(authData.user.id);
    if (!ws) throw new Error('No church space found for this account');

    await linkPastorMemberToAuthUser(authData.user.id, ws.id);
    const freeAccess = await checkFreeAccess(ws.owner_email);
    return beginMfaChallenge({ workspace: ws, role: 'pastor', displayName: ws.pastor_name, ownerEmail: ws.owner_email, freeAccess });
  };

  const signUpCoordinator = async (email: string, password: string, joinCode: string, displayName: string): Promise<void> => {
    const code = joinCode.trim().toUpperCase();
    // 1. Look up workspace by join code
    const { data: wsData, error: wsErr } = await supabase
      .from('workspaces')
      .select('*')
      .eq('join_code', code)
      .maybeSingle();
    if (wsErr || !wsData) throw new Error('Invalid join code. Please check and try again.');
    const workspace = wsData as Workspace;

    // 2. Create or restore the coordinator auth account
    const normalizedEmail = email.trim().toLowerCase();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    let userId = signUpData.user?.id;
    if (signUpError) {
      if (!signUpError.message.toLowerCase().includes('already registered')) {
        throw new Error(signUpError.message);
      }
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError || !signInData.user) throw new Error(signInError?.message ?? 'Unable to sign in');
      userId = signInData.user.id;
    }
    if (!userId) throw new Error('Failed to create account');

    // 3. Atomically claim or create the coordinator member row
    const { data: joined, error: joinError } = await supabase.rpc('join_workspace_as_coordinator', {
      p_join_code: code,
      p_display_name: displayName.trim(),
      p_email: normalizedEmail,
    });
    if (joinError || !joined?.[0]) throw new Error(joinError?.message ?? 'Unable to join the team');

    persistSession(workspace.id, 'coordinator', displayName.trim(), normalizedEmail);
    setState(buildState(workspace, 'coordinator', displayName.trim(), email.trim().toLowerCase(), false));
  };

  const signInCoordinator = async (email: string, password: string): Promise<MfaChallengeState | null> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Login failed');

    const result = await loadWorkspaceByMemberUserId(authData.user.id);
    if (!result) throw new Error('No church space found for this account');

    const ownerEmail = email.trim().toLowerCase();
    const freeAccess = await checkFreeAccess(result.ws.owner_email);
    return beginMfaChallenge({ workspace: result.ws, role: result.role, displayName: result.displayName, ownerEmail, freeAccess });
  };

  const enrollPhoneAndChallenge = async (phone: string): Promise<MfaChallengeState> => {
    if (!pendingAuth) throw new Error('Login session expired. Please sign in again.');
    const { data: factor, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'phone',
      phone: phone.trim(),
      friendlyName: 'Church staff phone',
    });
    if (enrollError || !factor) throw new Error('Unable to send a verification code');
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id, channel: 'sms' });
    if (challengeError || !challenge) throw new Error('Unable to send a verification code');
    return { factorId: factor.id, challengeId: challenge.id, needsPhone: false };
  };

  const verifyMfaCode = async (challengeId: string, factorId: string, code: string): Promise<void> => {
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code: code.trim() });
    if (error) throw new Error('The verification code is incorrect or expired');
    finishPendingAuth();
  };

  const signOutPastor = async (): Promise<void> => {
    await supabase.auth.signOut();
    leaveWorkspace();
  };

  // Listen for auth state changes (e.g. session restored on page reload)
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          // Only auto-restore if we don't already have a church space loaded
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored && session.user.id) {
            const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const hasVerifiedFactor = factors?.phone?.some((f) => f.status === 'verified');
            if (hasVerifiedFactor && assurance?.currentLevel !== 'aal2') return;
            // Try pastor first (owner_user_id), then admin (workspace_members.user_id)
            const ws = await loadWorkspaceByOwnerUserId(session.user.id);
            if (ws) {
              await linkPastorMemberToAuthUser(session.user.id, ws.id);
              const freeAccess = await checkFreeAccess(ws.owner_email);
              persistSession(ws.id, 'pastor', ws.pastor_name, ws.owner_email);
              setState(buildState(ws, 'pastor', ws.pastor_name, ws.owner_email, freeAccess));
            } else {
              const result = await loadWorkspaceByMemberUserId(session.user.id);
              if (result) {
                const freeAccess = await checkFreeAccess(result.ws.owner_email);
                persistSession(result.ws.id, result.role, result.displayName, null);
                setState(buildState(result.ws, result.role, result.displayName, null, freeAccess));
              }
            }
          }
        }
      })();
    });
  }, []);

  const leaveWorkspace = () => {
    setPendingAuth(null);
    localStorage.removeItem(STORAGE_KEY);
    setState({
      workspace: null, role: null, displayName: null, ownerEmail: null,
      hasFreeAccess: false, trialDaysLeft: 0, isTrialActive: false,
      hasActiveSubscription: false, canUseApp: false, loading: false,
    });
  };

  useEffect(() => {
    if (!state.workspace || (state.role !== 'pastor' && state.role !== 'coordinator')) return;
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut({ scope: 'local' });
        leaveWorkspace();
      }, 30 * 60 * 1000);
    };
    const activityEvents: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timer);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [state.workspace, state.role]);

  const refreshWorkspace = async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as StoredSession;
        await loadWorkspace(session);
      } catch {
        // ignore
      }
    }
  };

  const createCheckoutSession = async (plan: 'monthly' | 'yearly' = 'monthly'): Promise<void> => {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Your session has expired. Please log out and sign back in to subscribe.');
      }
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('You must be signed in to subscribe. Please log out and sign back in.');

    let res: Response;
    try {
      res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });
    } catch {
      throw new Error('Unable to connect to the checkout service. Please check your internet connection and try again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Failed to start checkout. Please try again.');
    }
    const data = await res.json();
    if (data.url) {
      window.top!.location.href = data.url;
    } else {
      throw new Error(data.error ?? 'Failed to get checkout URL from Stripe.');
    }
  };

  return (
    <WorkspaceContext.Provider value={{ ...state, createWorkspace, joinWorkspace, signUpPastor, signInPastor, signUpCoordinator, signInCoordinator, enrollPhoneAndChallenge, verifyMfaCode, signOutPastor, leaveWorkspace, refreshWorkspace, createCheckoutSession }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
