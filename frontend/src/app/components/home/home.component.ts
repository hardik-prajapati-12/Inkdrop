// src/app/components/home/home.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, NgZone } from '@angular/core';
import { PostService } from '../../services/post.service';
import { Post, Category } from '../../models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  imageUrl = environment.imageUrl;
  featuredPosts: Post[] = [];
  posts: Post[]          = [];
  categories: Category[] = [];

  totalPages    = 1;
  currentPage   = 1;
  total         = 0;

  searchQuery      = '';
  selectedCategory = '';
  searchTimeout: any;

  // 'author' | 'category' | 'tag' | 'title' | ''
  searchMatchType = '';

  loadingFeatured = true;
  loadingPosts    = true;

  // 3D tilt effect state
  private tiltBound = false;
  private heroMouseHandler: ((e: MouseEvent) => void) | null = null;
  private rafId: number | null = null;

  constructor(private postService: PostService, private el: ElementRef, private zone: NgZone) {}

  ngOnInit(): void {
    this.loadFeatured();
    this.loadPosts();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initHeroParallax();
      this.initCardTilt();
    });
  }

  ngOnDestroy(): void {
    if (this.heroMouseHandler) {
      window.removeEventListener('mousemove', this.heroMouseHandler);
    }
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  /* ── 3D Hero Parallax ─────────────────────────────── */
  private initHeroParallax(): void {
    const hero = this.el.nativeElement.querySelector('.hero') as HTMLElement;
    if (!hero) return;

    const badge   = hero.querySelector('.hero-badge') as HTMLElement;
    const title   = hero.querySelector('.hero-title') as HTMLElement;
    const subtitle = hero.querySelector('.hero-subtitle') as HTMLElement;
    const actions = hero.querySelector('.hero-actions') as HTMLElement;
    const stats   = hero.querySelector('.hero-stats') as HTMLElement;
    const glow    = hero.querySelector('.hero-glow') as HTMLElement;

    this.heroMouseHandler = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = (e.clientX - centerX) / (rect.width / 2);   // -1 to 1
      const y = (e.clientY - centerY) / (rect.height / 2);  // -1 to 1

      // Parallax layers — each element moves at different speed
      if (badge)    badge.style.transform    = `translate3d(${x * 8}px, ${y * 5}px, 0)`;
      if (title)    title.style.transform    = `translate3d(${x * -12}px, ${y * -8}px, 0)`;
      if (subtitle) subtitle.style.transform = `translate3d(${x * 6}px, ${y * 4}px, 0)`;
      if (actions)  actions.style.transform  = `translate3d(${x * -5}px, ${y * -3}px, 0)`;
      if (stats)    stats.style.transform    = `translate3d(${x * 10}px, ${y * 6}px, 0)`;
      if (glow)     glow.style.transform     = `translateX(-50%) translate3d(${x * 25}px, ${y * 20}px, 0)`;
    };

    window.addEventListener('mousemove', this.heroMouseHandler, { passive: true });
  }

  /* ── 3D Card Tilt ─────────────────────────────────── */
  private initCardTilt(): void {
    // Use MutationObserver to catch dynamically rendered cards
    const observer = new MutationObserver(() => {
      this.bindCardTilt();
    });
    observer.observe(this.el.nativeElement, { childList: true, subtree: true });
    this.bindCardTilt();
  }

  private bindCardTilt(): void {
    const cards = this.el.nativeElement.querySelectorAll(
      '.post-card, .featured-main, .featured-side-card'
    ) as NodeListOf<HTMLElement>;

    cards.forEach((card: HTMLElement) => {
      if ((card as any).__tiltBound) return;
      (card as any).__tiltBound = true;

      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;   // 0 to 1
        const y = (e.clientY - rect.top) / rect.height;    // 0 to 1
        const tiltX = (y - 0.5) * -10;  // degrees
        const tiltY = (x - 0.5) * 10;   // degrees

        card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`;
        card.style.boxShadow = `
          ${(x - 0.5) * -15}px ${(y - 0.5) * -15}px 30px rgba(0,0,0,0.5),
          0 0 20px rgba(212,168,83,0.08)
        `;
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      }, { passive: true });
    });
  }

  loadFeatured(): void {
    this.loadingFeatured = true;
    this.postService.getFeaturedPosts().subscribe({
      next:  posts => { this.featuredPosts = posts; this.loadingFeatured = false; },
      error: ()    => { this.loadingFeatured = false; }
    });
  }

  loadPosts(page = 1): void {
    this.loadingPosts = true;
    this.postService.getPosts(page, 6, this.searchQuery, this.selectedCategory).subscribe({
      next: (res: any) => {
        this.posts           = res.posts;
        this.totalPages      = res.totalPages;
        this.currentPage     = res.currentPage;
        this.total           = res.total;
        this.searchMatchType = res.matchType || '';
        this.loadingPosts    = false;

        // ── Tag search fix ──────────────────────────────────────
        // The backend can incorrectly return matchType='category' when
        // the query is a substring of a category name (e.g. "ai" inside
        // "Entertainment"). We detect this and correct it client-side.
        this.fixTagSearchMismatch();
      },
      error: () => { this.loadingPosts = false; }
    });
  }

  /**
   * After posts load, check whether the API's matchType is actually wrong.
   *
   * Scenario: user searches "ai". Backend does a substring match on category
   * names and finds "Entert-AI-nment", returning matchType='category'.
   * But "ai" is also an exact tag on some posts.
   *
   * Fix strategy:
   *   1. If matchType is NOT already 'tag', scan all returned posts for any
   *      post whose tags array contains an exact match of the query.
   *   2. If any exact tag match is found, filter the displayed posts to only
   *      those with the tag and override searchMatchType to 'tag'.
   *   3. If matchType IS 'category' but NO post actually belongs to a category
   *      whose name EXACTLY matches (only a substring match happened), we
   *      attempt the tag filter first.
   */
  private fixTagSearchMismatch(): void {
    if (!this.searchQuery || !this.posts.length) return;

    const q = this.searchQuery.trim().toLowerCase();

    // ── Check for exact tag matches in returned posts ───────────
    const tagMatchedPosts = this.posts.filter(post =>
      post.tags?.some(tag => tag.toLowerCase() === q)
    );

    if (tagMatchedPosts.length > 0) {
      // We have posts with this exact tag — always prefer tag results
      // over a category substring match
      if (this.searchMatchType !== 'tag') {
        this.posts           = tagMatchedPosts;
        this.total           = tagMatchedPosts.length;
        this.searchMatchType = 'tag';
      }
      return;
    }

    // ── Check for exact category name match (not just substring) ─
    // If matchType='category' but no category name exactly matches
    // the query, the result is a false positive from substring search.
    // In that case clear results so the user sees "No articles found"
    // rather than unrelated posts.
    if (this.searchMatchType === 'category') {
      const hasExactCategoryMatch = this.posts.some(post =>
        post.category?.name?.toLowerCase() === q
      );

      if (!hasExactCategoryMatch) {
        // Substring-only category match — not what the user intended.
        // Show empty state so they know there are no exact results.
        this.posts           = [];
        this.total           = 0;
        this.searchMatchType = '';
      }
    }
  }

  loadCategories(): void {
    this.postService.getCategories().subscribe(cats => this.categories = cats);
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchMatchType = '';          // reset while typing
    this.searchTimeout = setTimeout(() => this.loadPosts(1), 400);
  }

  filterByCategory(catId: string): void {
    this.selectedCategory = this.selectedCategory === catId ? '' : catId;
    this.loadPosts(1);
  }

  clearSearch(): void {
    this.searchQuery      = '';
    this.selectedCategory = '';
    this.searchMatchType  = '';
    this.loadPosts(1);
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/default-cover.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${environment.imageUrl}${imagePath}`;
  }

  getCategoryIconClass(icon: string | undefined): string {
    if (!icon) return 'bi bi-folder-fill';
    const map: { [key: string]: string } = {
      '💡': 'bi bi-lightbulb-fill',
      '🎨': 'bi bi-palette-fill',
      '🌿': 'bi bi-leaf-fill',
      '📈': 'bi bi-graph-up-arrow',
      '🔬': 'bi bi-activity',
      '🧘': 'bi bi-heart-pulse-fill',
      '🎬': 'bi bi-film',
      '👗': 'bi bi-gem',
      '✈': 'bi bi-airplane-fill',
      '🍔': 'bi bi-egg-fried',
      '✍️': 'bi bi-pencil-square',
      '✍': 'bi bi-pencil-square',
      '🎓': 'bi bi-mortarboard-fill',
      '📄': 'bi bi-file-earmark-text-fill',
    };
    return map[icon.trim()] || 'bi bi-folder-fill';
  }
}