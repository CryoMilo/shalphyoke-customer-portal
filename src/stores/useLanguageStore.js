import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useLanguageStore = create(
	persist(
		(set) => ({
			currentLang: "en", // 'en' | 'mm' | 'th'
			setLanguage: (lang) => set({ currentLang: lang }),
		}),
		{
			name: "shalphyoke_language",
		}
	)
);

/**
 * Helper to get item name in selected language with fallback
 */
export const getItemName = (item, lang) => {
	if (!item) return "";
	if (lang === "mm") return item.name_burmese || item.name_english || item.name_thai;
	if (lang === "th") return item.name_thai || item.name_english || item.name_burmese;
	return item.name_english || item.name_burmese || item.name_thai;
};
