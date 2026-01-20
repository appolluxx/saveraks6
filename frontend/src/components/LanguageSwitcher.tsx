import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const toggleLang = () => {
        const next = i18n.language === 'th' ? 'en' : 'th';
        i18n.changeLanguage(next);
    };

    return (
        <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm active:scale-95"
        >
            <span className="text-lg leading-none filter drop-shadow-sm group-hover:scale-110 transition-transform">{i18n.language === 'th' ? '🇹🇭' : '🇬🇧'}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-emerald-600 font-mono">
                {i18n.language === 'th' ? 'TH' : 'EN'}
            </span>
        </button>
    );
};
