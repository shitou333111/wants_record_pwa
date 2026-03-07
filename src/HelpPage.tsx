import React from 'react';

const HelpPage: React.FC = () => {
  return (
    <div className="help-section">
      <div className="card">
        <h3>风的六步骤</h3>
        <hr className="step-divider" />
        <div className="steps-list">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <p>你必须想要自由超过想要世界。你必须想要自由超过想要被认同和想要控制。想要被认同和想要控制=世界</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <p>做出自由的决定。</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <p>所有感受都来自想要被认同和想要控制，它们都是生存程序。释放它们。</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-number">4</div>
            <div className="step-content">
              <p>持续释放。</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-number">5</div>
            <div className="step-content">
              <p>当你卡住时，释放对卡住的感受的想要改变。</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-number">6</div>
            <div className="step-content">
              <p>每次你释放，你都更愉悦、轻松、脱离限制。随着释放，你会越来越愉悦、轻松、脱离限制。</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>其他资料</h3>
        <hr className="step-divider" />
        <div className="steps-list">
          <div className="step-item">
            <div className="step-content">
              <p>B站搜索<strong>"92年原始释放法"</strong>原版视频</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>B站<strong>&lt;哈师傅不是哈师父&gt;</strong>，分享释放法相关的视频和直播</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>相关<strong>书籍</strong>《决定自由》《莱斯特自传》等</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>苹果手机推荐一个应用<strong>&lt;释放法练习&gt;</strong>，就在APP store</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>关于此网站的使用</h3>
        <hr className="step-divider" />
        <div className="steps-list">
          <div className="step-item">
            <div className="step-content">
              <p><strong>首次</strong>打开此网站需”<strong>共享</strong>"→”<strong>添加到主屏幕</strong>"，苹果手机必须使用<strong>Safari</strong>浏览器。此后就可以在桌面打开应用离线使用，不必再打开浏览器</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>此网站所有<strong>数据</strong>都保存在本地浏览器中，清理缓存时须留意。&lt;导出数据&gt;按钮可以备份数据，更换手机时也可以重新导入</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p><strong>&lt;记录&gt;</strong>面板记录日常的情绪和释放，点击会记录下当前的情绪和想要，次数+1；长按会启动释放练习，按钮中上方数字代表记录次数，下方数字代表释放次数。”今日感想“可以记录当天发生的事情和心理，输入会自动保存。次数和感悟每日0点归零，查看过去的记录请到&lt;统计面板&gt;</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p><strong>&lt;统计&gt;</strong>面板统计过去所有的数据。最上面两幅饼图分别是当月情绪和想要的次数分布，更改下方日历中的月份，可以查看其他月份的分布。日历中每日颜色深浅代表当日记录+释放的总次数，颜色越深代表当日记录和释放越多，可选择查看特别的日子。选中日期后，下方会展示当日所做的记录和释放，以及当日的感想。数据可以导出和导入，json格式，建议经常进行导出备份，因为本地缓存有时会被系统清理。而且本APP bug繁多，保险起见</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>⚡按钮一键启动释放练习，不针对特定情绪，不针对特定想要，立即进行，自动循环进行。不过提示语没有针对性</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>应用图标🎇的选择：情绪或许像烟花，释放了会更美好~ </p>
            </div>
          </div>

        </div>
      </div>
        <div className="card">
        <h3>todo (or not todo)</h3>
        <hr className="step-divider" />
        <div className="steps-list">
          <div className="step-item">
            <div className="step-content">
              <p><strong>Bug修复</strong>：&lt;记录&gt;面板中的感悟卡片，点击输入有时弹起的位置不对，暂时的解决方法：收起卡片后，额外点击页面中空白区域一次，再次点击输入框就会正常弹起。<br/>输入框长按无法选中文字进行复制粘贴操作。</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>确保<strong>数据安全！</strong>识别什么情况会导致数据丢失？怎么恢复？</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p><strong>释放流程</strong>的完善，包括顺序逻辑 提示语</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p><strong>样式美化</strong>：⚡面板的动态背景，手机通知栏融合，首页按钮的美化，释放弹出面板的美化，适合的字体</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>补充一些<strong>相关资料</strong>，比如完整的情绪表</p>
            </div>
          </div>
          <hr className="step-divider" />
          <div className="step-item">
            <div className="step-content">
              <p>......</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HelpPage;