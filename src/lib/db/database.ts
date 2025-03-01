import Dexie, { Table } from 'dexie';

export interface Note {
  id?: number;
  title: string;
  transcript: string;
  audioBlob?: Blob;
  created: Date;
  updated: Date;
  tags: string[];
}

export interface TranscriptWord {
  id?: number;
  noteId: number;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

class VoiceNotesDB extends Dexie {
  notes!: Table<Note>;
  transcriptWords!: Table<TranscriptWord>;

  constructor() {
    super('VoiceNotesDB');
    
    this.version(1).stores({
      notes: '++id, title, created, updated, *tags',
      transcriptWords: '++id, noteId, startTime'  // Added startTime as indexed field
    });
  }

  async getAllNoteWords(noteId: number): Promise<TranscriptWord[]> {
    return await this.transcriptWords
      .where('noteId')
      .equals(noteId)
      .toArray();
  }
}

const db = new VoiceNotesDB();

export async function addNote(note: Omit<Note, 'id'>): Promise<number> {
  return await db.notes.add(note);
}

export async function updateNote(id: number, note: Partial<Note>): Promise<number> {
  return await db.notes.update(id, { ...note, updated: new Date() });
}

export async function deleteNote(id: number): Promise<void> {
  await db.transaction('rw', db.notes, db.transcriptWords, async () => {
    await db.transcriptWords.where('noteId').equals(id).delete();
    await db.notes.delete(id);
  });
}

export async function getNotes(): Promise<Note[]> {
  return await db.notes.orderBy('created').reverse().toArray();
}

export async function getNote(id: number): Promise<Note | undefined> {
  return await db.notes.get(id);
}

export async function addTranscriptWords(words: Omit<TranscriptWord, 'id'>[]): Promise<number[]> {
  return await db.transcriptWords.bulkAdd(words);
}

export async function getTranscriptWords(noteId: number): Promise<TranscriptWord[]> {
  const words = await db.getAllNoteWords(noteId);
  return words.sort((a, b) => a.startTime - b.startTime);
}

export async function exportNoteAsJson(noteId: number): Promise<string> {
  const note = await getNote(noteId);
  const words = await getTranscriptWords(noteId);
  return JSON.stringify({ note, words }, null, 2);
}

export async function exportNoteAsText(noteId: number): Promise<string> {
  const note = await getNote(noteId);
  return note?.transcript || '';
}

export async function exportNoteAsMarkdown(noteId: number): Promise<string> {
  const note = await getNote(noteId);
  if (!note) return '';

  return `# ${note.title}

${note.transcript}

---
Created: ${note.created.toISOString()}
Updated: ${note.updated.toISOString()}
Tags: ${note.tags.join(', ')}`;
}

export async function exportNoteAsHtml(noteId: number): Promise<string> {
  const note = await getNote(noteId);
  if (!note) return '';

  return `<!DOCTYPE html>
<html>
<head>
  <title>${note.title}</title>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .metadata { color: #666; font-size: 0.9rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="content">${note.transcript.split('\n').join('<br>')}</div>
  <div class="metadata">
    <p>Created: ${note.created.toISOString()}</p>
    <p>Updated: ${note.updated.toISOString()}</p>
    <p>Tags: ${note.tags.join(', ')}</p>
  </div>
</body>
</html>`;
}

export default db;