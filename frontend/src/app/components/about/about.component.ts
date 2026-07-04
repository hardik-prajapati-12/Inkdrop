// src/app/components/about/about.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService }  from '../../services/auth.service';
import { PostService }  from '../../services/post.service';
import { User }         from '../../models';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  // ── Team (live from API) ─────────────────────────────────
  team:        User[] = [];
  teamLoading  = true;
  teamError    = '';
  postCounts:  { [id: string]: number } = {};

  // ── Stats (live from API) ────────────────────────────────
  totalReaders = 0;    // sum of all post views
  statsLoaded  = false;

  values = [
    { icon: '✍', title: 'Authentic Voice',  desc: 'We write with honesty, clarity, and genuine passion for every topic.' },
    { icon: '🔍', title: 'Deep Research',    desc: 'Every article is backed by thorough research and multiple perspectives.' },
    { icon: '🌍', title: 'Global Reach',     desc: 'Our readers span 60+ countries — diverse voices, one community.' },
    { icon: '💡', title: 'Fresh Ideas',      desc: 'We challenge conventional thinking and explore new frontiers.' },
    { icon: '🤝', title: 'Community First',  desc: 'Comments, discussions, and reader contributions shape our content.' },
    { icon: '♻', title: 'Always Free',      desc: 'Knowledge should be accessible to everyone, forever.' },
  ];

  constructor(
    private authService: AuthService,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    this.loadTeam();
    this.loadStats();
  }

  loadTeam(): void {
    this.teamLoading = true;
    this.teamError   = '';
    this.authService.getAuthors().subscribe({
      next: (authors) => {
        this.team        = authors;
        this.teamLoading = false;
        this.loadPostCounts();
      },
      error: () => {
        this.teamLoading = false;
        this.teamError   = 'Could not load team members.';
      }
    });
  }

  loadStats(): void {
    // Fetch published posts to calculate total real readers (sum of views)
    this.postService.getPosts(1, 100).subscribe({
      next: (res) => {
        this.totalReaders = res.posts.reduce((sum, p) => sum + (p.views || 0), 0);
        this.statsLoaded  = true;
      },
      error: () => { this.statsLoaded = true; }
    });
  }

  loadPostCounts(): void {
    this.postService.getPosts(1, 100).subscribe({
      next: (res) => {
        const counts: { [id: string]: number } = {};
        res.posts.forEach(post => {
          const id = post.author._id;
          counts[id] = (counts[id] || 0) + 1;
        });
        this.postCounts = counts;
      },
      error: () => {}
    });
  }

  // ── Helpers ──────────────────────────────────────────────
  getInitials(username: string): string {
    return username.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  getRoleLabel(role: string): string {
    return role === 'admin' ? 'Founder & Editor' : 'Author';
  }

  getRoleClass(role: string): string {
    return role === 'admin' ? 'role-admin' : 'role-author';
  }

  getMemberBio(user: User): string {
    return user.bio && user.bio.trim() ? user.bio : 'Writer & contributor at InkDrop.';
  }

  getPostCount(userId: string): number {
    return this.postCounts[userId] || 0;
  }

  getAvatarUrl(avatar: string | undefined): string | null {
    if (!avatar || avatar.trim() === '') return null;
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:5000${avatar}`;
  }

  getMemberSince(createdAt: string): string {
    return new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /** Format reader count: 1234 → "1.2K", 12345 → "12K" */
  formatReaders(n: number): string {
    if (n === 0) return '0';
    if (n < 1000) return n.toString();
    if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return Math.floor(n / 1000) + 'K+';
  }
}