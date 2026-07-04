// src/app/components/footer/footer.component.ts
import { Component, OnInit } from '@angular/core';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { Router } from '@angular/router';
import { Category, Settings } from '../../models';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  year       = new Date().getFullYear();
  categories: Category[] = [];
  settings: Settings = {
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
    email: '/contact'
  };

  constructor(
    private postService: PostService,
    public  auth:        AuthService,
    private router:      Router,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.postService.getCategories().subscribe({
      next:  (cats) => this.categories = cats,
      error: ()     => { /* silently ignore — footer still renders */ }
    });

    this.settingsService.getSettings().subscribe({
      next: (data) => {
        if (data) this.settings = data;
      },
      error: () => { /* fallback remains intact */ }
    });
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}