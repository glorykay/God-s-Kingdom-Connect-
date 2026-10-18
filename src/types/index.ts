export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';

export interface Workspace {
  id: string;
  name: string;
  pastor_name: string;
  description: string | null;
  join_code: string;
  owner_email: string | null;
  owner_user_id: string | null;
  trial_start: string;
  trial_end: string;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_end: string | null;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  display_name: string;
  role: 'pastor' | 'member' | 'coordinator';
  coordinator_access_until: string | null;
  joined_at: string;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  gender: 'male' | 'female' | null;
  is_new_comer: boolean;
  joined_date: string;
  created_at: string;
  workspace_id: string | null;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  service_date: string;
  service_time: string;
  service_end_time: string | null;
  speaker: string | null;
  created_at: string;
  workspace_id: string | null;
}

export interface Attendance {
  id: string;
  service_id: string;
  member_id: string | null;
  is_new_comer: boolean;
  newcomer_name: string | null;
  testimony: string | null;
  prayer_request: string | null;
  timestamp: string;
  workspace_id: string | null;
}

export interface PrayerRequest {
  id: string;
  member_name: string;
  request_text: string;
  status: 'pending' | 'prayed' | 'answered';
  is_private: boolean;
  created_at: string;
  workspace_id: string | null;
}

export interface FollowUp {
  id: string;
  workspace_id: string;
  member_id: string | null;
  newcomer_name: string | null;
  status: 'pending' | 'contacted' | 'visited' | 'completed';
  method: 'call' | 'text' | 'email' | 'visit' | 'in_person' | null;
  notes: string;
  follow_up_date: string;
  created_at: string;
  updated_at: string;
}

export interface SmallGroup {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  leader: string;
  meeting_day: string;
  meeting_time: string;
  location: string;
  color: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  member_id: string;
  workspace_id: string;
  joined_at: string;
}

export interface KidsCheckin {
  id: string;
  workspace_id: string;
  service_id: string;
  parent_member_id: string | null;
  first_name: string;
  last_name: string;
  timestamp: string;
}

export interface AttendanceWithDetails extends Attendance {
  service?: Service;
  member?: Member | null;
}

export interface FreeAccessEmail {
  id: string;
  email: string;
  label: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  workspace_id: string;
  sender_id: string | null;
  sender_name: string;
  sender_role: 'pastor' | 'coordinator';
  message_text: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ChatReaction {
  id: string;
  message_id: string;
  workspace_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  workspace_id: string;
  service_id: string | null;
  title: string;
  message: string;
  channel: 'email' | 'sms' | 'both';
  send_at: string;
  status: 'scheduled' | 'sent' | 'cancelled';
  sent_at: string | null;
  created_at: string;
}

export type SidebarStyle = 'dark' | 'light' | 'gradient';
export type DashboardTemplate =
  | 'classic' | 'compact' | 'minimal'
  | 'modern' | 'gradient' | 'corporate'
  | 'bold' | 'elegant' | 'dark' | 'glass'
  | 'neumorphic' | 'card' | 'magazine' | 'widget' | 'hero'
  | 'split' | 'sidebar' | 'tabs' | 'banner' | 'minimalist_pro';
export type CardLayout = 'grid' | 'list';
export type ThemeMode = 'system' | 'light' | 'dark' | 'church';

export interface WorkspaceCustomization {
  id: string;
  workspace_id: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  bg_color: string;
  font_family: string;
  sidebar_style: SidebarStyle;
  dashboard_template: DashboardTemplate;
  card_layout: CardLayout;
  theme_mode: ThemeMode;
  church_theme_name: string | null;
  church_theme_color1: string | null;
  church_theme_color2: string | null;
  prayer_shared_with_coordinators: boolean;
  created_at: string;
  updated_at: string;
}

export type PageId =
  | 'dashboard'
  | 'members'
  | 'services'
  | 'attendance'
  | 'prayer'
  | 'analytics'
  | 'chat'
  | 'followup'
  | 'groups'
  | 'reminders'
  | 'customize';
