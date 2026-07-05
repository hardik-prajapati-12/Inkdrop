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
    <app-footer *ngIf="!isAdminRoute"></app-footer>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 72px);
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'InkDrop Blog';
  isAdminRoute = false;

  constructor(
    private scrollToTop: ScrollToTopService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Register the global scroll-to-top listener once on app start
    this.scrollToTop.init();

    // Track active route to hide footer on admin pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAdminRoute = event.urlAfterRedirects.startsWith('/admin') || event.urlAfterRedirects.startsWith('/profile');
    });
  }
}