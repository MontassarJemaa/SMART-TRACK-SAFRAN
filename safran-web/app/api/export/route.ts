'use server';

import { NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const csv = 'code,designation,site,statut_outil\n';
  return NextResponse.json({ success: true, csv });
}
