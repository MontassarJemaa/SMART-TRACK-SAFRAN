'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OutillageCard } from '@/components/ui/OutillageCard';
import { DEMO_OUTILLAGES } from '@/lib/demo-data';

export default function RecherchePage() {
  const [query, setQuery] = useState('');

  const results = DEMO_OUTILLAGES.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.code.toLowerCase().includes(q) ||
      item.designation.toLowerCase().includes(q) ||
      item.projet.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-shell p-6 lg:p-8">
      <PageHeader title="Recherche" subtitle="Recherche rapide dans le référentiel — données démo" />

      <Card className="mb-6 !p-4">
        <Input
          placeholder="Code, désignation ou projet…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((item) => (
          <OutillageCard
            key={item.id}
            id={item.id}
            code={item.code}
            designation={item.designation}
            statut={item.statut}
            site={item.site}
            projet={item.projet}
          />
        ))}
      </div>
    </div>
  );
}
