import { Injectable } from '@angular/core';

const STORAGE_KEY = 'cu_onboarding_v1_done';

export interface OnboardingStep {
  selector: string;
  title: string;
  body: string;
}

const STEPS: OnboardingStep[] = [
  {
    selector: '[data-cu-tour="nav-topics"]',
    title: 'Теми модуля',
    body: 'Тут усі уроки з теорією та практикумом. Почни з першої теми або продовж з того місця, де зупинився.',
  },
  {
    selector: '[data-cu-tour="nav-profile"]',
    title: 'Профіль',
    body: 'Обери клас, увімкни змагання та псевдонім — тоді з’явиться рейтинг класу.',
  },
  {
    selector: '[data-cu-tour="home-topics-cta"]',
    title: 'Перший крок',
    body: 'Натисни «Перейти до тем» і відкрий практикум після короткої теорії.',
  },
];

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  isDone(): boolean {
    if (typeof localStorage === 'undefined') {
      return true;
    }
    return localStorage.getItem(STORAGE_KEY) === '1';
  }

  markDone(): void {
    localStorage.setItem(STORAGE_KEY, '1');
  }

  getSteps(): OnboardingStep[] {
    return STEPS;
  }

  /** Overlay tour; returns true if tour was shown. */
  startTour(): boolean {
    if (this.isDone()) {
      return false;
    }
    let index = 0;

    const overlay = document.createElement('div');
    overlay.className = 'cu-onboarding-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'cu-onboarding-card';
    overlay.appendChild(card);

    const titleEl = document.createElement('h2');
    titleEl.className = 'cu-onboarding-title';
    const bodyEl = document.createElement('p');
    bodyEl.className = 'cu-onboarding-body';
    const actions = document.createElement('div');
    actions.className = 'cu-onboarding-actions';

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'cu-onboarding-skip';
    skipBtn.textContent = 'Пропустити';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'cu-onboarding-next';

    card.append(titleEl, bodyEl, actions);
    actions.append(skipBtn, nextBtn);

    let highlight: HTMLElement | null = null;

    const cleanup = (): void => {
      overlay.remove();
      highlight?.classList.remove('cu-onboarding-highlight');
      highlight = null;
      this.markDone();
    };

    const showStep = (): void => {
      const step = STEPS[index];
      if (!step) {
        cleanup();
        return;
      }
      highlight?.classList.remove('cu-onboarding-highlight');
      const el = document.querySelector(step.selector);
      if (el instanceof HTMLElement) {
        highlight = el;
        el.classList.add('cu-onboarding-highlight');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      titleEl.textContent = step.title;
      bodyEl.textContent = step.body;
      nextBtn.textContent = index === STEPS.length - 1 ? 'Готово' : 'Далі';
    };

    skipBtn.addEventListener('click', cleanup);
    nextBtn.addEventListener('click', () => {
      index += 1;
      if (index >= STEPS.length) {
        cleanup();
      } else {
        showStep();
      }
    });

    document.body.appendChild(overlay);
    showStep();
    return true;
  }
}
