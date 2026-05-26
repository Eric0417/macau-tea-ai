import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="glass glass-thin rounded-full px-3 py-1.5 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-xs"
      >
        <Globe size={14} className="relative z-10" />
        <span className="relative z-10">{current.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 glass rounded-2xl p-1.5 min-w-[130px] shadow-xl">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
                className={`block w-full text-left rounded-xl px-3 py-2 text-sm transition-colors relative z-10 ${
                  lang.code === i18n.language
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
