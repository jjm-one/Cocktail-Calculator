import { useParams } from 'react-router-dom';
import { SUPPORTED_LANGS, TEXT } from './translations';
import type { Lang } from '../lib/types';

export function useLang(): Lang {
  const { lang } = useParams<{ lang: string }>();
  return SUPPORTED_LANGS.includes(lang as Lang) ? (lang as Lang) : 'de';
}

export function useT() {
  const lang = useLang();
  return { lang, t: TEXT[lang] };
}
