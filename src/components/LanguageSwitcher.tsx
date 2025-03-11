'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Language } from '@/i18n/LanguageContext';

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code as Language)}
              className={language === lang.code ? 'bg-accent' : ''}
            >
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}