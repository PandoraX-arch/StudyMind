// =============================================
//  StudyMind — app.js
//  Configuração da API: altere a linha abaixo
// =============================================

const OPENROUTER_API_KEY = "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"; // 👈 Substitua pela sua chave OpenRouter
const MODEL = "z-ai/glm-4.5-air:free";                // Modelo GLM-4.5 Air (gratuito)

// =============================================
//  MODOS DE ESTUDO
// =============================================
const MODES = [
  {
    id: "geral",
    icon: "✨",
    label: "Tutor Geral",
    badge: null,
    systemPrompt: `Você é o StudyMind, um tutor educacional amigável e inteligente que ajuda estudantes brasileiros.
Seu objetivo é explicar conceitos de forma clara, didática e envolvente.
Adapte a linguagem ao nível do aluno e use exemplos do cotidiano brasileiro.
Incentive o raciocínio crítico em vez de apenas dar respostas prontas.
Responda sempre em português brasileiro.`,
  },
  {
    id: "matematica",
    icon: "🔢",
    label: "Matemática",
    badge: null,
    systemPrompt: `Você é um professor de Matemática especialista e paciente.
Explique passo a passo, mostre os cálculos claramente usando formatação.
Use exemplos concretos e relacione com situações do dia a dia.
Incentive o aluno a tentar resolver antes de dar a resposta completa.
Cubra: aritmética, álgebra, geometria, trigonometria, cálculo, estatística.
Responda em português brasileiro.`,
  },
  {
    id: "ciencias",
    icon: "🔬",
    label: "Ciências",
    badge: null,
    systemPrompt: `Você é um professor de Ciências Naturais apaixonado (Física, Química, Biologia).
Explique fenômenos científicos de forma clara e instigante.
Use analogias simples para conceitos complexos.
Conecte teoria com experimentos e aplicações práticas.
Mencione cientistas e descobertas relevantes quando pertinente.
Responda em português brasileiro.`,
  },
  {
    id: "historia",
    icon: "🌍",
    label: "História & Geo",
    badge: null,
    systemPrompt: `Você é um professor de História e Geografia dinâmico.
Conte os eventos históricos como narrativas envolventes, não apenas fatos secos.
Relacione o passado com o presente e com a realidade brasileira.
Aborde perspectivas diversas e pensamento crítico.
Inclua geografia física, humana e geopolítica.
Responda em português brasileiro.`,
  },
  {
    id: "literatura",
    icon: "📖",
    label: "Português & Literatura",
    badge: null,
    systemPrompt: `Você é um professor de Língua Portuguesa e Literatura especializado.
Ajude com gramática, redação, interpretação de texto e análise literária.
Explique regras gramaticais com exemplos práticos e contextualizados.
Para literatura, analise obras, autores, estilos e movimentos literários.
Auxiliei com redação dissertativa para o ENEM e vestibulares.
Responda em português brasileiro.`,
  },
  {
    id: "ingles",
    icon: "🇬🇧",
    label: "Inglês",
    badge: null,
    systemPrompt: `You are an English teacher helping Brazilian students learn English.
You can communicate in both Portuguese and English.
Explain grammar rules, vocabulary, pronunciation tips and cultural context.
For beginner students, use more Portuguese. For advanced ones, use more English.
Make learning fun and practical with real-world examples.
Help with reading, writing, speaking and listening comprehension.`,
  },
  {
    id: "enem",
    icon: "📝",
    label: "ENEM & Vestibular",
    badge: "HOT",
    systemPrompt: `Você é um especialista em preparação para o ENEM e vestibulares brasileiros.
Conheça profundamente o formato, competências e habilidades cobradas no ENEM.
Ajude com todas as matérias: Linguagens, Matemática, Ciências da Natureza e Humanas.
Dê dicas de redação nota 1000, estratégias de prova e gestão de tempo.
Explique questões passadas e ofereça questões de prática.
Motive o aluno e transmita confiança.
Responda em português brasileiro.`,
  },
  {
    id: "codigo",
    icon: "💻",
    label: "Programação",
    badge: null,
    systemPrompt: `Você é um mentor de programação e ciência da computação para estudantes.
Explique conceitos de lógica, algoritmos e linguagens de programação.
Use exemplos de código claros e comentados.
Aborde: Python, JavaScript, lógica de programação, estruturas de dados.
Incentive boas práticas e pensamento computacional.
Adeque a explicação ao nível do estudante (iniciante a avançado).
Responda em português brasileiro, com código em inglês (convenção padrão).`,
  },
];

// =============================================
//  SUGESTÕES DE BOAS-VINDAS
// =============================================
const SUGGESTIONS = [
  { icon: "📐", text: "Como resolver equações de 2º grau?" },
  { icon: "🧬", text: "Explique a divisão celular para mim" },
  { icon: "📜", text: "Resumo da Revolução Francesa" },
  { icon: "✍️", text: "Dicas para uma redação nota 1000" },
];

// =============================================
//  UTILITÁRIOS
// =============================================
const { useState, useRef, useEffect, useCallback } = React;

function getTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderMarkdown(text) {
  if (typeof marked !== "undefined") {
    return { __html: marked.parse(text) };
  }
  return { __html: text };
}

// =============================================
//  COMPONENTES
// =============================================

// ---------- Thinking Animation ----------
function ThinkingBubble() {
  return (
    <div className="message-group">
      <div className="avatar ai">🎓</div>
      <div className="message-content">
        <div className="thinking-bubble">
          <span className="thinking-label">Pensando</span>
          <div className="dots">
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Message ----------
function Message({ msg }) {
  const isAI = msg.role === "assistant";
  return (
    <div className={`message-group ${isAI ? "ai" : "user"}`}>
      {isAI && <div className="avatar ai">🎓</div>}
      <div className="message-content">
        {msg.imagePreview && (
          <img src={msg.imagePreview} alt="enviado" className="bubble-img" />
        )}
        <div className={`bubble ${isAI ? "ai" : "user"}`}>
          {isAI ? (
            <span>
              <span dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
              {msg.streaming && <span className="typing-cursor" />}
            </span>
          ) : (
            <span>{msg.content}</span>
          )}
        </div>
        <div className="message-time">{msg.time}</div>
      </div>
      {!isAI && <div className="avatar user">👤</div>}
    </div>
  );
}

// ---------- Toast ----------
function Toast({ toast }) {
  return (
    <div className={`toast ${toast.visible ? "show" : ""} ${toast.type || ""}`}>
      {toast.message}
    </div>
  );
}

// =============================================
//  APP PRINCIPAL
// =============================================
function App() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [activeMode, setActiveMode]   = useState(MODES[0]);
  const [isLoading, setIsLoading]     = useState(false);
  const [isStreaming, setIsStreaming]  = useState(false);
  const [apiKey, setApiKey]           = useState(OPENROUTER_API_KEY);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64]   = useState(null);
  const [toast, setToast]             = useState({ visible: false, message: "", type: "" });

  const chatEndRef   = useRef(null);
  const textareaRef  = useRef(null);
  const fileInputRef = useRef(null);
  const abortRef     = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  // ---------- Toast helper ----------
  function showToast(message, type = "") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  // ---------- Image upload ----------
  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Apenas imagens são suportadas.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Imagem muito grande (máx. 5 MB).", "error");
      return;
    }
    const preview = URL.createObjectURL(file);
    const b64 = await fileToBase64(file);
    setImageFile(file);
    setImagePreview(preview);
    setImageBase64(b64);
    showToast("Imagem anexada! ✓", "success");
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ---------- Send message ----------
  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText && !imageBase64) return;
    if (isLoading || isStreaming) return;

    const key = apiKey.trim();
    if (!key || key === "COLOQUE_SUA_CHAVE_AQUI") {
      showToast("⚠️ Configure sua chave OpenRouter na barra lateral.", "error");
      return;
    }

    // Build user message for display
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: userText || "(imagem enviada)",
      imagePreview: imagePreview,
      time: getTime(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    const capturedBase64  = imageBase64;
    const capturedPreview = imagePreview;
    removeImage();
    setIsLoading(true);

    // Build API messages history
    const history = messages.map(m => {
      if (m.role === "user" && m._imageBase64) {
        return {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${m._imageBase64}` } },
            { type: "text", text: m.content },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    // New user turn (GLM-4.5 não suporta visão, envia só texto)
    let newUserContent;
    if (capturedBase64) {
      newUserContent = `${userText || "Descreva esta imagem."}\n\n[Nota: imagem anexada, mas este modelo não suporta visão]`;
    } else {
      newUserContent = userText;
    }
    history.push({ role: "user", content: newUserContent });

    // Placeholder AI message (will fill with stream)
    const aiMsgId = Date.now() + 1;
    setMessages(prev => [
      ...prev,
      { id: aiMsgId, role: "assistant", content: "", time: getTime(), streaming: true },
    ]);
    setIsLoading(false);
    setIsStreaming(true);

    // Abort controller
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://studymind.app",
          "X-OpenRouter-Title": "StudyMind",
        },
        body: JSON.stringify({
          model: MODEL,
          stream: true,
          messages: [
            { role: "system", content: activeMode.systemPrompt },
            ...history,
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Erro HTTP ${res.status}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              accumulated += delta;
              const snap = accumulated;
              setMessages(prev =>
                prev.map(m => m.id === aiMsgId ? { ...m, content: snap } : m)
              );
            }
          } catch (_) {}
        }
      }

      // Finalize
      setMessages(prev =>
        prev.map(m => m.id === aiMsgId ? { ...m, streaming: false } : m)
      );

    } catch (err) {
      if (err.name === "AbortError") {
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId
            ? { ...m, content: m.content + "\n\n*(resposta interrompida)*", streaming: false }
            : m
          )
        );
      } else {
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId
            ? { ...m, content: `❌ Erro: ${err.message}`, streaming: false }
            : m
          )
        );
        showToast(`Erro: ${err.message}`, "error");
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  function clearChat() {
    setMessages([]);
  }

  const apiKeyOk = apiKey.trim().length > 10 && apiKey !== "COLOQUE_SUA_CHAVE_AQUI";

  // =============================================
  //  RENDER
  // =============================================
  return (
    <div className="app-shell">

      {/* ---- SIDEBAR ---- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🎓</div>
            <span className="logo-text">StudyMind</span>
          </div>
          <div className="logo-tagline">Seu tutor inteligente</div>
        </div>

        <button className="new-chat-btn" onClick={clearChat}>
          <span>✦</span> Novo Chat
        </button>

        <div className="sidebar-section-label">Modos de Estudo</div>
        <nav className="mode-list">
          {MODES.map(mode => (
            <button
              key={mode.id}
              className={`mode-btn ${activeMode.id === mode.id ? "active" : ""}`}
              onClick={() => { setActiveMode(mode); if (!isStreaming) clearChat(); }}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-label">{mode.label}</span>
              {mode.badge && <span className="mode-badge">{mode.badge}</span>}
            </button>
          ))}
        </nav>

        {/* API Key */}
        <div className="api-section">
          <div className="api-label">🔑 Chave OpenRouter</div>
          <div className="api-key-wrapper">
            <input
              type="password"
              className="api-key-input"
              placeholder="sk-or-v1-..."
              value={apiKey === "COLOQUE_SUA_CHAVE_AQUI" ? "" : apiKey}
              onChange={e => setApiKey(e.target.value || "COLOQUE_SUA_CHAVE_AQUI")}
            />
            <div className={`api-status ${apiKeyOk ? "ok" : "bad"}`} />
          </div>
          <div className="api-hint">
            Obtenha sua chave gratuita em{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
               style={{ color: "var(--amber)", textDecoration: "none" }}>
              openrouter.ai/keys
            </a>
          </div>
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <main className="main-area">

        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-mode">
            <span className="topbar-mode-icon">{activeMode.icon}</span>
            <span className="topbar-mode-name">{activeMode.label}</span>
          </div>
          <div className="topbar-divider" />
          <div className="topbar-status">
            <div className="status-dot" />
            {isStreaming ? "Respondendo..." : "Pronto"}
          </div>
          <div className="topbar-right">
            {imagePreview && (
              <div className="img-preview-badge">
                <img src={imagePreview} alt="" className="img-preview-thumb" />
                <span>Imagem anexada</span>
                <button className="remove-img-btn" onClick={removeImage}>✕</button>
              </div>
            )}
            {isStreaming && (
              <button
                onClick={stopGeneration}
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  padding: "5px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                ⏹ Parar
              </button>
            )}
          </div>
        </header>

        {/* Chat */}
        <div className="chat-area">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-orb">🎓</div>
              <h1 className="welcome-title">Olá! Sou o StudyMind</h1>
              <p className="welcome-sub">
                Estou aqui para te ajudar com qualquer matéria escolar.
                Escolha um modo na barra lateral ou me faça uma pergunta!
              </p>
              <div className="suggestion-grid">
                {SUGGESTIONS.map((s, i) => (
                  <div
                    key={i}
                    className="suggestion-card"
                    onClick={() => sendMessage(s.text)}
                  >
                    <div className="suggestion-card-icon">{s.icon}</div>
                    <div className="suggestion-card-text">{s.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <Message key={msg.id} msg={msg} />
              ))}
              {isLoading && <ThinkingBubble />}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          {/* Image preview */}
          {imagePreview && (
            <div className="image-preview-row">
              <div className="img-preview-item">
                <img src={imagePreview} alt="preview" />
                <button className="img-preview-remove" onClick={removeImage}>✕</button>
              </div>
            </div>
          )}

          <div className="input-box">
            <textarea
              ref={textareaRef}
              className="input-textarea"
              placeholder={`Pergunte ao ${activeMode.label}... (Shift+Enter para nova linha)`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading || isStreaming}
            />
            <div className="input-actions">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
              {/* Upload image button */}
              <button
                className={`icon-btn ${imageBase64 ? "has-image" : ""}`}
                title="Anexar imagem"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isStreaming}
              >
                📎
              </button>
              {/* Send button */}
              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={isLoading || isStreaming || (!input.trim() && !imageBase64)}
                title="Enviar (Enter)"
              >
                ➤
              </button>
            </div>
          </div>

          <div className="input-footer">
            <span className="input-hint">
              {activeMode.icon} Modo: <strong style={{ color: "var(--text-secondary)" }}>{activeMode.label}</strong>
            </span>
            <span className="char-counter">{input.length}</span>
          </div>
        </div>
      </main>

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}

// =============================================
//  MOUNT
// =============================================
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
