// src/app/components/admin/admin.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PostService }    from '../../services/post.service';
import { AuthService }    from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { SettingsService } from '../../services/settings.service';
import { Post, Category, User, Message, MessageStats, Comment, CommentStats, Settings } from '../../models';
import { environment } from '../../../environments/environment';

type AdminTab = 'overview' | 'posts' | 'create' | 'categories' | 'users' | 'comments' | 'messages' | 'settings';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  imageUrl = environment.imageUrl;
  activeTab: AdminTab = 'overview';

  // Data
  posts:            Post[]        = [];
  categories:       Category[]    = [];
  users:            User[]        = [];
  messages:         Message[]     = [];
  comments:         Comment[]     = [];
  filteredComments: Comment[]     = [];

  // Stats
  msgStats:     MessageStats = { total: 0, unread: 0, starred: 0 };
  commentStats: CommentStats = { total: 0, visible: 0, hidden: 0 };

  // Loading flags
  loading          = false;
  saving           = false;
  usersLoading     = false;
  msgsLoading      = false;
  commentsLoading  = false;
  errorMsg         = '';
  successMsg       = '';

  // Posts
  editingPost:     Post | null = null;
  postForm!:       FormGroup;
  categoryForm!:   FormGroup;
  selectedFile:    File | null = null;
  previewUrl       = '';
  removeCoverImage = false;

  // ── Category editing ──────────────────────────────────────
  editingCategory:     Category | null = null;   // which category is being edited
  editCategoryForm!:   FormGroup;                // reactive form for inline edit
  savingCategory       = false;                  // spinner while PUT request is in flight

  // Users
  editingUserId:   string | null = null;
  editingUserRole: string = 'user';

  // Messages
  showUnreadOnly   = false;
  selectedMessage: Message | null = null;
  showReplyModal   = false;
  replySubject     = '';
  replyBody        = '';
  replySending     = false;
  replyError       = '';
  replySuccess     = '';

  // Overview
  overviewStats:  any = null;
  overviewLoading = false;
  recentPosts:    any[] = [];
  topPosts:       any[] = [];

  // Author Insights
  authorInsights: any = null;
  insightsLoading = false;

  // Comments
  commentFilter: 'all' | 'visible' | 'hidden' = 'all';
  commentSearch  = '';
  commentSearchTimeout: any;

  // Settings
  settingsLoading = false;
  settingsSaving  = false;
  settingsForm!:    FormGroup;

  constructor(
    private fb:             FormBuilder,
    private postService:    PostService,
    public  auth:           AuthService,
    private http:           HttpClient,
    private router:         Router,
    private messageService: MessageService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.verifyRoleFromServer();
  }

  verifyRoleFromServer(): void {
    this.http.get<{ user: User }>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        if (res.user.role !== this.auth.currentUser?.role) {
          localStorage.setItem('blog_user', JSON.stringify(res.user));
          window.location.reload();
          return;
        }
        this.activeTab = 'overview';
        this.loadData();
      },
      error: () => {
        this.activeTab = 'overview';
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.loadPosts();
    if (this.auth.isAdmin) {
      this.loadCategories();
      this.loadUsers();
      this.loadMsgStats();
      this.loadOverview();
    }
    if (this.auth.isAuthor) { this.loadAuthorInsights(); }
    this.loadCommentStats();
  }

  initForms(): void {
    this.postForm = this.fb.group({
      title:    ['', [Validators.required, Validators.minLength(5)]],
      content:  ['', [Validators.required, Validators.minLength(20)]],
      excerpt:  [''],
      category: [''],
      tags:     [''],
      status:   ['draft']
    });

    this.categoryForm = this.fb.group({
      name:        ['', Validators.required],
      description: [''],
      icon:        ['📝'],
      color:       ['#D4A853']
    });

    // Separate reactive form for editing an existing category
    this.editCategoryForm = this.fb.group({
      name:        ['', Validators.required],
      description: [''],
      icon:        ['📝'],
      color:       ['#D4A853']
    });

    this.settingsForm = this.fb.group({
      twitter:  ['', [Validators.pattern('https?://.*')]],
      linkedin: ['', [Validators.pattern('https?://.*')]],
      github:   ['', [Validators.pattern('https?://.*')]],
      email:    ['']
    });
  }


  // ── Overview ──────────────────────────────────────────────
  loadOverview(): void {
    this.overviewLoading = true;
    this.http.get<any>(`${environment.apiUrl}/stats/overview`).subscribe({
      next: (data) => {
        this.overviewStats   = data;
        this.topPosts        = data.topPosts || [];
        this.recentPosts     = data.recentPosts || [];
        this.overviewLoading = false;
      },
      error: () => { this.overviewLoading = false; }
    });
  }

  // ── Author Insights ───────────────────────────────────────
  loadAuthorInsights(): void {
    this.insightsLoading = true;
    this.postService.getMyPosts().subscribe({
      next: (posts) => {
        const published  = posts.filter(p => p.status === 'published');
        const drafts     = posts.filter(p => p.status === 'draft');
        const totalViews = published.reduce((s, p) => s + (p.views || 0), 0);
        const totalLikes = published.reduce((s, p) => s + (p.likes?.length || 0), 0);
        const avgViews   = published.length ? Math.round(totalViews / published.length) : 0;
        const topPosts   = [...published].sort((a, b) => b.views - a.views).slice(0, 5);
        const recentPosts = [...posts].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5);
        this.authorInsights  = { published: published.length, drafts: drafts.length, totalViews, totalLikes, avgViews, topPosts, recentPosts };
        this.insightsLoading = false;
      },
      error: () => { this.insightsLoading = false; }
    });
  }

  // ── Posts ──────────────────────────────────────────────────
  loadPosts(): void {
    this.loading = true; this.errorMsg = '';
    const req = this.auth.isAdmin ? this.postService.getAllPostsAdmin() : this.postService.getMyPosts();
    req.subscribe({
      next:  (posts) => { this.posts = posts; this.loading = false; },
      error: (err)   => { this.loading = false; this.errorMsg = err.error?.message || err.message; }
    });
  }

  loadCategories(): void {
    this.postService.getCategories().subscribe({
      next:  (cats) => this.categories = cats,
      error: () => {}
    });
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.auth.getAllUsers().subscribe({
      next:  (users) => { this.users = users; this.usersLoading = false; },
      error: (err)   => { this.usersLoading = false; this.errorMsg = err.error?.message || err.message; }
    });
  }

  // ── Comments ───────────────────────────────────────────────
  loadComments(): void {
    this.commentsLoading = true;
    this.postService.getManagedComments().subscribe({
      next: (comments) => {
        this.comments        = comments;
        this.commentsLoading = false;
        this.applyCommentFilter();
      },
      error: (err) => { this.commentsLoading = false; this.errorMsg = err.error?.message || err.message; }
    });
  }

  loadCommentStats(): void {
    this.postService.getCommentStats().subscribe({
      next:  (stats) => this.commentStats = stats,
      error: () => {}
    });
  }

  applyCommentFilter(): void {
    let list = [...this.comments];
    if (this.commentFilter === 'visible') list = list.filter(c => c.isApproved);
    if (this.commentFilter === 'hidden')  list = list.filter(c => !c.isApproved);
    const q = this.commentSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        c.content.toLowerCase().includes(q) ||
        c.author.username.toLowerCase().includes(q) ||
        (c as any).post?.title?.toLowerCase().includes(q)
      );
    }
    this.filteredComments = list;
  }

  onCommentSearch(): void {
    clearTimeout(this.commentSearchTimeout);
    this.commentSearchTimeout = setTimeout(() => this.applyCommentFilter(), 300);
  }

  setCommentFilter(f: 'all' | 'visible' | 'hidden'): void {
    this.commentFilter = f;
    this.applyCommentFilter();
  }

  toggleHideComment(comment: Comment): void {
    this.postService.hideComment(comment._id).subscribe({
      next: (res) => {
        comment.isApproved = res.isApproved;
        if (res.isApproved) { this.commentStats.visible++; this.commentStats.hidden--; }
        else                { this.commentStats.hidden++;  this.commentStats.visible--; }
        this.applyCommentFilter();
        this.successMsg = res.message;
        setTimeout(() => this.successMsg = '', 2500);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed to update comment.'; }
    });
  }

  deleteComment(id: string): void {
    if (!confirm('Delete this comment permanently?')) return;
    this.postService.deleteComment(id).subscribe({
      next: () => {
        this.comments            = this.comments.filter(c => c._id !== id);
        this.commentStats.total  = Math.max(0, this.commentStats.total - 1);
        this.applyCommentFilter();
        this.successMsg = 'Comment deleted.';
        setTimeout(() => this.successMsg = '', 2500);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Delete failed.'; }
    });
  }

  getPostTitle(comment: Comment): string { return (comment as any).post?.title || 'Unknown post'; }
  getPostSlug(comment: Comment):  string { return (comment as any).post?.slug  || ''; }

  // ── Messages ───────────────────────────────────────────────
  loadMessages(): void {
    this.msgsLoading = true;
    this.messageService.getMessages(this.showUnreadOnly).subscribe({
      next:  (msgs) => { this.messages = msgs; this.msgsLoading = false; },
      error: (err)  => { this.msgsLoading = false; this.errorMsg = err.error?.message || err.message; }
    });
  }

  loadMsgStats(): void {
    this.messageService.getStats().subscribe({
      next:  (s) => this.msgStats = s,
      error: () => {}
    });
  }

  openMessage(msg: Message): void {
    this.selectedMessage = msg;
    this.closeReplyModal();
    if (!msg.isRead) {
      this.messageService.toggleRead(msg._id).subscribe(() => {
        msg.isRead           = true;
        // ✅ Decrement unread badge — hides automatically in template when it hits 0
        this.msgStats.unread = Math.max(0, this.msgStats.unread - 1);
      });
    }
  }

  closeMessage(): void { this.selectedMessage = null; this.closeReplyModal(); }

  toggleRead(msg: Message, event: Event): void {
    event.stopPropagation();
    this.messageService.toggleRead(msg._id).subscribe(res => {
      const wasRead    = msg.isRead;
      msg.isRead       = res.isRead;
      // ✅ Keep unread badge count accurate on manual toggle
      this.msgStats.unread = Math.max(0, this.msgStats.unread + (wasRead ? 1 : -1));
      if (this.showUnreadOnly && msg.isRead) this.messages = this.messages.filter(m => m._id !== msg._id);
    });
  }

  toggleStar(msg: Message, event: Event): void {
    event.stopPropagation();
    this.messageService.toggleStar(msg._id).subscribe(res => {
      msg.isStarred         = res.isStarred;
      this.msgStats.starred += res.isStarred ? 1 : -1;
    });
  }

  deleteMessage(id: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Delete this message?')) return;
    this.messageService.deleteMessage(id).subscribe(() => {
      const msg = this.messages.find(m => m._id === id);
      if (msg && !msg.isRead) this.msgStats.unread = Math.max(0, this.msgStats.unread - 1);
      this.messages       = this.messages.filter(m => m._id !== id);
      this.msgStats.total = Math.max(0, this.msgStats.total - 1);
      if (this.selectedMessage?._id === id) this.closeMessage();
    });
  }

  deleteReadMessages(): void {
    if (!confirm('Delete all read messages? This cannot be undone.')) return;
    this.messageService.deleteReadMessages().subscribe(res => {
      this.successMsg = res.message;
      this.loadMessages(); this.loadMsgStats(); this.closeMessage();
      setTimeout(() => this.successMsg = '', 3000);
    });
  }

  toggleUnreadFilter(): void {
    this.showUnreadOnly  = !this.showUnreadOnly;
    this.selectedMessage = null;
    this.loadMessages();
  }

  openReplyModal(): void {
    if (!this.selectedMessage) return;
    this.replySubject  = `Re: Your message to InkDrop`;
    this.replyBody     = '';
    this.replyError    = '';
    this.replySuccess  = '';
    this.showReplyModal = true;
  }

  closeReplyModal(): void {
    this.showReplyModal = false;
    this.replyBody      = '';
    this.replyError     = '';
    this.replySuccess   = '';
  }

  sendReply(): void {
    if (!this.replyBody.trim()) { this.replyError = 'Please write a reply message.'; return; }
    if (!this.selectedMessage)  return;
    this.replySending = true; this.replyError = '';
    this.messageService.sendReply(this.selectedMessage._id, this.replySubject, this.replyBody).subscribe({
      next: (res) => {
        this.replySending            = false;
        this.replySuccess            = res.message;
        this.selectedMessage!.isRead = true;
        setTimeout(() => {
          this.closeReplyModal();
          this.successMsg = `✓ ${res.message}`;
          setTimeout(() => this.successMsg = '', 4000);
        }, 2000);
      },
      error: (err) => {
        this.replySending = false;
        this.replyError   = err.error?.message || 'Failed to send email.';
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // ── Category CRUD (with Edit support) ─────────────────────
  // ══════════════════════════════════════════════════════════

  submitCategory(): void {
    if (this.categoryForm.invalid) return;
    this.postService.createCategory(this.categoryForm.value).subscribe({
      next: () => {
        this.successMsg = 'Category created!';
        this.categoryForm.reset({ icon: '📝', color: '#D4A853' });
        this.loadCategories();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed to create category.'; }
    });
  }

  /** Open inline edit form for a specific category */
  startEditCategory(cat: Category): void {
    // Close any other open edits first
    if (this.editingCategory && this.editingCategory._id === cat._id) {
      this.cancelEditCategory();
      return;
    }
    this.editingCategory = cat;
    this.editCategoryForm.patchValue({
      name:        cat.name,
      description: cat.description || '',
      icon:        cat.icon  || '📝',
      color:       cat.color || '#D4A853'
    });
    this.clearMessages();
  }

  /** Cancel edit without saving */
  cancelEditCategory(): void {
    this.editingCategory = null;
    this.editCategoryForm.reset({ icon: '📝', color: '#D4A853' });
  }

  /** Save the edited category via PUT */
  submitEditCategory(): void {
    if (!this.editingCategory || this.editCategoryForm.invalid) return;
    this.savingCategory = true;
    this.clearMessages();
    this.postService.updateCategory(this.editingCategory._id, this.editCategoryForm.value).subscribe({
      next: (res) => {
        this.savingCategory  = false;
        this.successMsg      = res.message;
        this.editingCategory = null;
        this.loadCategories();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.savingCategory = false;
        this.errorMsg       = err.error?.message || 'Failed to update category.';
      }
    });
  }

  deleteCategory(id: string): void {
    if (!confirm('Delete this category? Posts in this category will become uncategorised.')) return;
    this.postService.deleteCategory(id).subscribe({
      next: () => {
        if (this.editingCategory?._id === id) this.cancelEditCategory();
        this.loadCategories();
        this.successMsg = 'Category deleted.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Delete failed.'; }
    });
  }

  // ── Settings ───────────────────────────────────────────────
  loadSettings(): void {
    this.settingsLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        this.settingsLoading = false;
        if (data) {
          this.settingsForm.patchValue({
            twitter: data.twitter,
            linkedin: data.linkedin,
            github: data.github,
            email: data.email
          });
        }
      },
      error: (err) => {
        this.settingsLoading = false;
        this.errorMsg = err.error?.message || 'Failed to load settings';
      }
    });
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) return;
    this.settingsSaving = true;
    this.clearMessages();
    this.settingsService.updateSettings(this.settingsForm.value).subscribe({
      next: (res) => {
        this.settingsSaving = false;
        this.successMsg = res.message || 'Settings updated successfully!';
        setTimeout(() => this.successMsg = '', 5000);
      },
      error: (err) => {
        this.settingsSaving = false;
        this.errorMsg = err.error?.message || 'Failed to save settings';
        setTimeout(() => this.errorMsg = '', 5000);
      }
    });
  }

  // ── Tab ────────────────────────────────────────────────────
  switchTab(tab: AdminTab): void {
    if (!this.auth.isAdmin && ['categories', 'users', 'messages', 'settings'].includes(tab)) return;
    this.activeTab = tab;
    this.clearMessages();
    this.closeMessage();
    this.cancelEditCategory();   // always close any open category edit on tab switch

    if (tab === 'create') {
      this.editingPost = null; this.selectedFile = null; this.previewUrl = ''; this.removeCoverImage = false;
      this.postForm.reset({ status: 'draft' });
      if (this.categories.length === 0) this.loadCategories();
    }
    if (tab === 'overview')                               this.loadOverview();
    if (tab === 'users'    && this.users.length    === 0) this.loadUsers();
    if (tab === 'messages')                               this.loadMessages();
    if (tab === 'comments') { this.loadComments(); this.commentSearch = ''; this.commentFilter = 'all'; }
    if (tab === 'overview' && this.auth.isAdmin && !this.overviewStats) this.loadOverview();
    if (tab === 'overview' && this.auth.isAuthor) this.loadAuthorInsights();
    if (tab === 'settings')                               this.loadSettings();
  }


  // ── Post CRUD ──────────────────────────────────────────────
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile     = file;
      this.removeCoverImage = false;
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile     = null;
    this.previewUrl       = '';
    this.removeCoverImage = true;
    const input = document.getElementById('coverImageInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  submitPost(): void {
    if (this.postForm.invalid) { this.postForm.markAllAsTouched(); return; }
    this.saving = true; this.clearMessages();
    const { title, content, excerpt, category, tags, status } = this.postForm.value;
    const fd = new FormData();
    fd.append('title', title);   fd.append('content', content);
    fd.append('excerpt', excerpt || '');  fd.append('category', category || '');
    fd.append('tags', JSON.stringify(tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []));
    fd.append('status', status);
    if (this.selectedFile)     fd.append('coverImage', this.selectedFile);
    if (this.removeCoverImage) fd.append('removeCoverImage', 'true');
    const req = this.editingPost
      ? this.postService.updatePost(this.editingPost._id, fd)
      : this.postService.createPost(fd);
    req.subscribe({
      next: (res) => { this.successMsg = res.message; this.saving = false; this.loadPosts(); this.switchTab('posts'); setTimeout(() => this.successMsg = '', 4000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed to save post.'; this.saving = false; }
    });
  }

  editPost(post: Post): void {
    this.editingPost = post;
    this.postForm.patchValue({
      title: post.title, content: post.content, excerpt: post.excerpt,
      category: post.category?._id || '', tags: post.tags?.join(', ') || '', status: post.status
    });
    this.previewUrl = post.coverImage
      ? (post.coverImage.startsWith('http') ? post.coverImage : `${environment.imageUrl}${post.coverImage}`)
      : '';
    this.activeTab = 'create';
    if (this.categories.length === 0) this.loadCategories();
  }

  deletePost(id: string): void {
    if (!confirm('Delete this post?')) return;
    this.postService.deletePost(id).subscribe({
      next:  () => { this.loadPosts(); this.successMsg = 'Post deleted.'; setTimeout(() => this.successMsg = '', 3000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Delete failed.'; }
    });
  }

  // ── Users ──────────────────────────────────────────────────
  startEditRole(user: User): void  { this.editingUserId = user._id; this.editingUserRole = user.role; }
  cancelEditRole(): void            { this.editingUserId = null; this.editingUserRole = 'user'; }

  saveUserRole(userId: string): void {
    this.auth.updateUserRole(userId, this.editingUserRole).subscribe({
      next:  (res) => { this.successMsg = res.message; this.editingUserId = null; this.loadUsers(); setTimeout(() => this.successMsg = '', 3000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed to update role.'; }
    });
  }

  toggleUserStatus(userId: string): void {
    this.auth.toggleUserStatus(userId).subscribe({
      next:  (res) => { this.successMsg = res.message; this.loadUsers(); setTimeout(() => this.successMsg = '', 3000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed to update status.'; }
    });
  }

  deleteUser(userId: string, username: string): void {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    this.auth.deleteUser(userId).subscribe({
      next:  (res) => { this.successMsg = res.message; this.loadUsers(); setTimeout(() => this.successMsg = '', 3000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed to delete user.'; }
    });
  }

  goToPost(post: any): void { this.router.navigate(['/blog', post.slug]); }

  getImageUrl(path: string): string {
    if (!path) return 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=100&q=80';
    if (path.startsWith('http')) return path;
    return `${environment.imageUrl}${path}`;
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



  // ── Helpers ────────────────────────────────────────────────
  clearMessages(): void { this.errorMsg = ''; this.successMsg = ''; }

  formatNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(d: string): string {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  hasError(field: string): boolean {
    const c = this.postForm.get(field);
    return !!(c && c.invalid && c.touched);
  }

  getRoleIcon(role: string):       string { return ({ admin: '👑', author: '✍', user: '👤' } as any)[role]             || '👤'; }
  getRoleBadgeClass(role: string): string { return ({ admin: 'rb-admin', author: 'rb-author', user: 'rb-user' } as any)[role] || 'rb-user'; }

  getTopicColor(topic: string): string {
    const map: { [k: string]: string } = {
      'General Inquiry': '#3B8BD4', 'Write for Us': '#27AE60',
      'Advertise with Us': '#E67E22', 'Technical Issue': '#e74c3c',
      'Content Removal': '#9B59B6', 'Partnership': '#1ABC9C', 'Other': '#6B6055',
    };
    return map[topic] || '#6B6055';
  }
}