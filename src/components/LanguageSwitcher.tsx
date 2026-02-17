import React, { useState, useRef, useEffect } from "react";
import { useSpring, animated, useTransition } from "@react-spring/web";
import { useI18n } from "../contexts/I18nContext";
import { Locale, localeNames } from "../i18n";
import { useTheme } from "../contexts/ThemeContext";

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = "" }) => {
  const { locale, setLocale, t } = useI18n();
  const { theme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuTransitions = useTransition(showMenu, {
    from: { opacity: 0, transform: "translateY(-10px) scale(0.95)" },
    enter: { opacity: 1, transform: "translateY(0px) scale(1)" },
    leave: { opacity: 0, transform: "translateY(-10px) scale(0.95)" },
    config: { tension: 300, friction: 25 },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setShowMenu(false);
  };

  const locales: Locale[] = ["en", "zh", "ja"];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`
          px-3 py-2 rounded-xl
          transition-all duration-200
          flex items-center gap-2
          ${theme === "light"
            ? "bg-black/5 hover:bg-black/10 text-black/70 hover:text-black"
            : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
          }
        `}
        title={t("topBar.language")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-sm font-medium">{localeNames[locale]}</span>
      </button>

      {menuTransitions((style, item) =>
        item ? (
          <animated.div
            style={style}
            className={`
              absolute top-full right-0 mt-2 z-50
              min-w-[140px] rounded-2xl
              backdrop-blur-[100px] saturate-150
              shadow-[0_20px_50px_rgba(0,0,0,0.3)]
              border overflow-hidden
              ${theme === "light"
                ? "bg-white/90 border-black/10"
                : "bg-black/40 border-white/10"
              }
            `}
          >
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`
                  w-full px-4 py-2.5 text-left text-sm font-medium
                  transition-colors duration-150
                  flex items-center justify-between
                  ${locale === loc
                    ? theme === "light"
                      ? "bg-black/10 text-black"
                      : "bg-white/20 text-white"
                    : theme === "light"
                      ? "text-black/70 hover:bg-black/5 hover:text-black"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <span>{localeNames[loc]}</span>
                {locale === loc && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </animated.div>
        ) : null
      )}
    </div>
  );
};

export default LanguageSwitcher;
