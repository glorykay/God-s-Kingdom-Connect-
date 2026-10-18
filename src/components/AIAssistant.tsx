import { useState, useRef, useEffect, ReactNode } from 'react';
import { Bot, X, Send, Mail, Phone, Church, Sparkles, BookOpen } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import { findBibleVerse, findDictionaryEntry } from '@/data/bibleData';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  suggestions?: string[];
}

interface Topic {
  keywords: string[];
  answer: string;
  suggestions?: string[];
}

const KNOWLEDGE_BASE: Topic[] = [
  {
    keywords: ['dashboard', 'home', 'overview', 'summary', 'welcome'],
    answer: 'The Dashboard is your home base. It shows a snapshot of your church: total members, today\'s attendance count, pending prayer requests, and upcoming services. You can also export an Excel report of all members or print a member report. Click any of the colored cards at the top to jump to that section.',
    suggestions: ['How do I add members?', 'How do I take attendance?', 'How do I export data?'],
  },
  {
    keywords: ['member', 'add member', 'register member', 'people', 'directory'],
    answer: 'The Members page is your church directory. You can add new members with their name, phone, email, address, and photo. Click any member to open their profile drawer, which shows their attendance history, follow-up tasks, small groups, and prayer requests. You can search members by name, email, or phone.',
    suggestions: ['How do I edit a member?', 'What are follow-ups?', 'How do I take attendance?'],
  },
  {
    keywords: ['service', 'schedule', 'create service', 'worship', 'sunday'],
    answer: 'The Services page lets you schedule church services. Each service has a name, date, start time, optional end time, and speaker. You can set a service to repeat weekly — it will automatically create services for the number of weeks you choose. During an active service, members can check in via QR code. After a service, you can post an attendance summary to the team chat.',
    suggestions: ['How does QR check-in work?', 'How do I take attendance?', 'What is the team chat?'],
  },
  {
    keywords: ['attendance', 'check in', 'checkin', 'check-in', 'present', 'who came'],
    answer: 'The Attendance page lets you check in members for a service. Select a service, search for a member, and submit their attendance. You can also register new comers on the spot. The page shows today\'s check-ins, total members, and new comers today. You can filter by All, Today, This Week, This Month, This Year, or a specific date, and see attendance trends over time.',
    suggestions: ['How does QR check-in work?', 'How do I register a new comer?', 'How do I create a service?'],
  },
  {
    keywords: ['qr', 'qr code', 'scan', 'code', 'checkin qr', 'member checkin qr'],
    answer: 'There are two QR codes pastors can share from the sidebar:\n\n1. Member Check-in QR — Display this at the church entrance. Members scan it with their phone to check themselves in for the active service. They can also submit prayer requests and testimonies during check-in.\n\n2. Share Team Join QR — Share this with your church staff and admins. When they scan it, they can create an admin account and join your church workspace.',
    suggestions: ['How do I add an admin?', 'How do members check in?', 'What are the roles?'],
  },
  {
    keywords: ['follow', 'followup', 'follow-up', 'follow up', 'task', 'reach out', 'contact member'],
    answer: 'The Follow-ups page helps you track care tasks for members. When someone checks in for the first time, a welcome follow-up is automatically created. You can also create custom follow-ups for any member — mark them as call, visit, or message, add notes, and set a due date. Follow-ups can be marked as pending or completed. The Dashboard also flags members who haven\'t attended in 2+ weeks so you can reach out.',
    suggestions: ['How do I see who hasn\'t attended?', 'How do I add a member?', 'What are small groups?'],
  },
  {
    keywords: ['group', 'small group', 'cell group', 'ministry', 'bible study'],
    answer: 'The Small Groups page lets you organize members into groups like Bible study, youth ministry, or cell groups. Create a group with a name and description, then add or remove members. This helps you track which members are involved in specific ministries within your church.',
    suggestions: ['How do I add members?', 'How do I take attendance?', 'What are follow-ups?'],
  },
  {
    keywords: ['prayer', 'prayer request', 'intercession', 'pray'],
    answer: 'The Prayer Requests page collects prayer needs from your congregation. Members can submit prayer requests during QR check-in, and they appear here with the member\'s name and the request text. You can mark requests as pending or answered. Pastors can choose whether to share prayer requests with admin coordinators in the Customize page.',
    suggestions: ['How does QR check-in work?', 'How do I customize my church?', 'What are the roles?'],
  },
  {
    keywords: ['analytic', 'chart', 'trend', 'report', 'statistic', 'growth'],
    answer: 'The Analytics page gives you insights into your church\'s growth and patterns. It shows attendance trends over time, member growth charts, new comer statistics, and service-by-service breakdowns. This helps you see which services are growing, track visitor retention, and identify patterns in attendance.',
    suggestions: ['How do I export data?', 'How do I take attendance?', 'How do I create a service?'],
  },
  {
    keywords: ['reminder', 'notify', 'notification', 'alert', 'message members'],
    answer: 'The Reminders page lets you schedule messages to be sent to your members. You can choose email or SMS as the channel, compose the message, and schedule it for a specific date and time. Reminders can be used for service announcements, event invitations, or pastoral care follow-ups.',
    suggestions: ['How do I add members?', 'How do I create a service?', 'What is the team chat?'],
  },
  {
    keywords: ['customize', 'theme', 'logo', 'color', 'branding', 'appearance', 'design'],
    answer: 'The Customize page lets you personalize your church workspace. You can:\n- Upload your church logo\n- Choose brand and accent colors\n- Pick a dashboard layout style (gradient, corporate, bold, tabs, or clean)\n- Choose a sidebar style (dark, light, or gradient)\n- Toggle whether prayer requests are shared with admin coordinators\n\nYour changes apply across the entire app for your church team.',
    suggestions: ['What are the roles?', 'How do prayer requests work?', 'How do I add an admin?'],
  },
  {
    keywords: ['chat', 'team chat', 'message', 'communicate', 'staff chat'],
    answer: 'The Team Chat is a built-in messaging system for your church staff. Pastors and admins can send messages, react with emojis, and see unread counts. You can also post attendance summaries from a service directly into the chat. Messages are private to your church workspace — only your team members can see them.',
    suggestions: ['What are the roles?', 'How do I add an admin?', 'How do I post attendance to chat?'],
  },
  {
    keywords: ['role', 'pastor', 'admin', 'coordinator', 'member', 'permission', 'access', 'who can'],
    answer: 'There are three roles in God\'s Kingdom Connect:\n\n1. Pastor — Full access. Can see the dashboard, manage members, services, attendance, follow-ups, small groups, prayer requests, analytics, reminders, customization, team chat, and generate QR codes. Pastors pay $21/month after a 14-day free trial.\n\n2. Admin (Coordinator) — Can manage members, services, attendance, follow-ups, small groups, analytics, reminders, customization, and team chat. Admins join for free using a join code from the pastor.\n\n3. Member — Can check in via QR code and submit prayer requests. No dashboard or management access.',
    suggestions: ['How do I add an admin?', 'How much does it cost?', 'How does QR check-in work?'],
  },
  {
    keywords: ['join', 'join code', 'add admin', 'add coordinator', 'invite', 'team', 'staff'],
    answer: 'To add an admin to your church team:\n1. Click "Share Team Join QR" in the sidebar (pastors only).\n2. Share the QR code or the join link with your staff member.\n3. They scan it or open the link, enter their name, email, and a password.\n4. They create an admin account and join your workspace.\n\nAdmins can also use a 6-character join code if they go to the app directly. You can manage and remove team members from "Manage Team" in the sidebar.',
    suggestions: ['What are the roles?', 'How do I remove an admin?', 'How much does it cost?'],
  },
  {
    keywords: ['price', 'cost', 'subscription', 'trial', 'pay', 'billing', 'free', 'plan'],
    answer: 'God\'s Kingdom Connect offers a 14-day free trial for pastors. After the trial, it\'s $21/month or $210/year (save 2 months). Cancel anytime. Admins (coordinators) always join for free — only the pastor\'s account needs a subscription. Some emails are whitelisted for free unlimited access.',
    suggestions: ['What are the roles?', 'How do I add an admin?', 'What happens after my trial?'],
  },
  {
    keywords: ['export', 'excel', 'download', 'print', 'report', 'spreadsheet'],
    answer: 'From the Dashboard, you can:\n- Click "Export Excel" to download a full spreadsheet report with member details, attendance summary, prayer requests, and service history.\n- Click "Print" to open a printable member report in your browser, which you can print or save as PDF.',
    suggestions: ['What is the dashboard?', 'How do I see analytics?', 'How do I add members?'],
  },
  {
    keywords: ['new comer', 'newcomer', 'visitor', 'first time', 'guest'],
    answer: 'New comers are automatically tracked when someone checks in for the first time. A member is flagged as a "new comer" until they\'ve attended 3 services. When a new comer checks in via QR code, a welcome follow-up task is automatically created so your team can reach out to them. You can see new comers on the Attendance page and Dashboard.',
    suggestions: ['What are follow-ups?', 'How does QR check-in work?', 'How do I take attendance?'],
  },
  {
    keywords: ['language', 'translate', 'french', 'spanish', 'portuguese', 'chinese', 'japanese'],
    answer: 'God\'s Kingdom Connect supports 6 languages: English, Français, 中文, Español, Português, and 日本語. You can switch languages from the sidebar — look for the Language button at the bottom. Your language preference is remembered across sessions.',
    suggestions: ['What can I customize?', 'What are the roles?', 'How do I add an admin?'],
  },
  {
    keywords: ['contact', 'support', 'help', 'email', 'phone', 'gloryk', 'godskingdomconnect'],
    answer: 'Need help? You can reach us anytime:\n\nEmail: gloryk@godskingdomconnect.org\nPhone: +1 513-316-1796\n\nWe\'re here to help with any questions about your church workspace, billing, or technical issues.',
    suggestions: ['What are the roles?', 'How much does it cost?', 'How do I add an admin?'],
  },
  {
    keywords: ['trial expired', 'paywall', 'payment failed', 'after trial', 'expired'],
    answer: 'When your 14-day trial ends and there\'s no active subscription, you\'ll see a paywall screen. You can subscribe monthly ($21) or yearly ($210) using Stripe checkout. If you can\'t pay right now, your admins and members can still use their limited features — only the pastor sees the paywall.',
    suggestions: ['How much does it cost?', 'What are the roles?', 'How do I contact support?'],
  },
];

const DEFAULT_SUGGESTIONS = [
  'What does this platform do?',
  'How do I add members?',
  'How do I take attendance?',
  'What are the roles?',
  'How do I contact support?',
];

const BIBLE_SUGGESTIONS = [
  'What does John 3:16 say?',
  'Define grace',
  'Show me Philippians 4:13',
  'What is faith?',
  'What does Psalm 23 mean?',
];

const OVERVIEW_ANSWER = `God's Kingdom Connect is an all-in-one church management platform. Here's what you can do:\n\n1. **Dashboard** — See a snapshot of your church with key stats and reports.\n2. **Members** — Keep a directory with photos, contact info, and attendance history.\n3. **Services** — Schedule services, set speakers, and repeat weekly.\n4. **Attendance** — Check in members, register new comers, and track trends.\n5. **QR Check-in** — Members scan a QR code to check themselves in on Sundays.\n6. **Follow-ups** — Track care tasks for members who need outreach.\n7. **Small Groups** — Organize members into Bible study or ministry groups.\n8. **Prayer Requests** — Collect and manage prayer needs from your congregation.\n9. **Analytics** — See attendance trends and growth charts.\n10. **Reminders** — Schedule email or text messages to members.\n11. **Team Chat** — Built-in messaging for your church staff.\n12. **Customize** — Upload your logo, choose colors, and personalize the app.\n\nThe platform supports 6 languages and costs $21/month after a 14-day free trial. Admins join for free.\n\nWhat would you like to know more about?`;

const BIBLE_MODE_KEYWORDS = ['bible', 'verse', 'scripture', 'passage', 'john ', 'psalm', 'genesis', 'exodus', 'proverbs', 'isaiah', 'matthew', 'mark ', 'luke ', 'acts ', 'romans', 'corinthians', 'galatians', 'ephesians', 'philippians', 'colossians', 'thessalonians', 'timothy', 'hebrews', 'james ', 'peter ', 'revelation', 'define', 'definition', 'dictionary', 'what is grace', 'what is faith', 'what is salvation', 'what is the gospel', 'what is sin', 'what is prayer', 'what is love', 'what is hope', 'what is wisdom', 'what is mercy', 'what is repentance'];

function isBibleQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return BIBLE_MODE_KEYWORDS.some((kw) => lower.includes(kw)) || findBibleVerse(query) !== null || findDictionaryEntry(query) !== null;
}

function findBibleAnswer(query: string): { content: string; suggestions?: string[] } {
  const verse = findBibleVerse(query);
  const dictEntry = findDictionaryEntry(query);

  const lower = query.toLowerCase();

  const wantsDefinition = lower.includes('define') || lower.includes('definition') || lower.includes('what is') || lower.includes('meaning') || lower.includes('dictionary') || lower.includes('explain');

  if (wantsDefinition && dictEntry) {
    return {
      content: `**${dictEntry.term}**\n\n${dictEntry.definition}\n\nScripture reference: ${dictEntry.scriptureRef}`,
      suggestions: BIBLE_SUGGESTIONS,
    };
  }

  if (verse && !dictEntry) {
    return {
      content: `**${verse.reference}**\n\n\u201c${verse.text}\u201d\n\n${verse.context}`,
      suggestions: BIBLE_SUGGESTIONS,
    };
  }

  if (verse && dictEntry) {
    const wantsVerse = lower.includes('verse') || lower.includes('say') || lower.includes('read') || lower.includes('quote') || lower.includes('show me') || lower.includes('passage');
    if (!wantsDefinition || wantsVerse) {
      return {
        content: `**${verse.reference}**\n\n\u201c${verse.text}\u201d\n\n${verse.context}`,
        suggestions: BIBLE_SUGGESTIONS,
      };
    }
    return {
      content: `**${dictEntry.term}**\n\n${dictEntry.definition}\n\nScripture reference: ${dictEntry.scriptureRef}`,
      suggestions: BIBLE_SUGGESTIONS,
    };
  }

  if (dictEntry) {
    return {
      content: `**${dictEntry.term}**\n\n${dictEntry.definition}\n\nScripture reference: ${dictEntry.scriptureRef}`,
      suggestions: BIBLE_SUGGESTIONS,
    };
  }

  return {
    content: 'I couldn\'t find that in my Bible database. I have a selection of popular verses and a Bible dictionary with 40+ terms. Try asking like:\n\n\u2022 \u201cWhat does John 3:16 say?\u201d\n\u2022 \u201cDefine grace\u201d\n\u2022 \u201cWhat is faith?\u201d\n\u2022 \u201cShow me Philippians 4:13\u201d',
    suggestions: BIBLE_SUGGESTIONS,
  };
}

function findAnswer(query: string): { content: string; suggestions?: string[] } {
  const lower = query.toLowerCase();

  if (isBibleQuery(lower)) {
    return findBibleAnswer(query);
  }

  if (lower.includes('what') && (lower.includes('platform') || lower.includes('app') || lower.includes('this') || lower.includes('do') || lower.includes('everything'))) {
    return { content: OVERVIEW_ANSWER, suggestions: DEFAULT_SUGGESTIONS };
  }

  let bestMatch: Topic | null = null;
  let bestScore = 0;

  for (const topic of KNOWLEDGE_BASE) {
    for (const keyword of topic.keywords) {
      if (lower.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = topic;
        }
      }
    }
  }

  if (bestMatch) {
    return { content: bestMatch.answer, suggestions: bestMatch.suggestions };
  }

  return {
    content: 'I\'m not quite sure about that one. I can help with platform features, Bible verses, and Bible dictionary terms. Here are some suggestions:',
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

function formatContent(content: string): ReactNode {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    if (line.trim().startsWith('**') || /^\d+\.\s\*\*/.test(line.trim())) {
      const cleaned = line.replace(/\*\*/g, '');
      return <p key={i} className="font-semibold text-slate-900 dark:text-white mt-2 first:mt-0">{cleaned}</p>;
    }
    if (/^\d+\./.test(line.trim())) {
      return <p key={i} className="ml-3 text-sm leading-relaxed">{line}</p>;
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    return <p key={i} className="text-sm leading-relaxed">{line}</p>;
  });
}

export function AIAssistant() {
  const { workspace } = useWorkspace();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI assistant for ${workspace?.name ?? "God's Kingdom Connect"}. I can explain every feature in this platform. Ask me anything, or tap a suggestion below.`,
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);
  const [bibleMode, setBibleMode] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  function sendQuery(query: string) {
    if (!query.trim()) return;
    const userMsg: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const result = findAnswer(query);
      const assistantMsg: Message = {
        role: 'assistant',
        content: result.content,
        suggestions: result.suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTyping(false);
    }, 500 + Math.random() * 400);
  }

  if (!workspace) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium text-sm shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform group"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            <Bot size={22} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-amber-500 animate-pulse" />
          </div>
          <span className="hidden sm:inline">Ask AI</span>
          <Sparkles size={14} className="text-amber-200 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline ml-1 text-[10px] font-normal text-amber-200/80">+ Bible</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-full sm:h-[600px] sm:max-h-[85vh] sm:bottom-5 sm:right-5 sm:rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className={`flex items-center gap-3 px-4 py-3.5 text-white flex-shrink-0 transition-colors ${bibleMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {bibleMode ? <BookOpen size={20} /> : <Bot size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-tight">{bibleMode ? 'Bible Assistant' : 'AI Assistant'}</h3>
              <p className="text-[11px] text-white/80 leading-tight truncate">{bibleMode ? 'Verses & Dictionary' : `${t('app.name')} Help Center`}</p>
            </div>
            <button
              onClick={() => {
                setBibleMode(!bibleMode);
                setMessages([{
                  role: 'assistant',
                  content: bibleMode
                    ? `Hi! I'm your AI assistant for ${workspace?.name ?? "God's Kingdom Connect"}. I can explain every feature in this platform. Ask me anything, or tap a suggestion below.`
                    : `Hi! I'm your Bible Assistant. I can look up Bible verses and explain biblical terms from the dictionary. Try asking like:\n\n\u2022 \u201cWhat does John 3:16 say?\u201d\n\u2022 \u201cDefine grace\u201d\n\u2022 \u201cWhat is faith?\u201d`,
                  suggestions: bibleMode ? DEFAULT_SUGGESTIONS : BIBLE_SUGGESTIONS,
                }]);
              }}
              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${bibleMode ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
              aria-label="Toggle Bible mode"
              title={bibleMode ? 'Switch to Help mode' : 'Switch to Bible mode'}
            >
              {bibleMode ? <Bot size={18} /> : <BookOpen size={18} />}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label="Close assistant"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 ${
                      msg.role === 'user'
                        ? `${bibleMode ? 'bg-blue-600' : 'bg-amber-500'} text-white rounded-br-md`
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {msg.role === 'assistant' ? formatContent(msg.content) : <p className="text-sm">{msg.content}</p>}
                  </div>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendQuery(s)}
                          className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${bibleMode ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/20'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <a
              href="mailto:gloryk@godskingdomconnect.org"
              className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors border border-slate-200 dark:border-slate-600"
            >
              <Mail size={13} /> Email
            </a>
            <a
              href="tel:+15133161796"
              className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors border border-slate-200 dark:border-slate-600"
            >
              <Phone size={13} /> Call
            </a>
            <div className="flex-1" />
            <span className="text-[10px] text-slate-400 hidden sm:block">{t('app.name')}</span>
            <Church size={13} className="text-amber-500 flex-shrink-0" />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuery(input); } }}
              placeholder={bibleMode ? 'Ask about a verse or biblical term...' : 'Ask about any feature...'}
              className={`flex-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 transition-all ${bibleMode ? 'focus:ring-blue-500/40' : 'focus:ring-amber-500/40'}`}
            />
            <button
              onClick={() => sendQuery(input)}
              disabled={!input.trim() || typing}
              className={`flex items-center justify-center w-10 h-10 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 ${bibleMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'}`}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
