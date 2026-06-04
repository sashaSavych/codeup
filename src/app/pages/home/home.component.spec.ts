import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';

import { OnboardingService } from '../../core/onboarding/onboarding.service';
import { GamificationService } from '../../core/gamification/gamification.service';
import { ResumePracticeService } from '../../core/practice/resume-practice.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        {
          provide: SupabaseService,
          useValue: {
            user: signal({ id: 'user-1', email: 'u@test.local' }),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            cachedProfile: signal({ leaderboard_nickname: 'TestNick' }),
          },
        },
        {
          provide: ResumePracticeService,
          useValue: {
            getResume: jasmine.createSpy('getResume').and.resolveTo(null),
          },
        },
        {
          provide: GamificationService,
          useValue: {
            reconcile: jasmine.createSpy('reconcile').and.resolveTo({ error: null }),
            leaderboard: jasmine
              .createSpy('leaderboard')
              .and.resolveTo({
                rows: [{ rank: 1, nickname: 'TestNick', competition_score: 3, streak_days: 1 }],
                error: null,
              }),
          },
        },
        {
          provide: OnboardingService,
          useValue: {
            startTour: jasmine.createSpy('startTour'),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render top-5 preview for signed-in user', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Топ-5 класу');
    expect(text).toContain('TestNick');
  });
});
