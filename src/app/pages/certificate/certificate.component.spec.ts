import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { PracticeProgressRemoteService } from '../../core/practice/practice-progress-remote.service';
import { PracticeTasksService } from '../../core/practice/practice-tasks.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { TopicsService } from '../../core/topics/topics.service';
import { CertificateComponent } from './certificate.component';

describe('CertificateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateComponent],
      providers: [
        provideRouter([]),
        {
          provide: SupabaseService,
          useValue: { user: signal({ id: 'u1' }) },
        },
        {
          provide: ProfileService,
          useValue: {
            cachedProfile: signal({ first_name: 'Олена', last_name: 'К.', class_id: null }),
            refreshCachedProfile: jasmine.createSpy('refreshCachedProfile').and.resolveTo(),
          },
        },
        {
          provide: PracticeTasksService,
          useValue: {
            listTaskSummaries: jasmine.createSpy('listTaskSummaries').and.resolveTo([
              { id: 't1', topic_slug: 'intro', sort_order: 1, title: 'A' },
            ]),
          },
        },
        {
          provide: TopicsService,
          useValue: {
            listSummariesForUser: jasmine
              .createSpy('listSummariesForUser')
              .and.resolveTo([{ slug: 'intro', sort_order: 1, title: 'Вступ', summary: '' }]),
          },
        },
        {
          provide: PracticeProgressRemoteService,
          useValue: {
            syncLocalPassedToRemote: jasmine.createSpy('sync').and.resolveTo(),
            listPassedTaskIdsForUser: jasmine.createSpy('list').and.resolveTo(['t1']),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders name when progress is 100%', async () => {
    const fixture = TestBed.createComponent(CertificateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Олена');
    expect(el.textContent).toContain('Сертифікат');
  });

});

describe('CertificateComponent redirect when incomplete', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateComponent],
      providers: [
        provideRouter([]),
        {
          provide: SupabaseService,
          useValue: { user: signal({ id: 'u1' }) },
        },
        {
          provide: ProfileService,
          useValue: {
            cachedProfile: signal({ first_name: 'A', last_name: 'B', class_id: null }),
            refreshCachedProfile: jasmine.createSpy('refreshCachedProfile').and.resolveTo(),
          },
        },
        {
          provide: PracticeTasksService,
          useValue: {
            listTaskSummaries: jasmine.createSpy('listTaskSummaries').and.resolveTo([
              { id: 't1', topic_slug: 'intro', sort_order: 1, title: 'A' },
            ]),
          },
        },
        {
          provide: TopicsService,
          useValue: {
            listSummariesForUser: jasmine
              .createSpy('listSummariesForUser')
              .and.resolveTo([{ slug: 'intro', sort_order: 1, title: 'Вступ', summary: '' }]),
          },
        },
        {
          provide: PracticeProgressRemoteService,
          useValue: {
            syncLocalPassedToRemote: jasmine.createSpy('sync').and.resolveTo(),
            listPassedTaskIdsForUser: jasmine.createSpy('list').and.resolveTo([]),
          },
        },
      ],
    }).compileComponents();
  });

  it('redirects when progress below 100%', async () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(CertificateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.navigate).toHaveBeenCalledWith(['/profile'], { queryParams: { tab: 'progress' } });
  });
});
