import { useEffect } from 'react';

export function useDocumentHead(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content') ?? '';
    if (description && meta) meta.setAttribute('content', description);
    return () => {
      document.title = prevTitle;
      if (meta && description) meta.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}
