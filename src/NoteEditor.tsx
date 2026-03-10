import React, { useEffect, useRef, useState } from "react";
import "./noteEditor.css";

type Props = {
  onFinish?: () => void;
  thoughts?: string;
  onSave?: (text: string) => void;
};

export default function NoteEditor({ onFinish, thoughts = "", onSave }: Props) {

  const pageRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const composingRef = useRef(false);
  const didInitFocusRef = useRef(false);

  const [text, setText] = useState<string>(thoughts);

  const [isInList, setIsInList] = useState(false);

  const historyRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);

  const [, setHistoryState] = useState(0);

  useEffect(() => {

    document.body.classList.add("note-editor-open");
    document.documentElement.classList.add("note-editor-open");

    // iOS Safari 在 textarea 换行时会滚动 window（visual viewport 上移），
    // 导致 position:fixed 元素相对屏幕跳动。立即重置 scroll 位置来抵消。
    const resetWindowScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    window.addEventListener("scroll", resetWindowScroll, { passive: true });

    return () => {
      document.body.classList.remove("note-editor-open");
      document.documentElement.classList.remove("note-editor-open");
      window.removeEventListener("scroll", resetWindowScroll);
    };

  }, []);

  /* 进入编辑页后聚焦并把光标放到末尾（iOS 需多次尝试以提高成功率） */

  useEffect(() => {

    const el = textareaRef.current;
    if (!el) return;

    const focusToEnd = () => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }

      if (didInitFocusRef.current) return;

      const end = el.value.length;
      el.setSelectionRange(end, end);
      didInitFocusRef.current = true;
    };

    requestAnimationFrame(() => {
      focusToEnd();
    });

    const timer1 = window.setTimeout(() => {
      if (document.activeElement !== el) {
        focusToEnd();
      }
    }, 120);

    return () => {
      clearTimeout(timer1);
    };

  }, []);

  /* 让输入法高度与页面留白同步，避免底部文字被遮挡 */

  useEffect(() => {

    const pageEl = pageRef.current;
    const viewport = window.visualViewport;

    if (!pageEl) return;

    const syncKeyboardInset = () => {
      if (!pageEl) return;

      if (!viewport) {
        pageEl.style.setProperty("--keyboard-inset", "0px");
        return;
      }

      const keyboardInset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );

      pageEl.style.setProperty(
        "--keyboard-inset",
        `${Math.round(keyboardInset)}px`
      );
    };

    syncKeyboardInset();

    viewport?.addEventListener("resize", syncKeyboardInset);
    window.addEventListener("orientationchange", syncKeyboardInset);

    return () => {
      viewport?.removeEventListener("resize", syncKeyboardInset);
      window.removeEventListener("orientationchange", syncKeyboardInset);
      pageEl.style.removeProperty("--keyboard-inset");
    };

  }, []);

  /* 自动保存 */

  useEffect(() => {

    const timer = setTimeout(() => {

      onSave?.(text);

    }, 10000); // 20秒自动保存

    return () => clearTimeout(timer);

  }, [text, onSave]);

  /* 历史 */

  const pushHistory = (value: string) => {

    historyRef.current.push(value);

    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    }

    redoRef.current = [];

    setHistoryState(v => v + 1);
  };

  const updateListState = (el: HTMLTextAreaElement) => {
    const pos = el.selectionStart;
    const val = el.value;
    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const lineEndIdx = val.indexOf("\n", pos);
    const currentLine = val.slice(lineStart, lineEndIdx === -1 ? val.length : lineEndIdx);
    setIsInList(/^[•●] /.test(currentLine));
  };

  /* 输入 */

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {

    const nextValue = e.target.value;

    if (!composingRef.current && nextValue !== text) {
      pushHistory(text);
    }

    // 始终写回受控值，避免 iOS 组合输入阶段出现“可弹键盘但无法输入”。
    setText(nextValue);
    updateListState(e.target);
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = () => {
    composingRef.current = false;
    const el = textareaRef.current;
    if (el) updateListState(el);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing || composingRef.current) return;
    const el = textareaRef.current;
    if (!el) return;

    const pos = el.selectionStart;
    const val = el.value;
    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const lineEndIdx = val.indexOf("\n", pos);
    const currentLine = val.slice(lineStart, lineEndIdx === -1 ? val.length : lineEndIdx);

    if (!/^[•●] /.test(currentLine)) return;

    e.preventDefault();

    // 空白列表行按回车 → 退出列表
    if (/^[•●] $/.test(currentLine)) {
      const newText = val.slice(0, lineStart) + val.slice(lineStart + 2);
      pushHistory(text);
      setText(newText);
      setIsInList(false);
      requestAnimationFrame(() => {
        el.setSelectionRange(lineStart, lineStart);
      });
      return;
    }

    // 继续下一行列表项
    const insertion = "\n• ";
    const newText = val.slice(0, pos) + insertion + val.slice(el.selectionEnd);
    pushHistory(text);
    setText(newText);
    setIsInList(true);
    requestAnimationFrame(() => {
      const newPos = pos + insertion.length;
      el.setSelectionRange(newPos, newPos);
    });
  };

  /* 无序列表 */

  const toggleUnorderedList = () => {

    const el = textareaRef.current;
    if (!el) return;

    const value = text;
    const selStart = el.selectionStart;
    const selEnd = el.selectionEnd;

    const lineStart = value.lastIndexOf("\n", Math.max(selStart - 1, 0)) + 1;
    const lineEndIndex = value.indexOf("\n", selEnd);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

    const selectedBlock = value.slice(lineStart, lineEnd);
    const lines = selectedBlock.split("\n");
    const bulletRegex = /^[•●] /;
    const nonEmptyLines = lines.filter(line => line.trim() !== "");
    const allBulleted = nonEmptyLines.length > 0 && nonEmptyLines.every(line => bulletRegex.test(line));

    const transformedLines = allBulleted
      ? lines.map(line => line.replace(bulletRegex, ""))
      : lines.map(line => {
          if (bulletRegex.test(line)) return line;
          return `• ${line}`;
        });

    const transformedBlock = transformedLines.join("\n");
    const nextText = `${value.slice(0, lineStart)}${transformedBlock}${value.slice(lineEnd)}`;

    pushHistory(text);
    setText(nextText);

    requestAnimationFrame(() => {
      const nextEl = textareaRef.current;
      if (!nextEl) return;

      nextEl.focus({ preventScroll: true });
      const adjustment = allBulleted ? -2 : 2;
      const newPos = Math.max(lineStart, Math.min(selStart + adjustment, nextText.length));
      nextEl.setSelectionRange(newPos, newPos);
      updateListState(nextEl);
    });
  };

  /* 撤销 */

  const undo = () => {

    if (historyRef.current.length === 0) return;

    const prev = historyRef.current.pop()!;

    redoRef.current.push(text);

    setText(prev);

    setHistoryState(v => v + 1);
    
    // 保持输入法弹出
    textareaRef.current?.focus();
  };

  /* 重做 */

  const redo = () => {

    if (redoRef.current.length === 0) return;

    const next = redoRef.current.pop()!;

    historyRef.current.push(text);

    setText(next);

    setHistoryState(v => v + 1);
    
    // 保持输入法弹出
    textareaRef.current?.focus();
  };

  /* 完成 */

  const finish = () => {

    onSave?.(text);

    const page = document.querySelector(
      ".note-editor-page"
    ) as HTMLElement;

    if (page) {
      page.style.transform = "translateY(68%) scale(0.78)";
      page.style.opacity = "0";
      page.style.borderRadius = "24px";
      page.style.transition = "all 0.38s cubic-bezier(0.32, 0.72, 0, 1)";
    }

    setTimeout(() => {
      onFinish?.();
    }, 450);
  };

  return (

    <div ref={pageRef} className="note-editor-page">

      <div className="editor-banner">

        <button
          className="icon-btn"
          disabled={historyRef.current.length === 0}
          onMouseDown={e => e.preventDefault()}
          onClick={undo}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 14 4 9l5-5"/>
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
          </svg>
        </button>

        <button
          className="icon-btn"
          disabled={redoRef.current.length === 0}
          onMouseDown={e => e.preventDefault()}
          onClick={redo}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 14l5-5-5-5"/>
            <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>
          </svg>
        </button>

        <button
          className={`icon-btn list-btn${isInList ? " active" : ""}`}
          title="无序列表"
          onMouseDown={e => e.preventDefault()}
          onClick={toggleUnorderedList}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="4" cy="7" r="1.5" fill="currentColor" stroke="none"/>
            <line x1="9" y1="7" x2="22" y2="7"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <line x1="9" y1="12" x2="22" y2="12"/>
            <circle cx="4" cy="17" r="1.5" fill="currentColor" stroke="none"/>
            <line x1="9" y1="17" x2="22" y2="17"/>
          </svg>
        </button>

        <button
          className="done-btn"
          onMouseDown={e => e.preventDefault()}
          onClick={finish}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>

      </div>

      <div ref={scrollAreaRef} className="editor-scroll-area">
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={() => { const el = textareaRef.current; if (el) updateListState(el); }}
          onClick={() => { const el = textareaRef.current; if (el) updateListState(el); }}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="写下此刻的想法…"
        />
      </div>

    </div>
  );
}