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
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 hover:border-neon-green transition-all group shadow-lg shadow-black/20"
        >
            <span className="text-lg leading-none filter drop-shadow-md group-hover:scale-110 transition-transform">{i18n.language === 'th' ? '🇹🇭' : '🇬🇧'}</span>
            <span className="text-xs font-display font-bold text-zinc-300 uppercase tracking-widest group-hover:text-neon-green">
                {i18n.language === 'th' ? 'TH' : 'EN'}
            </span>
        </button>
    );
};
