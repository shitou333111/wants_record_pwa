export interface HomeStepConfig {
  guide: string;
  noBtn: string;
  yesBtn: string;
}

export const DEFAULT_HOME_STEPS: HomeStepConfig[] = [
  { guide: '你能仅仅是允许自己感受它吗？', noBtn: '不能', yesBtn: '能' },
  { guide: '你愿意释放它吗？', noBtn: '不愿意', yesBtn: '愿意' },
  { guide: '什么时候释放？', noBtn: '以后', yesBtn: '现在' },
  { guide: '现在你有感觉好一点吗？', noBtn: '没有', yesBtn: '有' },
];

export const FIXED_HOME_FINAL: HomeStepConfig = {
  guide: '本次释放完成！',
  noBtn: '结束',
  yesBtn: '继续',
};

export const DEFAULT_RELEASE_STEPS: string[] = [
  '你能允许自己感受它吗',
  '你愿意释放它吗',
  '现在可以释放吗',
  '你有感觉好一点吗',
];

export const DEFAULT_RELEASE_INTERVAL_SEC = 7.5;

export const STORAGE_KEY_HOME = 'homeReleaseSteps';
export const STORAGE_KEY_REL_STEPS = 'releasePageSteps';
export const STORAGE_KEY_REL_INTERVAL = 'releasePageIntervalSec';

export function loadHomeSteps(): HomeStepConfig[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY_HOME);
    return s ? JSON.parse(s) : DEFAULT_HOME_STEPS;
  } catch {
    return DEFAULT_HOME_STEPS;
  }
}

export function loadReleaseSteps(): string[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY_REL_STEPS);
    return s ? JSON.parse(s) : DEFAULT_RELEASE_STEPS;
  } catch {
    return DEFAULT_RELEASE_STEPS;
  }
}

export function loadReleaseIntervalSec(): number {
  try {
    const s = localStorage.getItem(STORAGE_KEY_REL_INTERVAL);
    return s ? JSON.parse(s) : DEFAULT_RELEASE_INTERVAL_SEC;
  } catch {
    return DEFAULT_RELEASE_INTERVAL_SEC;
  }
}
