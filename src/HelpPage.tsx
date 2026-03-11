import React, { useState, useRef } from 'react';
import CustomizerPage from './CustomizerPage';
import EmotionsChartPage from './EmotionsChartPage';

interface HelpPageProps {
  onExport: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearData: () => void;
  themeMode: 'auto' | 'light' | 'dark';
  onThemeChange: (mode: 'auto' | 'light' | 'dark') => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onExport, onImportFile, onClearData, themeMode, onThemeChange }) => {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showEmotionsChart, setShowEmotionsChart] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showFeedbackImg, setShowFeedbackImg] = useState(false);
  // Guard: ignore touch events on action buttons for the first 300ms after mount
  // (prevents ghost taps when returning from sub-pages whose back button was long-pressed)
  const mountTimeRef = useRef(Date.now());

  if (showCustomizer) {
    return <CustomizerPage initialTab={0} onClose={() => { mountTimeRef.current = Date.now(); setShowCustomizer(false); }} />;
  }

  if (showEmotionsChart) {
    return <EmotionsChartPage onClose={() => { mountTimeRef.current = Date.now(); setShowEmotionsChart(false); }} />;
  }

  return (
    <div className="help-section">

      {/* ── 清空数据确认弹窗 ── */}
      {showClearConfirm && (
        <div className="clear-confirm-overlay">
          <div className="clear-confirm-dialog">
            <div className="clear-confirm-icon">⚠️</div>
            <div className="clear-confirm-title">危险操作</div>
            <div className="clear-confirm-body">
              <p>即将清空所有记录数据，此操作<strong>不可恢复</strong>！</p>
              <p>点击确定清空数据。</p>
            </div>
            <div className="clear-confirm-actions">
              <button
                className="clear-confirm-cancel"
                onTouchEnd={(e) => { e.preventDefault(); setShowClearConfirm(false); }}
                onClick={() => setShowClearConfirm(false)}
              >
                取消
              </button>
              <button
                className="clear-confirm-ok"
                onTouchEnd={(e) => { e.preventDefault(); setShowClearConfirm(false); onClearData(); }}
                onClick={() => { setShowClearConfirm(false); onClearData(); }}
              >
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 数据操作按钮 ── */}
      <div className="help-card">
        <div className="help-data-actions" style={{ padding: '12px 24px' }}>
          <button
            className="help-action-btn help-action-danger"
            onTouchEnd={(e) => { if (Date.now() - mountTimeRef.current < 300) return; e.preventDefault(); setShowClearConfirm(true); }}
            onClick={() => setShowClearConfirm(true)}
          >
            清空数据
          </button>
          <button
            className="help-action-btn"
            onTouchEnd={(e) => { if (Date.now() - mountTimeRef.current < 300) return; e.preventDefault(); onExport(); }}
            onClick={onExport}
          >
            导出数据
          </button>
          <button
            className="help-action-btn"
            onTouchEnd={(e) => { if (Date.now() - mountTimeRef.current < 300) return; e.preventDefault(); document.getElementById('help-import-input')?.click(); }}
            onClick={() => document.getElementById('help-import-input')?.click()}
          >
            导入数据
          </button>
          <input
            type="file"
            id="help-import-input"
            accept=".json"
            style={{ display: 'none' }}
            onChange={onImportFile}
          />
        </div>
      </div>

      {/* ── 外观模式 ── */}
      <div className="help-card theme-card">
        <div className="theme-row">
          <span className="theme-label">夜间模式</span>
          <div className="theme-seg">
            {(['light', 'auto', 'dark'] as const).map((mode) => {
              const labels = { light: '浅色', auto: '自动', dark: '深色' };
              const icons  = { light: '☀️',  auto: '🌓',  dark: '🌙' };
              return (
                <button
                  key={mode}
                  className={`theme-seg-btn${themeMode === mode ? ' active' : ''}`}
                  onTouchEnd={(e) => { e.preventDefault(); onThemeChange(mode); }}
                  onClick={() => onThemeChange(mode)}
                >
                  <span className="theme-seg-icon">{icons[mode]}</span>
                  <span className="theme-seg-label">{labels[mode]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 自定义按钮 ── */}
      <div className="help-customize-btns">
        <button
          className="help-customize-btn"
          onClick={() => setShowCustomizer(true)}
        >
          <span className="help-customize-text">自定义释放引导词</span>
          <span className="help-customize-chevron">›</span>
        </button>
        <button
          className="help-customize-btn"
          onClick={() => setShowEmotionsChart(true)}
        >
          <span className="help-customize-text">情绪表</span>
          <span className="help-customize-chevron">›</span>
        </button>
      </div>

      {/* ── 卡片 1：风的六步骤 ── */}
      <div className="help-card">
        <div className="help-card-header">
          <span className="help-card-icon">💡</span>
          <span className="help-card-title">风的六步骤</span>
        </div>
        <div className="help-list">
          {[
            '你必须想要自由超过想要世界。你必须想要自由超过想要被认同和想要控制。想要被认同和想要控制 = 世界',
            '做出自由的决定。',
            '所有感受都来自想要被认同和想要控制，它们都是生存程序。释放它们。',
            '持续释放。',
            '当你卡住时，释放对卡住的感受的想要改变。',
            '每次你释放，你都更愉悦、轻松、脱离限制。随着释放，你会越来越愉悦、轻松、脱离限制。',
          ].map((text, i) => (
            <div className="help-row" key={i}>
              <span className="help-row-badge">{i + 1}</span>
              <p className="help-row-text">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 卡片 2：其他资料 ── */}
      <div className="help-card">
        <div className="help-card-header">
          <span className="help-card-icon">📚</span>
          <span className="help-card-title">其他资料</span>
        </div>
        <div className="help-list">
          <div className="help-row">
            <p className="help-row-text">B 站搜索 <strong>"92年原始释放法"</strong> 原版视频</p>
          </div>
          <div className="help-row">
            <p className="help-row-text">
              B 站 <img src="https://i1.hdslb.com/bfs/face/8d7a0d1e4e87ac4604a5e8d5a5334eb1cfe393aa.jpg" alt="B站头像" className="help-inline-icon" /><a href="https://space.bilibili.com/2104376857" target="_blank" rel="noopener noreferrer">哈师傅不叫哈师父</a>，分享释放法相关的视频和直播。其讲解的<a href="https://www.bilibili.com/video/BV14KKozTEkE" target="_blank" rel="noopener noreferrer">释放法简介</a>可以作为入门视频
            </p>
          </div>
          <div className="help-row">
            <p className="help-row-text">相关<strong>书籍</strong>《决定自由》《莱斯特自传》等，风的聊天记录，情绪表。都可以在<a href="https://pan.baidu.com/s/1SDRgX19wktgtWIDdCoNpbg?pwd=0000 提取码: 0000" target="_blank"><img src="./baidunetdisk.png" alt="百度网盘" className="help-inline-icon" />百度网盘</a>中自行下载</p>
          </div>
          <div className="help-row">
            <p className="help-row-text">
              苹果手机推荐应用 <a href="https://apps.apple.com/cn/app/id6754316888" target="_blank" rel="noopener noreferrer">释放法练习</a>
            </p>
          </div>
        </div>
      </div>

      {/* ── 卡片 3：使用说明 ── */}
      <div className="help-card">
        <div className="help-card-header">
          <span className="help-card-icon">📖</span>
          <span className="help-card-title">使用说明</span>
        </div>
        <div className="help-list">
          <div className="help-row">
            <p className="help-row-text"><strong>安装</strong>：首次打开需<strong>「共享」→「添加到主屏幕」</strong>，苹果手机建议使用 <strong>Safari</strong> 浏览器。此后可在桌面离线使用。</p>
          </div>
          <div className="help-row">
            <p className="help-row-text"><strong>数据</strong>：所有数据保存在本地浏览器，清理缓存时须留意。「导出数据」可备份，更换手机时可重新导入。</p>
          </div>
          <div className="help-row">
            <p className="help-row-text"><strong>记录</strong>：点击按钮记录情绪/想要，觉察次数 +1；长按启动释放练习，释放引导语可在本页上方自定义。按钮上方数字 = 觉察次数，下方 = 释放次数。「今日感想」输入后自动保存，每日 0 点归零。</p>
          </div>
          <div className="help-row">
            <p className="help-row-text"><strong>统计</strong>：汇总所有历史数据。条形图显示迄今总量，每条柱包括觉察+释放；饼图按月统计，随日历切换月份而变化；日历颜色深浅代表当日活跃度，点击日期查看当日详情与感想。</p>
          </div>
          <div className="help-row">
            <p className="help-row-text"><strong>⚡</strong>：一键启动释放练习，不针对特定情绪，自动循环进行。释放引导语可在本页上方自定义。</p>
          </div>
          <div className="help-row">
            <p className="help-row-text"><img src="./icon-192x192.png" alt="应用图标" className="help-inline-icon" />：应用图标的选择：情绪或许像烟花，释放了会更美好～</p>
          </div>
        </div>
      </div>

      {/* ── 卡片 4：Todo ── */}
      <div className="help-card">
        <div className="help-card-header">
          <span className="help-card-icon">🛠</span>
          <span className="help-card-title">Todo (or not Todo~)</span>
        </div>
        <div className="help-list">
          <div className="help-row">
            <p className="help-row-text"><strong>Bug 修复</strong>：iOS 点击进入今日感想编辑页面，输入光标行过低被输入法面板遮挡</p>
          </div>
          <div className="help-row">
            <p className="help-row-text">确保<strong>数据安全</strong>！识别什么情况会导致清除缓存，导致数据丢失，以及如何恢复。</p>
          </div>
          <div className="help-row">
            <p className="help-row-text"><strong>样式美化</strong>：⚡ 面板动态背景、通知栏融合、首页按钮颜色、更美观的字体。</p>
          </div>
          <div className="help-row">
            <p className="help-row-text">补充更多资料</p>
          </div>
          <div className="help-row">
            <p className="help-row-text"><a href="https://wj.qq.com/s2/25934282/dfce/" target="_blank" rel="noopener noreferrer external" referrerPolicy="no-referrer">点击这里</a>或扫码，反馈Bug和需求  <img src="./feedback.png" alt="腾讯问卷扫码" className="help-feedback-Qcode" onClick={() => setShowFeedbackImg(true)} /> </p>
          </div>
        </div>
      </div>

      {/* ── 反馈二维码灯箱 ── */}
      {showFeedbackImg && (
        <div
          className="feedback-lightbox"
          onClick={() => setShowFeedbackImg(false)}
          onTouchEnd={(e) => { e.preventDefault(); setShowFeedbackImg(false); }}
        >
          <img src="./feedback.png" alt="腾讯问卷扫码" className="feedback-lightbox-img" />
        </div>
      )}

      {/* ── 构建版本 ── */}
      <div className="help-build-time">构建时间 {__BUILD_TIME__}</div>

    </div>
  );
};

export default HelpPage;
