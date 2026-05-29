import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const LANGUAGES = ['zh', 'zh-CN', 'pt', 'en', 'ko', 'ja'];

const LABELS = {
  zh:    { zh: '繁體中文', 'zh-CN': '繁体中文', pt: 'Chinês Tradicional', en: 'Traditional Chinese', ko: '번체 중국어', ja: '繁体中国語' },
  'zh-CN': { zh: '簡體中文', 'zh-CN': '简体中文', pt: 'Chinês Simplificado', en: 'Simplified Chinese', ko: '간체 중국어', ja: '簡体中国語' },
  pt:    { zh: '葡萄牙語', 'zh-CN': '葡萄牙语', pt: 'Português', en: 'Portuguese', ko: '포르투갈어', ja: 'ポルトガル語' },
  en:    { zh: '英文', 'zh-CN': '英文', pt: 'Inglês', en: 'English', ko: '영어', ja: '英語' },
  ko:    { zh: '韓文', 'zh-CN': '韩文', pt: 'Coreano', en: 'Korean', ko: '한국어', ja: '韓国語' },
  ja:    { zh: '日文', 'zh-CN': '日文', pt: 'Japonês', en: 'Japanese', ko: '일본어', ja: '日本語' },
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = i18n.language;
  const currentLabel = LABELS[current]?.[current] || current;

  const selectLang = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="glass-btn glass-btn-cream glass-btn-sm rounded-full px-3 py-1.5 text-azulejo-600"
      >
        <Globe size={14} className="relative z-10" />
        <span className="relative z-10">{currentLabel}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 glass-thick rounded-2xl p-1.5 min-w-[150px] shadow-xl border border-azulejo-200 bg-white">
            {LANGUAGES.map(code => (
              <button
                key={code}
                onClick={() => selectLang(code)}
                className={`block w-full text-left rounded-xl px-3 py-2 text-sm transition-colors relative z-10 ${
                  code === current
                    ? 'text-azulejo-900 bg-azulejo-50'
                    : 'text-azulejo-600 hover:text-azulejo-900 hover:bg-azulejo-50/50'
                }`}
              >
                {LABELS[code]?.[current] || code}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
