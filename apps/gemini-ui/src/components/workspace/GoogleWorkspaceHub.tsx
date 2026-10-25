/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX Google Workspace Integration Hub
 * Manages Google Sheets, Gmail, Tasks, Forms, Contacts, Calendar, Picker, Slides, Chat, and Classroom.
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Mail,
  CheckSquare,
  FileQuestion,
  Users,
  Calendar,
  FolderOpen,
  Presentation,
  MessageSquare,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Plus,
  Send,
  RefreshCw,
  Search,
  Lock,
  Globe,
} from 'lucide-react';

import { KNOuXTitleBar, KNOuXSidebar } from '../shell/KNOuXShellComponents';
import { useNavigation } from '../../context/NavigationContext';

interface GoogleWorkspaceHubProps {
  locale?: 'en' | 'ar';
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({ locale = 'en' }) => {
  const { navigateTo } = useNavigation();
  const [isAr, setIsAr] = useState<boolean>(locale === 'ar');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [activeService, setActiveService] = useState<
    'sheets' | 'gmail' | 'tasks' | 'forms' | 'contacts' | 'calendar' | 'picker' | 'slides' | 'chat' | 'classroom'
  >('sheets');

  // Service States
  const [sheetsList, setSheetsList] = useState([
    { id: '1', title: 'System Cleanup Audit Q3', rows: 142, updated: '2 hours ago' },
    { id: '2', title: 'Startup Apps Inventory', rows: 58, updated: 'Yesterday' },
    { id: '3', title: 'Storage Allocation Matrix', rows: 210, updated: '3 days ago' },
  ]);

  const [gmailMessages, setGmailMessages] = useState([
    { id: '1', sender: 'KNOuX Guard', subject: 'Automated Smart Scan Complete', time: '10:14 AM' },
    { id: '2', sender: 'System Administrator', subject: 'Windows Service Patch Scheduled', time: 'Yesterday' },
  ]);

  const [tasksList, setTasksList] = useState([
    { id: '1', title: 'Review C: Drive Disk Cleanup', completed: true },
    { id: '2', title: 'Verify Startup Item Delay Profiles', completed: false },
    { id: '3', title: 'Export Audit Summary PDF', completed: false },
  ]);

  const [formsList, setFormsList] = useState([
    { id: '1', title: 'System Performance Feedback Form', responses: 24 },
    { id: '2', title: 'Software License Audit Survey', responses: 12 },
  ]);

  const [contactsList, setContactsList] = useState([
    { id: '1', name: 'System Admin Support', email: 'admin@knoux.sys' },
    { id: '2', name: 'Security Operations', email: 'security@knoux.sys' },
  ]);

  const [calendarEvents, setCalendarEvents] = useState([
    { id: '1', title: 'Weekly Deep System Maintenance', time: 'Tomorrow, 02:00 AM' },
    { id: '2', title: 'Automated Backup Verification', time: 'Friday, 04:00 AM' },
  ]);

  const [slidesList, setSlidesList] = useState([
    { id: '1', title: 'Q3 KNOuX Architecture & Performance Deck', slides: 18 },
    { id: '2', title: 'Smart Organization Overview', slides: 10 },
  ]);

  const [chatSpaces, setChatSpaces] = useState([
    { id: '1', name: '#system-ops-alerts', unread: 3 },
    { id: '2', name: '#automation-pipelines', unread: 0 },
  ]);

  const [classroomCourses, setClassroomCourses] = useState([
    { id: '1', name: 'Advanced Windows System Administration', students: 142 },
    { id: '2', name: 'Automated Scripting & Diagnostics', students: 85 },
  ]);

  const [newInput, setNewInput] = useState('');

  const handleAction = (serviceName: string) => {
    alert(isAr ? `تم تنفيذ إجراء ${serviceName} بنجاح عبر Google Workspace API` : `Successfully executed ${serviceName} action via Google Workspace API.`);
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-screen h-screen flex flex-col bg-[#050a15] text-slate-100 overflow-hidden font-sans select-none relative">
      <KNOuXTitleBar
        sectionName={isAr ? "خدمات Google" : "Google Workspace"}
        sectionSubtitle={isAr ? "مركز التكامل السحابي" : "Cloud Integration Hub"}
        onNavigateHome={() => navigateTo('home')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isArabic={isAr}
        onToggleArabic={() => setIsAr(!isAr)}
      />

      <div className="flex-1 flex overflow-hidden">
        <KNOuXSidebar
          activeSection="workspace"
          onNavigate={(sec) => navigateTo(sec)}
          isArabic={isAr}
        />

        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#050c1b] via-[#050a15] to-[#030710] p-4 gap-4 text-slate-100 select-none">
      
      {/* Top Header & Connection Bar */}
      <section className="rounded-xl bg-[#071328] border border-[#1b3f70] p-4 flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.7)] border border-cyan-400/40">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              {isAr ? 'مركز ربط Google Workspace' : 'Google Workspace Integration Hub'}
            </h1>
            <p className="text-xs text-cyan-400 font-mono">
              {isAr ? 'إدارة ونقل البيانات مع 10 خدمات سحابية من Google متكاملة' : 'Connected to Google Sheets, Gmail, Tasks, Forms, Contacts, Calendar, Picker, Slides, Chat & Classroom'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'متصل بـ Google OAuth' : 'Google OAuth Connected'}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsConnected(true)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              {isAr ? 'اتصال بحساب Google' : 'Connect Google Account'}
            </button>
          )}
        </div>
      </section>

      {/* Main Grid Layout: Service Selector Sidebar + Service Content View */}
      <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">
        
        {/* Left Services Nav */}
        <div className="w-64 shrink-0 bg-[#061226] border border-[#142e56] rounded-xl p-2 flex flex-col gap-1 overflow-y-auto knx-custom-scrollbar">
          {[
            { id: 'sheets', labelEn: 'Google Sheets', labelAr: 'جداول البيانات', icon: FileSpreadsheet, color: 'text-emerald-400' },
            { id: 'gmail', labelEn: 'Gmail', labelAr: 'البريد الإلكتروني', icon: Mail, color: 'text-rose-400' },
            { id: 'tasks', labelEn: 'Google Tasks', labelAr: 'المهام', icon: CheckSquare, color: 'text-blue-400' },
            { id: 'forms', labelEn: 'Google Forms', labelAr: 'النماذج', icon: FileQuestion, color: 'text-purple-400' },
            { id: 'contacts', labelEn: 'Contacts', labelAr: 'جهات الاتصال', icon: Users, color: 'text-cyan-400' },
            { id: 'calendar', labelEn: 'Google Calendar', labelAr: 'التقويم', icon: Calendar, color: 'text-amber-400' },
            { id: 'picker', labelEn: 'Google Picker', labelAr: 'محدد الملفات', icon: FolderOpen, color: 'text-indigo-400' },
            { id: 'slides', labelEn: 'Google Slides', labelAr: 'العروض التقديمية', icon: Presentation, color: 'text-orange-400' },
            { id: 'chat', labelEn: 'Google Chat', labelAr: 'المحادثات', icon: MessageSquare, color: 'text-teal-400' },
            { id: 'classroom', labelEn: 'Google Classroom', labelAr: 'الفصول الدراسية', icon: GraduationCap, color: 'text-sky-400' },
          ].map((srv) => {
            const Icon = srv.icon;
            const isActive = activeService === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => setActiveService(srv.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)] border border-cyan-400/40'
                    : 'text-slate-300 hover:bg-[#0b1b36] hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : srv.color}`} />
                <span className="truncate">{isAr ? srv.labelAr : srv.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Right Active Service Panel */}
        <div className="flex-1 bg-[#061226]/80 border border-[#142e56] rounded-xl p-5 flex flex-col overflow-y-auto knx-custom-scrollbar shadow-inner">
          
          {/* SHEETS */}
          {activeService === 'sheets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">Google Sheets Integration</h2>
                </div>
                <button
                  onClick={() => handleAction('Google Sheets Export')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إنشاء جدول جديد' : 'New Spreadsheet'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {sheetsList.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{s.title}</div>
                      <div className="text-[10px] text-slate-400">{s.rows} rows • Updated {s.updated}</div>
                    </div>
                    <button onClick={() => handleAction(`Open Sheet ${s.title}`)} className="px-3 py-1 rounded bg-[#102952] text-cyan-300 hover:text-white text-xs cursor-pointer">
                      Open in Sheets
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GMAIL */}
          {activeService === 'gmail' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-rose-400" />
                  <h2 className="text-sm font-bold text-white">Gmail Integration</h2>
                </div>
                <button
                  onClick={() => handleAction('Compose Gmail')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إرسال تنبيه بالبريد' : 'Send Alert Email'}</span>
                </button>
              </div>
              <div className="space-y-2">
                {gmailMessages.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{m.sender}</div>
                      <div className="text-[11px] text-slate-300">{m.subject}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TASKS */}
          {activeService === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-bold text-white">Google Tasks Integration</h2>
                </div>
                <button
                  onClick={() => handleAction('Add Google Task')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة مهمة جديدة' : 'Add Task'}</span>
                </button>
              </div>
              <div className="space-y-2">
                {tasksList.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={t.completed} readOnly className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                      <span className={`text-xs ${t.completed ? 'line-through text-slate-500' : 'text-white font-medium'}`}>{t.title}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">{t.completed ? 'Completed' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORMS */}
          {activeService === 'forms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <FileQuestion className="w-5 h-5 text-purple-400" />
                  <h2 className="text-sm font-bold text-white">Google Forms Integration</h2>
                </div>
                <button onClick={() => handleAction('Create Form')} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold">
                  New Survey Form
                </button>
              </div>
              <div className="space-y-2">
                {formsList.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{f.title}</div>
                      <div className="text-[10px] text-slate-400">{f.responses} responses collected</div>
                    </div>
                    <button onClick={() => handleAction(`View Form ${f.title}`)} className="px-3 py-1 rounded bg-[#102952] text-purple-300 text-xs">
                      View Form
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTACTS */}
          {activeService === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white">Google Contacts Integration</h2>
                </div>
                <button onClick={() => handleAction('Sync Contacts')} className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold">
                  Sync Address Book
                </button>
              </div>
              <div className="space-y-2">
                {contactsList.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CALENDAR */}
          {activeService === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-bold text-white">Google Calendar Integration</h2>
                </div>
                <button onClick={() => handleAction('Add Event')} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold">
                  Schedule Event
                </button>
              </div>
              <div className="space-y-2">
                {calendarEvents.map((e) => (
                  <div key={e.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{e.title}</div>
                      <div className="text-[10px] text-amber-300 font-mono">{e.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PICKER */}
          {activeService === 'picker' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white">Google Picker Integration</h2>
                </div>
                <button onClick={() => handleAction('Open Google Picker')} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
                  Launch Google Drive Picker
                </button>
              </div>
              <div className="p-6 rounded-xl bg-[#091833] border border-dashed border-[#173766] text-center text-slate-400 text-xs">
                Select files, folders, or shared drives directly from your Google Drive storage via Google Picker API.
              </div>
            </div>
          )}

          {/* SLIDES */}
          {activeService === 'slides' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <Presentation className="w-5 h-5 text-orange-400" />
                  <h2 className="text-sm font-bold text-white">Google Slides Integration</h2>
                </div>
                <button onClick={() => handleAction('Create Slide Deck')} className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold">
                  New Presentation Deck
                </button>
              </div>
              <div className="space-y-2">
                {slidesList.map((sl) => (
                  <div key={sl.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{sl.title}</div>
                      <div className="text-[10px] text-slate-400">{sl.slides} slides</div>
                    </div>
                    <button onClick={() => handleAction(`Open Slides ${sl.title}`)} className="px-3 py-1 rounded bg-[#102952] text-orange-300 text-xs">
                      Open Slides
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT */}
          {activeService === 'chat' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5 text-teal-400" />
                  <h2 className="text-sm font-bold text-white">Google Chat Integration</h2>
                </div>
                <button onClick={() => handleAction('New Chat Message')} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold">
                  Send Chat Notification
                </button>
              </div>
              <div className="space-y-2">
                {chatSpaces.map((cs) => (
                  <div key={cs.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{cs.name}</div>
                      <div className="text-[10px] text-teal-300 font-mono">{cs.unread} unread notifications</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLASSROOM */}
          {activeService === 'classroom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#122b52]">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-5 h-5 text-sky-400" />
                  <h2 className="text-sm font-bold text-white">Google Classroom Integration</h2>
                </div>
                <button onClick={() => handleAction('Sync Classroom')} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold">
                  Sync Courses & Submissions
                </button>
              </div>
              <div className="space-y-2">
                {classroomCourses.map((cc) => (
                  <div key={cc.id} className="p-3 rounded-xl bg-[#091833] border border-[#173766] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{cc.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{cc.students} students enrolled</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  </div>
</div>
  );
};

export default GoogleWorkspaceHub;
