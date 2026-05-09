import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'topics',
    loadComponent: () => import('./pages/topics/topics.component').then((m) => m.TopicsComponent),
  },
  {
    path: 'topics/:slug/practice',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/topics/topic-practice.component').then((m) => m.TopicPracticeComponent),
  },
  {
    path: 'topics/:slug',
    loadComponent: () => import('./pages/topics/topic-theory.component').then((m) => m.TopicTheoryComponent),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/sign-up/sign-up.component').then((m) => m.SignUpComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  { path: '**', redirectTo: '' },
];
