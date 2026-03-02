const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

async function ensureCommentsFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(COMMENTS_FILE);
  } catch {
    await fs.writeFile(COMMENTS_FILE, '[]', 'utf8');
  }
}

async function readComments() {
  await ensureCommentsFile();
  const text = await fs.readFile(COMMENTS_FILE, 'utf8');
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

async function writeComments(comments) {
  await ensureCommentsFile();
  await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
}

function toJaDate(iso) {
  return new Date(iso).toLocaleString('ja-JP');
}

app.get('/api/comments', async (req, res) => {
  try {
    const comments = await readComments();
    const normalized = comments
      .filter((comment) => comment && comment.name && comment.body)
      .map((comment) => ({
        name: String(comment.name),
        body: String(comment.body),
        createdAt: comment.createdAt || new Date().toISOString(),
      }));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'コメントの取得に失敗しました。' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    const body = (req.body?.body || '').trim();

    if (!name || !body) {
      return res.status(400).json({ message: '名前と感想は必須です。' });
    }
    if (name.length > 50 || body.length > 1000) {
      return res.status(400).json({ message: '入力文字数が上限を超えています。' });
    }

    const comments = await readComments();
    const newComment = {
      name,
      body,
      createdAt: new Date().toISOString(),
      date: toJaDate(new Date().toISOString()),
    };

    comments.push(newComment);
    await writeComments(comments);

    return res.status(201).json(newComment);
  } catch (error) {
    return res.status(500).json({ message: 'コメントの保存に失敗しました。' });
  }
});

app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
