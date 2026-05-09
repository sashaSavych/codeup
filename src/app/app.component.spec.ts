import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ProfileService } from './core/profile/profile.service';
import { SupabaseService } from './core/supabase/supabase.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            user: signal(null),
            signOut: jasmine.createSpy('signOut').and.resolveTo(),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            cachedProfile: signal(null),
            clearCachedProfile: jasmine.createSpy('clearCachedProfile'),
            refreshCachedProfile: jasmine.createSpy('refreshCachedProfile').and.resolveTo(),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'CodeUp' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('CodeUp');
  });

  it('should render app name in header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('CodeUp');
  });
});
