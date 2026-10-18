import { useEffect, useState, useRef } from 'react';
import { useCustomization } from '@/context/CustomizationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import {
  Image as ImageIcon,
  Church,
  Upload,
  Eye,
  Sparkles,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

export function Customize() {
  const { customization, loading, save } = useCustomization();
  const { workspace, role } = useWorkspace();
  const { t } = useLanguage();
  const [logoInput, setLogoInput] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (customization?.logo_url) setLogoInput(customization.logo_url);
  }, [customization?.logo_url]);

  async function updateField(field: string, value: string | null) {
    if (!customization) return;
    await save({ [field]: value } as Record<string, string | null>);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(file: File) {
    if (!workspace) return;
    setUploadingLogo(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${workspace.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('church-logos')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('church-logos').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      setLogoInput(publicUrl);
      await updateField('logo_url', publicUrl);
    }
    setUploadingLogo(false);
  }

  async function removeLogo() {
    setLogoInput('');
    await updateField('logo_url', null);
  }

  if (loading || !customization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500" />
          {t('customize.title')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">{t('customize.subtitle')}</p>
      </div>

      {/* Logo Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ImageIcon size={17} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">{t('customize.logoTitle')}</h2>
            <p className="text-[11px] text-slate-400">PNG, JPG, WEBP or SVG</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoUpload(file);
            e.target.value = '';
          }}
        />

        {/* Logo preview / upload area */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
          {customization.logo_url ? (
            <img src={customization.logo_url} alt="Logo preview" className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-500 dark:hover:border-amber-500 transition-colors group"
            >
              {uploadingLogo ? (
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={28} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
              )}
            </button>
          )}

          <div className="flex-1 w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-md shadow-amber-500/20"
            >
              <Upload size={16} />
              {uploadingLogo ? 'Uploading...' : 'Upload Church Logo'}
            </button>
            <p className="text-[11px] text-slate-400 mt-1.5 text-center">or paste an image URL below</p>
            <input
              value={logoInput}
              onChange={(e) => setLogoInput(e.target.value)}
              onBlur={() => updateField('logo_url', logoInput.trim() || null)}
              className="form-input mt-1.5 text-xs"
              placeholder="https://example.com/church-logo.png"
            />
            <p className="text-[11px] text-slate-400 mt-1">{t('customize.logoHint')}</p>
          </div>
        </div>

        {customization.logo_url && (
          <button
            onClick={removeLogo}
            className="flex items-center gap-1.5 text-xs text-rose-500 font-medium hover:underline"
          >
            <Trash2 size={14} /> {t('customize.removeLogo')}
          </button>
        )}
      </div>

      {/* Prayer Sharing Toggle - Pastor only */}
      {role === 'pastor' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldCheck size={17} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">{t('customize.prayerSharingTitle')}</h2>
              <p className="text-[11px] text-slate-400">{t('customize.prayerSharingDesc')}</p>
            </div>
          </div>
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 cursor-pointer">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('customize.prayerSharingLabel')}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t('customize.prayerSharingHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => save({ prayer_shared_with_coordinators: !customization.prayer_shared_with_coordinators })}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                customization.prayer_shared_with_coordinators
                  ? 'bg-amber-500'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  customization.prayer_shared_with_coordinators ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </label>
        </div>
      )}

      {/* Live Preview */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm" style={{ background: customization.bg_color }}>
        <div className="p-4 flex items-center gap-3">
          {customization.logo_url ? (
            <img src={customization.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${customization.primary_color}, ${customization.accent_color})` }}
            >
              <Church size={22} className="text-white" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-base" style={{ color: customization.primary_color, fontFamily: customization.font_family }}>
              {workspace?.name ?? "God's Kingdom Connect"}
            </h2>
            <p className="text-xs text-slate-500" style={{ fontFamily: customization.font_family }}>
              {t('customize.preview')}
            </p>
          </div>
          <span className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: customization.primary_color + '20', color: customization.primary_color }}>
            <Eye size={12} className="inline mr-1" /> {t('customize.livePreview')}
          </span>
        </div>
      </div>
    </div>
  );
}
