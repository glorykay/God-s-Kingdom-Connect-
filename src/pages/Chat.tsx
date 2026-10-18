import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ChatMessage, ChatReaction } from '@/types';
import {
  Send,
  Paperclip,
  Download,
  Crown,
  Users,
  MessageCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  File,
  X,
  CheckCheck,
  Smile,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function isImageFile(fileName: string | null): boolean {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
}

function getFileIcon(fileName: string | null) {
  if (!fileName) return File;
  return isImageFile(fileName) ? ImageIcon : FileText;
}

interface ChatParticipant {
  id: string;
  display_name: string;
  role: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '🙏', '😊', '✅', '🔥'];

let unreadCountListeners: Array<(count: number) => void> = [];
let currentUnreadCount = 0;

export function getUnreadChatCount(): number {
  return currentUnreadCount;
}

export function subscribeUnreadChatCount(listener: (count: number) => void): () => void {
  unreadCountListeners.push(listener);
  listener(currentUnreadCount);
  return () => {
    unreadCountListeners = unreadCountListeners.filter((l) => l !== listener);
  };
}

function setUnreadCount(count: number) {
  currentUnreadCount = count;
  unreadCountListeners.forEach((l) => l(count));
}

export function Chat() {
  const { workspace, role, displayName } = useWorkspace();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState('');
  const [reactions, setReactions] = useState<Record<string, ChatReaction[]>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSent = useRef<number>(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!workspace) return;
    const { data, error: err } = await supabase
      .from('chat_messages')
      .select('id, workspace_id, sender_id, sender_name, sender_role, message_text, file_url, file_name, file_size, created_at')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (err) {
      setError(t('chat.errLoadMessages'));
      setLoading(false);
      return;
    }

    const loadedMessages = ((data as ChatMessage[]) ?? []).reverse();
    setMessages((currentMessages) => {
      const messagesById = new Map(currentMessages.map((message) => [message.id, message]));
      loadedMessages.forEach((message) => messagesById.set(message.id, message));
      return [...messagesById.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  }, [workspace, scrollToBottom]);

  const loadParticipants = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase
      .from('workspace_members')
      .select('id, display_name, role')
      .eq('workspace_id', workspace.id)
      .in('role', ['pastor', 'coordinator'])
      .order('role', { ascending: true });

    setParticipants((data as ChatParticipant[]) ?? []);
  }, [workspace]);

  const loadReadStatus = useCallback(async () => {
    if (!workspace) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('chat_read_status')
      .select('last_read_at')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setReadAt(data?.last_read_at ?? null);
  }, [workspace]);

  const loadReactions = useCallback(async () => {
    if (!workspace) return;
    const messageIds = messages
      .filter((m) => !m.id.startsWith('pending-'))
      .map((m) => m.id);
    if (messageIds.length === 0) return;
    const { data } = await supabase
      .from('chat_reactions')
      .select('id, message_id, workspace_id, user_id, emoji, created_at')
      .in('message_id', messageIds);
    if (!data) return;
    const grouped: Record<string, ChatReaction[]> = {};
    (data as ChatReaction[]).forEach((r) => {
      if (!grouped[r.message_id]) grouped[r.message_id] = [];
      grouped[r.message_id].push(r);
    });
    setReactions(grouped);
  }, [workspace, messages]);

  const markAsRead = useCallback(async () => {
    if (!workspace) return;
    setMarkingRead(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMarkingRead(false);
      return;
    }
    const latestMessageAt = messages[messages.length - 1]?.created_at ?? new Date().toISOString();
    const { error: markError } = await supabase
      .from('chat_read_status')
      .upsert({
        workspace_id: workspace.id,
        user_id: user.id,
        last_read_at: latestMessageAt,
      }, { onConflict: 'workspace_id,user_id' });
    if (!markError) setReadAt(latestMessageAt);
    setMarkingRead(false);
  }, [workspace, messages]);

  const refreshLatestMessages = useCallback(async () => {
    if (!workspace) return;
    const latestPersistedMessage = messages
      .filter((message) => !message.id.startsWith('pending-'))
      .slice(-1)[0];
    let query = supabase
      .from('chat_messages')
      .select('id, workspace_id, sender_id, sender_name, sender_role, message_text, file_url, file_name, file_size, created_at')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (latestPersistedMessage) {
      query = query.gt('created_at', latestPersistedMessage.created_at);
    }

    const { data } = await query;
    if (!data?.length) return;

    setMessages((currentMessages) => {
      const messagesById = new Map(currentMessages.map((message) => [message.id, message]));
      (data as ChatMessage[]).forEach((message) => messagesById.set(message.id, message));
      return [...messagesById.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
    setTimeout(scrollToBottom, 0);
  }, [workspace, messages, scrollToBottom]);

  useEffect(() => {
    loadMessages();
    loadParticipants();
    loadReadStatus();
  }, [loadMessages, loadParticipants, loadReadStatus]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void refreshLatestMessages();
    }, 1500);
    return () => window.clearInterval(refreshTimer);
  }, [refreshLatestMessages]);

  // Update global unread count whenever messages or readAt change
  useEffect(() => {
    if (!readAt || messages.length === 0) {
      const count = !readAt ? messages.filter((m) => !m.id.startsWith('pending-')).length : 0;
      setUnreadCount(count);
      return;
    }
    const count = messages.filter(
      (m) => !m.id.startsWith('pending-') && m.created_at > readAt
    ).length;
    setUnreadCount(count);
  }, [messages, readAt]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!workspace) return;

    const channel = supabase
      .channel(`chat-messages-${workspace.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as ChatMessage).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace, scrollToBottom]);

  // Realtime subscription for reactions
  useEffect(() => {
    if (!workspace) return;

    const channel = supabase
      .channel(`chat-reactions-${workspace.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_reactions',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          const newReaction = payload.new as ChatReaction;
          setReactions((prev) => ({
            ...prev,
            [newReaction.message_id]: [...(prev[newReaction.message_id] ?? []), newReaction],
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_reactions',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as ChatReaction).id;
          setReactions((prev) => {
            const updated: Record<string, ChatReaction[]> = {};
            Object.entries(prev).forEach(([msgId, msgReactions]) => {
              updated[msgId] = msgReactions.filter((r) => r.id !== deletedId);
            });
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace]);

  // Typing indicator via realtime presence/broadcast
  useEffect(() => {
    if (!workspace || !displayName) return;

    const channel = supabase
      .channel(`chat-typing-${workspace.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { name, workspaceId } = payload.payload as { name: string; workspaceId: string };
        if (workspaceId !== workspace.id || name === displayName) return;
        setTypingUsers((prev) => {
          if (prev.includes(name)) return prev;
          return [...prev, name];
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== name));
        }, 4000);
      })
      .on('broadcast', { event: 'stop-typing' }, (payload) => {
        const { name, workspaceId } = payload.payload as { name: string; workspaceId: string };
        if (workspaceId !== workspace.id) return;
        setTypingUsers((prev) => prev.filter((n) => n !== name));
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
    };
  }, [workspace, displayName]);

  function sendTyping() {
    if (!workspace || !displayName) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { name: displayName, workspaceId: workspace.id },
    });
  }

  function sendStopTyping() {
    if (!workspace || !displayName) return;
    lastTypingSent.current = 0;
    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'stop-typing',
      payload: { name: displayName, workspaceId: workspace.id },
    });
  }

  async function handleSend() {
    if (!input.trim() || !workspace || sending) return;
    const messageText = input.trim();
    const optimisticId = `pending-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      workspace_id: workspace.id,
      sender_id: null,
      sender_name: displayName ?? t('common.unknown'),
      sender_role: role === 'pastor' ? 'pastor' : 'coordinator',
      message_text: messageText,
      file_url: null,
      file_name: null,
      file_size: null,
      created_at: new Date().toISOString(),
    };

    setSending(true);
    setError('');
    setInput('');
    sendStopTyping();
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setInput(messageText);
      setError(t('chat.errSendMessage'));
      setSending(false);
      return;
    }

    const { data: inserted, error: err } = await supabase
      .from('chat_messages')
      .insert({
        workspace_id: workspace.id,
        sender_id: user.id,
        sender_name: displayName ?? t('common.unknown'),
        sender_role: role ?? 'coordinator',
        message_text: messageText,
      })
      .select()
      .maybeSingle();

    if (err || !inserted) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setInput(messageText);
      setError(t('chat.errSendMessage'));
    } else {
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== optimisticId && message.id !== inserted.id),
        inserted as ChatMessage,
      ]);
    }
    setSending(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;

    if (file.size > 10 * 1024 * 1024) {
      setError(t('chat.errFileSize'));
      e.target.value = '';
      return;
    }

    setUploading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const senderId = user?.id ?? 'unknown';
      const ext = file.name.split('.').pop();
      const fileName = `${workspace.id}/${senderId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) throw new Error(t('chat.errUpload'));

      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      const { error: msgErr } = await supabase.from('chat_messages').insert({
        workspace_id: workspace.id,
        sender_id: senderId,
        sender_name: displayName ?? t('common.unknown'),
        sender_role: role ?? 'coordinator',
        message_text: null,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
      });

      if (msgErr) throw new Error(t('chat.errFileMessage'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('chat.errShareFile'));
    }

    setUploading(false);
    e.target.value = '';
  }

  async function handleDeleteMessage(msgId: string) {
    const { error: err } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', msgId);

    if (err) {
      setError(t('chat.errDelete'));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    }
  }

  async function handleToggleReaction(msgId: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = reactions[msgId]?.find(
      (r) => r.user_id === user.id && r.emoji === emoji
    );

    if (existing) {
      await supabase.from('chat_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('chat_reactions').insert({
        message_id: msgId,
        workspace_id: workspace?.id,
        user_id: user.id,
        emoji,
      });
    }
    setReactionPickerFor(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    if (e.target.value.trim()) {
      sendTyping();
    } else {
      sendStopTyping();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={28} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <MessageCircle size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('chat.title')}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('chat.pastorsCoordinators')}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Users size={14} />
          {participants.length} {participants.length === 1 ? t('common.member_single') : t('common.members_plural')}
          {messages.some((message) => !readAt || message.created_at > readAt) && (
            <button
              onClick={markAsRead}
              disabled={markingRead}
              className="ml-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 disabled:opacity-50"
              title="Mark chat as read"
            >
              <CheckCheck size={14} />
              <span>Mark read</span>
            </button>
          )}
        </div>
      </div>

      {/* Participants bar */}
      {participants.length > 0 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 px-1">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 flex-shrink-0"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                p.role === 'pastor'
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900'
                  : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
              }`}>
                {p.display_name[0]?.toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {p.display_name}
              </span>
              {p.role === 'pastor' && <Crown size={11} className="text-amber-500" />}
            </div>
          ))}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 min-h-0 relative">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
              <MessageCircle size={28} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('chat.noMessages')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('chat.startConversation')}</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_name === displayName;
          const msgReactions = reactions[msg.id] ?? [];
          const groupedReactions = msgReactions.reduce<Record<string, ChatReaction[]>>((acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = [];
            acc[r.emoji].push(r);
            return acc;
          }, {});

          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] group ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwn && (
                  <div className="flex items-center gap-1.5 mb-1 ml-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      msg.sender_role === 'pastor'
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900'
                        : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                    }`}>
                      {msg.sender_name[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {msg.sender_name}
                    </span>
                    {msg.sender_role === 'pastor' && <Crown size={10} className="text-amber-500" />}
                  </div>
                )}

                <div
                  className={`rounded-2xl px-3.5 py-2.5 ${
                    isOwn
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-br-md'
                      : msg.sender_role === 'pastor'
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-slate-800 dark:text-slate-100 rounded-bl-md border border-amber-200/50 dark:border-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 rounded-bl-md'
                  }`}
                >
                  {msg.message_text && (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                  )}

                  {msg.file_url && isImageFile(msg.file_name) ? (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 overflow-hidden rounded-xl"
                    >
                      <img
                        src={msg.file_url}
                        alt={msg.file_name ?? t('chat.sharedImage')}
                        className="max-h-72 max-w-full rounded-xl object-contain"
                        loading="lazy"
                      />
                      {msg.file_name && (
                        <p className={`mt-1 text-xs truncate ${isOwn ? 'text-white/80' : 'text-slate-500 dark:text-slate-300'}`}>
                          {msg.file_name}
                        </p>
                      )}
                    </a>
                  ) : msg.file_url ? (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={msg.file_name ?? undefined}
                      className={`flex items-center gap-3 mt-1 p-2.5 rounded-xl transition-all ${
                        isOwn
                          ? 'bg-white/20 hover:bg-white/30'
                          : 'bg-white dark:bg-slate-600/50 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {(() => {
                        const FileIcon = getFileIcon(msg.file_name);
                        return <FileIcon size={24} className={isOwn ? 'text-white' : 'text-slate-500 dark:text-slate-300'} />;
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                          {msg.file_name}
                        </p>
                        {msg.file_size && (
                          <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                            {formatFileSize(msg.file_size)}
                          </p>
                        )}
                      </div>
                      <Download size={18} className={isOwn ? 'text-white' : 'text-slate-400'} />
                    </a>
                  ) : null}
                </div>

                {/* Reactions display */}
                {msgReactions.length > 0 && (
                  <div className={`flex flex-wrap items-center gap-1 mt-1 mx-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {Object.entries(groupedReactions).map(([emoji, reactors]) => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs"
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{reactors.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Reaction picker */}
                {reactionPickerFor === msg.id && (
                  <div className={`absolute z-10 flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg ${isOwn ? 'right-0' : 'left-0'} -top-9`}>
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-base"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`flex items-center gap-2 mt-1 mx-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                  {!msg.id.startsWith('pending-') && (
                    <button
                      onClick={() => setReactionPickerFor(reactionPickerFor === msg.id ? null : msg.id)}
                      className="text-[10px] text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                    >
                      <Smile size={12} />
                    </button>
                  )}
                  {isOwn && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="text-[10px] text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                    >
                      <X size={10} /> {t('chat.delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex items-center gap-1">
              {typingUsers.slice(0, 3).map((name) => (
                <div key={name} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-emerald-400 text-white">
                  {name[0]?.toUpperCase()}
                </div>
              ))}
            </div>
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-2xl rounded-bl-md px-3.5 py-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing`
                    : `${typingUsers.slice(0, 2).join(', ')} ${typingUsers.length > 2 ? `+${typingUsers.length - 2}` : ''} are typing`}
                </span>
                <div className="flex items-center gap-0.5 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-rose-500 mt-2 px-1">{error}</p>
      )}

      {/* Input area */}
      <div className="mt-3 flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.ppt,.pptx,.zip"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:border-amber-300 dark:hover:border-amber-500/40 transition-all disabled:opacity-50"
          title={t('chat.attachFile')}
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
        </button>

        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={sendStopTyping}
            rows={1}
            placeholder={t('chat.typeMessage')}
            className="w-full resize-none rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 max-h-32"
            style={{ minHeight: '44px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
          title={t('chat.sendMessage')}
        >
          {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>

      <p className="text-[10px] text-slate-400 mt-2 px-1">
        {t('chat.enterHint')}
      </p>
    </div>
  );
}
