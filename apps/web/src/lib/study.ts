const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.edurank.co.za";

export interface StudyItem {
  slug: string;
  title: string;
  grade: number;
  subjectId: string;
  subjectName: string;
  topic: string;
  description: string;
  updatedAt: string | null;
}
export interface StudyNote extends StudyItem {
  body: string;
}

export function prettifySubject(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function fetchStudyIndex(): Promise<StudyItem[]> {
  try {
    const res = await fetch(`${API}/study`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return ((await res.json()) as { items: StudyItem[] }).items ?? [];
  } catch {
    return [];
  }
}

export async function fetchStudyHub(grade: number, subject: string): Promise<StudyItem[]> {
  try {
    const res = await fetch(`${API}/study/${grade}/${subject}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return ((await res.json()) as { items: StudyItem[] }).items ?? [];
  } catch {
    return [];
  }
}

export async function fetchStudyNote(grade: number, subject: string, slug: string): Promise<StudyNote | null> {
  try {
    const res = await fetch(`${API}/study/${grade}/${subject}/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return ((await res.json()) as { note: StudyNote }).note ?? null;
  } catch {
    return null;
  }
}

export function studyFileUrl(grade: number, subject: string, slug: string): string {
  return `${API}/study/${grade}/${subject}/${slug}/file`;
}
