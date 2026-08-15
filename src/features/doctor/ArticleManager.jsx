import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Plus, ArrowLeft, Save, Trash2, Send, Image as ImageIcon,
  Bold, Italic, UnderlineIcon, List, ListOrdered, Quote, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
  FileText, RefreshCw, X, Highlighter,
} from "lucide-react";
import { articleApi } from "../../api/client";

const STATUS_COLORS = {
  published: { bg: "#d1fae5", text: "#065f46" },
  draft: { bg: "#fef3c7", text: "#92400e" },
  archived: { bg: "#f1f5f9", text: "#64748b" },
};

const STATUS_LABELS = { published: "منشور", draft: "مسودة", archived: "محذوف" };

function ToolbarButton({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      style={{
        width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "8px", border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "var(--dash-primary)" : "transparent",
        color: active ? "#fff" : "var(--dash-text)", transition: "all 0.15s",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }) {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("رابط الصورة:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = window.prompt("رابط:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "2px", padding: "10px 12px",
      borderBottom: "1px solid var(--dash-border)", background: "var(--dash-bg)",
      borderRadius: "16px 16px 0 0", position: "sticky", top: 0, zIndex: 10,
    }}>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="عنوان 1"><Heading1 size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="عنوان 2"><Heading2 size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="عنوان 3"><Heading3 size={15} /></ToolbarButton>

      <div style={{ width: 1, background: "var(--dash-border)", margin: "4px 6px" }} />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="عريض"><Bold size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="مائل"><Italic size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="تسطير"><UnderlineIcon size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="تظليل"><Highlighter size={15} /></ToolbarButton>

      <div style={{ width: 1, background: "var(--dash-border)", margin: "4px 6px" }} />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="قائمة نقطية"><List size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="قائمة مرقمة"><ListOrdered size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="اقتباس"><Quote size={15} /></ToolbarButton>

      <div style={{ width: 1, background: "var(--dash-border)", margin: "4px 6px" }} />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="محاذاة يمين"><AlignRight size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="توسيط"><AlignCenter size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="محاذاة يسار"><AlignLeft size={15} /></ToolbarButton>

      <div style={{ width: 1, background: "var(--dash-border)", margin: "4px 6px" }} />

      <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="رابط"><LinkIcon size={15} /></ToolbarButton>
      <ToolbarButton onClick={addImage} title="إدراج صورة"><ImageIcon size={15} /></ToolbarButton>
    </div>
  );
}

function ArticleEditor({ article, onSave, onCancel }) {
  const [title, setTitle] = useState(article?.title || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [authorName, setAuthorName] = useState(article?.authorName || "د. كريم الليثي");
  const [readTime, setReadTime] = useState(article?.readTimeMinutes || "");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(article?.coverImageUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "ابدأ كتابة المقالة هنا..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
    ],
    content: article?.body || "",
    editorProps: {
      attributes: {
        dir: "rtl",
        style: "min-height: 400px; padding: 24px; outline: none; font-family: inherit; font-size: 16px; line-height: 1.8; color: var(--dash-text);",
      },
    },
  });

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async (status) => {
    if (!title.trim()) { setError("العنوان مطلوب"); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        title,
        body: editor?.getHTML() || "",
        excerpt,
        authorName,
        readTimeMinutes: readTime ? Number(readTime) : null,
        status,
      };

      let saved;
      if (article?.id) {
        saved = await articleApi.update(article.id, body);
      } else {
        saved = await articleApi.create(body);
      }

      // Upload cover if selected
      if (coverFile && saved?.id) {
        try {
          await articleApi.uploadCover(saved.id, coverFile);
        } catch (uploadErr) {
          console.warn("Cover upload failed:", uploadErr);
        }
      }

      onSave();
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap-editor { border: 1.5px solid var(--dash-border); border-radius: 0 0 16px 16px; background: #fff; }
        .tiptap-editor:focus-within { border-color: var(--dash-primary); }
        .tiptap-editor h1 { font-size: 28px; font-weight: 900; margin: 16px 0 8px; }
        .tiptap-editor h2 { font-size: 22px; font-weight: 800; margin: 14px 0 8px; }
        .tiptap-editor h3 { font-size: 18px; font-weight: 700; margin: 12px 0 6px; }
        .tiptap-editor p { margin: 8px 0; }
        .tiptap-editor blockquote { border-right: 4px solid var(--dash-primary); padding-right: 16px; color: var(--dash-text-muted); margin: 12px 0; }
        .tiptap-editor ul, .tiptap-editor ol { padding-right: 24px; }
        .tiptap-editor img { max-width: 100%; border-radius: 12px; margin: 12px 0; }
        .tiptap-editor a { color: var(--dash-primary); text-decoration: underline; }
        .tiptap-editor mark { background: #fef08a; padding: 0 2px; border-radius: 3px; }
        .tiptap-editor .is-editor-empty::before { content: attr(data-placeholder); color: var(--dash-text-soft); pointer-events: none; float: right; }
      `}} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--dash-text-muted)", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontFamily: "inherit" }}>
          <ArrowLeft size={16} /> العودة
        </button>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => handleSave("draft")} disabled={saving} style={{ background: "var(--dash-bg)", border: "1.5px solid var(--dash-border)", padding: "10px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit" }}>
            {saving ? <RefreshCw size={16} /> : <Save size={16} />} حفظ مسودة
          </button>
          <button onClick={() => handleSave("published")} disabled={saving} style={{ background: "var(--dash-primary)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit" }}>
            <Send size={16} /> نشر المقالة
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: "700" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
        {/* Main editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="text"
            placeholder="عنوان المقالة..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ border: "1.5px solid var(--dash-border)", borderRadius: "12px", padding: "14px 18px", fontSize: "22px", fontWeight: "900", outline: "none", fontFamily: "inherit", color: "var(--dash-text)" }}
          />
          <div className="tiptap-editor">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
            {editor && (
              <div style={{ padding: "8px 16px", borderTop: "1px solid var(--dash-border)", fontSize: "12px", color: "var(--dash-text-soft)", fontWeight: "600" }}>
                {editor.storage.characterCount.characters()} حرف · {editor.storage.characterCount.words()} كلمة
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Cover Image */}
          <div style={{ background: "#fff", border: "1.5px solid var(--dash-border)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: "800", marginBottom: "12px", color: "var(--dash-text)" }}>صورة الغلاف</div>
            {coverPreview ? (
              <div style={{ position: "relative" }}>
                <img src={coverPreview} alt="cover" style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "12px" }} />
                <button onClick={() => { setCoverFile(null); setCoverPreview(null); }} style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "140px", border: "2px dashed var(--dash-border)", borderRadius: "12px", cursor: "pointer", color: "var(--dash-text-soft)", gap: "8px", fontSize: "13px", fontWeight: "700" }}>
                <ImageIcon size={28} />
                <span>اضغط لرفع صورة</span>
                <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
              </label>
            )}
          </div>

          {/* Meta */}
          <div style={{ background: "#fff", border: "1.5px solid var(--dash-border)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--dash-text)" }}>معلومات المقالة</div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-text-muted)", display: "block", marginBottom: "6px" }}>اسم الكاتب</label>
              <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} style={{ width: "100%", border: "1px solid var(--dash-border)", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-text-muted)", display: "block", marginBottom: "6px" }}>وقت القراءة (دقائق)</label>
              <input type="number" value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="5" min="1" max="60" style={{ width: "100%", border: "1px solid var(--dash-border)", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-text-muted)", display: "block", marginBottom: "6px" }}>ملخص المقالة</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} placeholder="ملخص قصير يظهر في قائمة المقالات..." style={{ width: "100%", border: "1px solid var(--dash-border)", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArticleManager() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | article object
  const [filterStatus, setFilterStatus] = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = filterStatus ? `?status=${filterStatus}` : "";
      const data = await articleApi.doctorList(query);
      setArticles(data.articles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذه المقالة؟")) return;
    setDeleting(id);
    try {
      await articleApi.delete(id);
      await load();
    } finally {
      setDeleting(null);
    }
  };

  if (editing !== null) {
    return (
      <ArticleEditor
        article={editing === "new" ? null : editing}
        onSave={() => { setEditing(null); load(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow"><FileText /> إدارة المقالات</span>
        <h2>النصائح الطبية والغذائية</h2>
        <p>أنشئ وانشر مقالاتك الطبية والغذائية لمتابعيك</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {["", "published", "draft", "archived"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "8px 16px", borderRadius: "10px", border: "1.5px solid", borderColor: filterStatus === s ? "var(--dash-primary)" : "var(--dash-border)", background: filterStatus === s ? "var(--dash-primary-soft)" : "#fff", color: filterStatus === s ? "var(--dash-primary)" : "var(--dash-text-muted)", fontSize: "13px", fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
              {s === "" ? "الكل" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <button onClick={() => setEditing("new")} style={{ background: "var(--dash-primary)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "inherit" }}>
          <Plus size={18} /> مقالة جديدة
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--dash-text-soft)" }}><RefreshCw size={32} style={{ animation: "spin 1s linear infinite" }} /></div>
      ) : articles.length === 0 ? (
        <div className="dash-empty"><FileText /><p>لا توجد مقالات بعد. ابدأ بإنشاء مقالتك الأولى!</p></div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {articles.map(art => (
            <div key={art.id} style={{ background: "#fff", border: "1.5px solid var(--dash-border)", borderRadius: "20px", padding: "20px 24px", display: "flex", gap: "20px", alignItems: "center" }}>
              {art.coverImageUrl && (
                <img src={art.coverImageUrl} alt={art.title} style={{ width: 80, height: 64, objectFit: "cover", borderRadius: "12px", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "var(--dash-text)", marginBottom: "4px" }}>{art.title}</div>
                <div style={{ fontSize: "13px", color: "var(--dash-text-muted)", fontWeight: "600" }}>
                  {art.authorName} · {art.readTimeMinutes ? `${art.readTimeMinutes} دقائق` : ""} · {new Date(art.publishedAt).toLocaleDateString("ar-EG")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", ...STATUS_COLORS[art.status] }}>
                  {STATUS_LABELS[art.status]}
                </span>
                <button onClick={() => setEditing(art)} style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-border)", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
                  تعديل
                </button>
                <button onClick={() => handleDelete(art.id)} disabled={deleting === art.id} style={{ background: "#fee2e2", border: "none", color: "#991b1b", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
                  {deleting === art.id ? <RefreshCw size={14} /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
