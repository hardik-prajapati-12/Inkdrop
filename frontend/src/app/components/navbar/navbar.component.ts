// src/app/components/navbar/navbar.component.ts
import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  user: User | null = null;
  isScrolled = false;
  menuOpen = false;
  dropdownOpen = false;   // ← controls profile dropdown

  constructor(
    public auth: AuthService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => this.user = u);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  // Close dropdown when user clicks ANYWHERE outside the user-menu
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const userMenuEl = this.elRef.nativeElement.querySelector('.user-menu');
    if (userMenuEl && !userMenuEl.contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();   // prevent document:click from firing immediately
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  logout(): void {
    this.dropdownOpen = false;
    this.menuOpen = false;
    this.auth.logout();
    this.router.navigate(['/']);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}
