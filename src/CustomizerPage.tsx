import React, { useState, useRef } from 'react';
import {
  HomeStepConfig,
  DEFAULT_HOME_STEPS,
  DEFAULT_RELEASE_STEPS,
  DEFAULT_RELEASE_INTERVAL_SEC,
  FIXED_HOME_FINAL,
  STORAGE_KEY_HOME,
  STORAGE_KEY_REL_STEPS,
  STORAGE_KEY_REL_INTERVAL,
  loadHomeSteps,
  loadReleaseSteps,
  loadReleaseIntervalSec,
} from './releaseConfig';

interface Props {
  initialTab?: 0 | 1;
  onClose: () => void;
}

const CustomizerPage: React.FC<Props> = ({ initialTab = 0, onClose }) => {
  const [activeTab, setActiveTab] = useState<0 | 1>(initialTab);

  // 左滑返回手势（仅从屏幕左边缘 40px 内触发）
  const pageRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);

  const handleSwipeStart = (e: React.TouchEvent) => {
    if (e.touches[0].clientX > 40) return;
    swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
  };
  const handleSwipeMove = (e: React.TouchEvent) => {
    if (!swipeRef.current || !pageRef.current) return;
    const dx = e.touches[0].clientX - swipeRef.current.startX;
    const dy = Math.abs(e.touches[0].clientY - swipeRef.current.startY);
    if (dx <= 0 || dy > Math.abs(dx)) { swipeRef.current = null; return; }
    pageRef.current.style.transform = `translateX(${dx * 0.5}px)`;
    pageRef.current.style.opacity = `${Math.max(0.4, 1 - dx / 350)}`;
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (!swipeRef.current || !pageRef.current) return;
    const dx = e.changedTouches[0].clientX - swipeRef.current.startX;
    swipeRef.current = null;
    const el = pageRef.current;
    if (dx > 80) {
      el.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
      el.style.transform = 'translateX(100%)';
      el.style.opacity = '0';
      setTimeout(onClose, 220);
    } else {
      el.style.transition = 'transform 0.18s ease, opacity 0.18s ease';
      el.style.transform = '';
      el.style.opacity = '';
      setTimeout(() => { if (pageRef.current) pageRef.current.style.transition = ''; }, 180);
    }
  };
  const [homeSteps, setHomeSteps] = useState<HomeStepConfig[]>(() => loadHomeSteps());
  const [releaseSteps, setReleaseSteps] = useState<string[]>(() => loadReleaseSteps());
  const [releaseIntervalSec, setReleaseIntervalSec] = useState<number>(() => loadReleaseIntervalSec());

  const handleConfirm = () => {
    const cleanHome = homeSteps
      .map(s => ({
        guide: s.guide.slice(0, 30),
        noBtn: s.noBtn.slice(0, 4),
        yesBtn: s.yesBtn.slice(0, 4),
      }))
      .filter((s, i) => i === 0 || s.guide.trim() !== '');

    // 闪电页面为竖排文字，换行符无意义，替换为空格再修剪
    const cleanRelease = releaseSteps
      .map(s => s.trim().slice(0, 50))
      .filter((s, i) => i === 0 || s !== '');

    const interval = Math.max(1, Math.min(60, releaseIntervalSec || DEFAULT_RELEASE_INTERVAL_SEC));

    try {
      localStorage.setItem(STORAGE_KEY_HOME, JSON.stringify(cleanHome.length > 0 ? cleanHome : DEFAULT_HOME_STEPS));
      localStorage.setItem(STORAGE_KEY_REL_STEPS, JSON.stringify(cleanRelease.length > 0 ? cleanRelease : DEFAULT_RELEASE_STEPS));
      localStorage.setItem(STORAGE_KEY_REL_INTERVAL, JSON.stringify(interval));
    } catch {
      // 存储失败（如隐私模式）时静默处理，仍然退出页面
    }
    onClose();
  };

  // ── Home steps handlers ──
  const updateHomeStep = (i: number, field: keyof HomeStepConfig, value: string) =>
    setHomeSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const addHomeStep = () => {
    if (homeSteps.length < 10) setHomeSteps(prev => [...prev, { guide: '', noBtn: '', yesBtn: '' }]);
  };

  const removeHomeStep = (i: number) => {
    if (homeSteps.length > 1) setHomeSteps(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Release steps handlers ──
  const updateReleaseStep = (i: number, value: string) =>
    setReleaseSteps(prev => prev.map((s, idx) => idx === i ? value : s));

  const addReleaseStep = () => {
    if (releaseSteps.length < 10) setReleaseSteps(prev => [...prev, '']);
  };

  const removeReleaseStep = (i: number) => {
    if (releaseSteps.length > 1) setReleaseSteps(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Reset handlers ──
  const resetHomeSteps = () => setHomeSteps([...DEFAULT_HOME_STEPS]);
  const resetReleaseSteps = () => {
    setReleaseSteps([...DEFAULT_RELEASE_STEPS]);
    setReleaseIntervalSec(DEFAULT_RELEASE_INTERVAL_SEC);
  };

  return (
    <div
      className="customizer-page"
      ref={pageRef}
      onTouchStart={handleSwipeStart}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
    >
      {/* ── Top bar ── */}
      <div className="customizer-topbar">
        <button
          className="customizer-back"
          onTouchEnd={(e) => { e.preventDefault(); onClose(); }}
          onClick={onClose}
        >‹ 返回</button>
        <span className="customizer-topbar-title">自定义释放引导词</span>
        <button
          className="customizer-done"
          onTouchEnd={(e) => { e.preventDefault(); handleConfirm(); }}
          onClick={handleConfirm}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>

      {/* ── Tab switcher ── */}
      <div className="customizer-tabs">
        <div className="customizer-tabs-inner">
          <button
            className={`customizer-tab-btn${activeTab === 0 ? ' active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            首页引导词
          </button>
          <button
            className={`customizer-tab-btn${activeTab === 1 ? ' active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            ⚡ 引导词
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="customizer-scroll">

        {/* Tab 0: Home release steps */}
        {activeTab === 0 && (
          <div className="cst-steps">
            <div className="cst-tab-actions">
              <p className="cst-hint">引导语最多 30 字，按钮文字最多 4 字</p>
              <button className="cst-reset" onClick={resetHomeSteps}>重置默认</button>
            </div>

            {homeSteps.map((step, i) => (
              <div className="cst-unit" key={i}>
                <div className="cst-unit-header">
                  <span className="cst-label">第 {i + 1} 步</span>
                  {homeSteps.length > 1 && (
                    <button className="cst-remove" onClick={() => removeHomeStep(i)} aria-label="删除此步">✕</button>
                  )}
                </div>
                <textarea
                  className="cst-guide"
                  value={step.guide}
                  maxLength={30}
                  placeholder="引导语（最多 30 字）"
                  rows={2}
                  onChange={e => updateHomeStep(i, 'guide', e.target.value)}
                />
                <div className="cst-btns-row">
                  <div className="cst-btn-field">
                    <span className="cst-btn-label">左按钮</span>
                    <input
                      className="cst-btn-input"
                      value={step.noBtn}
                      maxLength={4}
                      placeholder="如：不能"
                      onChange={e => updateHomeStep(i, 'noBtn', e.target.value)}
                    />
                  </div>
                  <div className="cst-btn-field">
                    <span className="cst-btn-label">右按钮</span>
                    <input
                      className="cst-btn-input"
                      value={step.yesBtn}
                      maxLength={4}
                      placeholder="如：能"
                      onChange={e => updateHomeStep(i, 'yesBtn', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {homeSteps.length < 10 && (
              <button className="cst-add" onClick={addHomeStep}>＋ 添加步骤</button>
            )}

            {/* Fixed final step */}
            <div className="cst-unit cst-unit-fixed">
              <div className="cst-unit-header">
                <span className="cst-label">最终步（固定，不可编辑）</span>
              </div>
              <textarea
                className="cst-guide"
                value={FIXED_HOME_FINAL.guide}
                readOnly
                rows={2}
              />
              <div className="cst-btns-row">
                <div className="cst-btn-field">
                  <span className="cst-btn-label">左按钮</span>
                  <input className="cst-btn-input" value={FIXED_HOME_FINAL.noBtn} readOnly />
                </div>
                <div className="cst-btn-field">
                  <span className="cst-btn-label">右按钮</span>
                  <input className="cst-btn-input" value={FIXED_HOME_FINAL.yesBtn} readOnly />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Release page steps */}
        {activeTab === 1 && (
          <div className="cst-steps">
            <div className="cst-tab-actions">
              <p className="cst-hint">引导语最多 50 字，自动循环展示</p>
              <button className="cst-reset" onClick={resetReleaseSteps}>重置默认</button>
            </div>

            <div className="cst-interval-row">
              <span className="cst-interval-label">每条停留时间</span>
              <input
                type="number"
                className="cst-interval-input"
                value={releaseIntervalSec}
                min={1}
                max={60}
                step={0.5}
                onChange={e => setReleaseIntervalSec(Number(e.target.value))}
              />
              <span className="cst-interval-unit">秒</span>
            </div>

            {releaseSteps.map((step, i) => (
              <div className="cst-unit" key={i}>
                <div className="cst-unit-header">
                  <span className="cst-label">第 {i + 1} 条</span>
                  {releaseSteps.length > 1 && (
                    <button className="cst-remove" onClick={() => removeReleaseStep(i)} aria-label="删除此条">✕</button>
                  )}
                </div>
                <textarea
                  className="cst-guide"
                  value={step}
                  maxLength={50}
                  placeholder="引导语（最多 50 字）"
                  rows={2}
                  onChange={e => updateReleaseStep(i, e.target.value)}
                />
              </div>
            ))}

            {releaseSteps.length < 10 && (
              <button className="cst-add" onClick={addReleaseStep}>＋ 添加引导语</button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomizerPage;
