import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatRelativeScan(dateIso: string | null | undefined): string {
  if (!dateIso) {
    return '—';
  }

  try {
    return `il y a ${formatDistanceToNow(new Date(dateIso), { locale: fr })}`;
  } catch {
    return '—';
  }
}

export function formatDateTime(dateIso: string | null | undefined): string {
  if (!dateIso) {
    return '—';
  }

  try {
    return new Date(dateIso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}
