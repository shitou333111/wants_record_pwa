import React, { useEffect, useRef, useState } from "react";
import "./noteEditor.css";

type Props = {
  onFinish?: () => void;
  thoughts?: string;
  onSave?: (text: string) => void;
};

export default function NoteEditor({ onFinish, thoughts = "", onSave }: Props) {

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [text, setText] = useState<string>(thoughts);

  const [saved, setSaved] = useState(true); // 初始状态为已保存

  const historyRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);

  const [, setHistoryState] = useState(0);

  /* 自动高度 */

  const autoResize = () => {

    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(autoResize, [text]);

  /* iOS键盘稳定 */

  useEffect(() => {

    const el = textareaRef.current;

    const fixKeyboard = () => {
      // 保持banner固定，不使用scrollIntoView，避免banner被顶起
      // 只确保textarea可见
      setTimeout(() => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 0) {
            el.scrollTop = Math.abs(rect.top) + 20;
          }
        }
      }, 100);
    };

    el?.addEventListener("focus", fixKeyboard);

    return () => {
      el?.removeEventListener("focus", fixKeyboard);
    };

  }, []);

  /* 自动保存 */

  useEffect(() => {

    const timer = setTimeout(() => {

      onSave?.(text);

      setSaved(true);

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

  /* 输入 */

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {

    pushHistory(text);

    setText(e.target.value);
    setSaved(false); // 编辑时设置为未保存状态
  };

  /* 撤销 */

  const undo = () => {

    if (historyRef.current.length === 0) return;

    const prev = historyRef.current.pop()!;

    redoRef.current.push(text);

    setText(prev);
    setSaved(false); // 撤销时设置为未保存状态

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
    setSaved(false); // 重做时设置为未保存状态

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

      page.style.transform = 
        "translateY(100%) scale(0.9)";

      page.style.opacity = "0";

      page.style.transition = 
        "all .45s cubic-bezier(.2,.8,.2,1)";
    }

    setTimeout(() => {
      onFinish?.();
    }, 450);
  };

  return (

    <div className="note-editor-page">

      <div className="editor-banner">

        <div className="save-indicator">
          {saved ? "已保存" : ""}
        </div>

        <button
          className="icon-btn"
          disabled={historyRef.current.length === 0}
          onMouseDown={e => e.preventDefault()}
          onClick={undo}
        >
          ↺
        </button>

        <button
          className="icon-btn"
          disabled={redoRef.current.length === 0}
          onMouseDown={e => e.preventDefault()}
          onClick={redo}
        >
          ↻
        </button>

        <button
          className="done-btn"
          onMouseDown={e => e.preventDefault()}
          onClick={finish}
        >
          完成
        </button>

      </div>

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={text}
        onChange={handleChange}
        placeholder="写下此刻的想法…"
      />

    </div>
  );
}