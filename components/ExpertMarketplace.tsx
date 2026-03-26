import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { ExpertProfile, ConsultationServiceType } from '../types';
import { listExperts, getMyExpertProfile, upsertExpertProfile, createConsultationRequest } from '../services/supabaseService';
import { Search, Star, Clock, DollarSign, CheckCircle2, X, Briefcase, Code, Shield, Users, BookOpen, MessageSquare, ExternalLink, ChevronDown, Sparkles } from 'lucide-react';

interface ExpertMarketplaceProps {
  authUser: User | null;
  repoUrl?: string;
  analysisId?: string | null;
  onClose?: () => void;
}

const SERVICE_TYPES: { value: ConsultationServiceType; label: string; icon: React.ElementType }[] = [
  { value: 'code_review', label: 'Code Review', icon: Code },
  { value: 'security_audit', label: 'Security Audit', icon: Shield },
  { value: 'architecture', label: 'Architecture Review', icon: Briefcase },
  { value: 'onboarding', label: 'Onboarding Help', icon: BookOpen },
  { value: 'mentoring', label: 'Mentoring', icon: Users },
  { value: 'other', label: 'Other', icon: MessageSquare },
];

const SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'Java', 'AWS', 'GCP', 'Azure',
  'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST API', 'Security',
  'Performance', 'DevOps', 'CI/CD', 'Mobile', 'Flutter', 'Swift', 'Kotlin',
];

const ExpertMarketplace: React.FC<ExpertMarketplaceProps> = ({ authUser, repoUrl, analysisId, onClose }) => {
  const [view, setView] = useState<'directory' | 'profile' | 'hire'>('directory');
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSkill, setFilterSkill] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile editor state
  const [myProfile, setMyProfile] = useState<ExpertProfile | null>(null);
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editRate, setEditRate] = useState('');
  const [editYears, setEditYears] = useState('');
  const [editAvailability, setEditAvailability] = useState<ExpertProfile['availability']>('available');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Hire modal state
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);
  const [hireServiceType, setHireServiceType] = useState<ConsultationServiceType>('code_review');
  const [hireMessage, setHireMessage] = useState('');
  const [hireBudget, setHireBudget] = useState('');
  const [hiring, setHiring] = useState(false);
  const [hireSuccess, setHireSuccess] = useState(false);

  const loadExperts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listExperts({ skill: filterSkill || undefined });
      setExperts(data);
    } catch { /* silent */ }
    setLoading(false);
  }, [filterSkill]);

  const loadMyProfile = useCallback(async () => {
    if (!authUser) return;
    try {
      const profile = await getMyExpertProfile(authUser.id);
      setMyProfile(profile);
      if (profile) {
        setEditHeadline(profile.headline);
        setEditBio(profile.bio);
        setEditSkills(profile.skills);
        setEditRate(String(profile.hourlyRate / 100));
        setEditYears(String(profile.yearsExperience));
        setEditAvailability(profile.availability);
        setEditGithub(profile.githubUrl || '');
        setEditLinkedin(profile.linkedinUrl || '');
        setEditWebsite(profile.websiteUrl || '');
      }
    } catch { /* silent */ }
  }, [authUser]);

  useEffect(() => { void loadExperts(); }, [loadExperts]);
  useEffect(() => { void loadMyProfile(); }, [loadMyProfile]);

  const handleSaveProfile = async () => {
    if (!authUser) return;
    setSaving(true);
    try {
      const saved = await upsertExpertProfile(authUser.id, {
        headline: editHeadline,
        bio: editBio,
        skills: editSkills,
        hourlyRate: Math.round(parseFloat(editRate || '0') * 100),
        yearsExperience: parseInt(editYears || '0', 10),
        githubUrl: editGithub || undefined,
        linkedinUrl: editLinkedin || undefined,
        websiteUrl: editWebsite || undefined,
        availability: editAvailability,
      });
      setMyProfile(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      void loadExperts();
    } catch { /* silent */ }
    setSaving(false);
  };

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !editSkills.includes(s)) {
      setEditSkills([...editSkills, s]);
    }
    setSkillInput('');
  };

  const handleHire = async () => {
    if (!authUser || !selectedExpert) return;
    setHiring(true);
    try {
      await createConsultationRequest({
        requesterId: authUser.id,
        expertId: selectedExpert.id,
        repoUrl: repoUrl || undefined,
        analysisId: analysisId || undefined,
        serviceType: hireServiceType,
        message: hireMessage,
        budgetCents: hireBudget ? Math.round(parseFloat(hireBudget) * 100) : undefined,
      });
      setHireSuccess(true);
      setTimeout(() => {
        setHireSuccess(false);
        setView('directory');
        setSelectedExpert(null);
        setHireMessage('');
        setHireBudget('');
      }, 3000);
    } catch { /* silent */ }
    setHiring(false);
  };

  const filteredExperts = experts.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.headline.toLowerCase().includes(q) ||
      e.bio.toLowerCase().includes(q) ||
      e.skills.some(s => s.toLowerCase().includes(q)) ||
      (e.displayName || '').toLowerCase().includes(q) ||
      (e.githubLogin || '').toLowerCase().includes(q)
    );
  });

  const availabilityColor = (a: ExpertProfile['availability']) =>
    a === 'available' ? 'text-emerald-400 bg-emerald-500/10' :
    a === 'busy' ? 'text-amber-400 bg-amber-500/10' :
    'text-slate-500 bg-slate-800';

  // ─── PROFILE EDITOR VIEW ───
  if (view === 'profile') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Your Expert Profile</h2>
            <p className="text-slate-500 text-sm mt-1">Set up your profile to appear in the marketplace and receive consultation requests</p>
          </div>
          <button onClick={() => setView('directory')} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Headline</label>
            <input value={editHeadline} onChange={e => setEditHeadline(e.target.value)} placeholder="e.g. Senior Full-Stack Engineer • React & Node.js Expert" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bio</label>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} placeholder="Tell potential clients about your experience, specialties, and what you can help with..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Skills</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {editSkills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold">
                  {s}
                  <button onClick={() => setEditSkills(editSkills.filter(x => x !== s))} className="hover:text-red-400 ml-1"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }} placeholder="Add a skill..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500" />
              <button onClick={handleAddSkill} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {SKILL_SUGGESTIONS.filter(s => !editSkills.includes(s)).slice(0, 12).map(s => (
                <button key={s} onClick={() => setEditSkills([...editSkills, s])} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold transition-all">
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hourly Rate (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="number" value={editRate} onChange={e => setEditRate(e.target.value)} placeholder="150" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-white text-sm outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Years Experience</label>
              <input type="number" value={editYears} onChange={e => setEditYears(e.target.value)} placeholder="5" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Availability</label>
              <select value={editAvailability} onChange={e => setEditAvailability(e.target.value as ExpertProfile['availability'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 appearance-none">
                <option value="available">Available</option>
                <option value="busy">Busy (limited)</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">GitHub URL</label>
              <input value={editGithub} onChange={e => setEditGithub(e.target.value)} placeholder="https://github.com/username" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">LinkedIn URL</label>
              <input value={editLinkedin} onChange={e => setEditLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Website</label>
              <input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="https://yoursite.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button onClick={handleSaveProfile} disabled={saving || !editHeadline} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all text-sm">
              {saving ? 'Saving...' : myProfile ? 'Update Profile' : 'Create Profile'}
            </button>
            {saveSuccess && (
              <span className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" /> Profile saved!
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── HIRE FLOW VIEW ───
  if (view === 'hire' && selectedExpert) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Request Consultation</h2>
            <p className="text-slate-500 text-sm mt-1">Send a request to <span className="text-indigo-400">{selectedExpert.displayName || selectedExpert.githubLogin || 'Expert'}</span></p>
          </div>
          <button onClick={() => { setView('directory'); setSelectedExpert(null); }} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {hireSuccess ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white mb-2">Request Sent!</h3>
            <p className="text-slate-400 text-sm">The expert will review your request and respond soon.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Expert Summary Card */}
            <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="w-12 h-12 bg-indigo-500/15 rounded-full flex items-center justify-center text-lg font-black text-indigo-400">
                {(selectedExpert.displayName || selectedExpert.githubLogin || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-white font-bold">{selectedExpert.displayName || selectedExpert.githubLogin}</div>
                <div className="text-slate-500 text-xs">{selectedExpert.headline}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-black">${(selectedExpert.hourlyRate / 100).toFixed(0)}/hr</div>
                {selectedExpert.avgRating > 0 && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3 h-3 fill-amber-400" /> {selectedExpert.avgRating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SERVICE_TYPES.map(st => (
                  <button
                    key={st.value}
                    onClick={() => setHireServiceType(st.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all ${hireServiceType === st.value ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-indigo-500/40'}`}
                  >
                    <st.icon className="w-3.5 h-3.5" /> {st.label}
                  </button>
                ))}
              </div>
            </div>

            {repoUrl && (
              <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <Code className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-300">Linked repo: <span className="text-indigo-400 font-bold">{repoUrl.replace('https://github.com/', '')}</span></span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Message</label>
              <textarea value={hireMessage} onChange={e => setHireMessage(e.target.value)} rows={5} placeholder="Describe what you need help with, your timeline, and any specific requirements..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Budget (USD, optional)</label>
              <div className="relative max-w-xs">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="number" value={hireBudget} onChange={e => setHireBudget(e.target.value)} placeholder="e.g. 500" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-white text-sm outline-none focus:border-indigo-500" />
              </div>
            </div>

            <button onClick={handleHire} disabled={hiring || !hireMessage.trim()} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all text-sm">
              {hiring ? 'Sending Request...' : 'Send Consultation Request'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── DIRECTORY VIEW (DEFAULT) ───
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-400" /> Expert Marketplace
          </h2>
          <p className="text-slate-500 text-sm mt-1">Hire experienced developers for code reviews, audits, and consulting</p>
        </div>
        <div className="flex items-center gap-3">
          {authUser && (
            <button onClick={() => setView('profile')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all">
              {myProfile ? 'Edit My Profile' : 'Become an Expert'}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search experts by name, skill, or specialty..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors" />
        </div>
        <div className="relative">
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-9 text-white text-sm outline-none focus:border-indigo-500 appearance-none min-w-[160px]">
            <option value="">All Skills</option>
            {SKILL_SUGGESTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Expert Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredExperts.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-3xl">
          <Briefcase className="w-16 h-16 text-indigo-500/30 mx-auto mb-6" />
          <h3 className="text-xl font-black text-white mb-3">No experts yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            {authUser ? 'Be the first to create an expert profile and start earning!' : 'Sign in to become an expert or hire one.'}
          </p>
          {authUser && (
            <button onClick={() => setView('profile')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-8 rounded-2xl transition-all text-sm">
              Create Your Profile
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExperts.map(expert => (
            <div key={expert.id} className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-500/15 rounded-full flex items-center justify-center text-lg font-black text-indigo-400 flex-shrink-0">
                  {expert.avatarUrl ? (
                    <img src={expert.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    (expert.displayName || expert.githubLogin || '?')[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-black truncate">{expert.displayName || expert.githubLogin || 'Expert'}</h3>
                    {expert.isFeatured && <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                  </div>
                  <p className="text-slate-400 text-xs truncate">{expert.headline}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-white font-black text-sm">${(expert.hourlyRate / 100).toFixed(0)}/hr</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${availabilityColor(expert.availability)}`}>
                    {expert.availability}
                  </span>
                </div>
              </div>

              <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">{expert.bio}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {expert.skills.slice(0, 5).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-bold uppercase tracking-wider">{s}</span>
                ))}
                {expert.skills.length > 5 && <span className="text-[9px] text-slate-600">+{expert.skills.length - 5}</span>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {expert.avgRating > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" /> {expert.avgRating.toFixed(1)} ({expert.totalReviews})
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {expert.yearsExperience}y exp</span>
                  {expert.githubLogin && (
                    <a href={`https://github.com/${expert.githubLogin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                      <ExternalLink className="w-3 h-3" /> GitHub
                    </a>
                  )}
                </div>
                {authUser && authUser.id !== expert.userId && (
                  <button
                    onClick={() => { setSelectedExpert(expert); setView('hire'); }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    Hire
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpertMarketplace;
