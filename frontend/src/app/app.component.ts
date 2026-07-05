// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { ScrollToTopService } from './services/scroll-to-top.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer *ngIf="showFooter"></app-footer>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 72px);
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'InkDrop Blog';
  showFooter = true;

  constructor(
    private scrollToTop: ScrollToTopService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Register the global scroll-to-top listener once on app start
    this.scrollToTop.init();

    // Track active route to hide footer on admin, profile, login, and forgot-password pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.showFooter = !(
        url.startsWith('/admin') ||
        url.startsWith('/profile') ||
        url.startsWith('/login') ||
        url.startsWith('/forgot-password')
      );
    });
  }
}