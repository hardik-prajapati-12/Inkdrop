// src/app/services/settings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Settings } from '../models';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(this.api);
  }

  updateSettings(settings: Settings): Observable<{ message: string; settings: Settings }> {
    return this.http.put<{ message: string; settings: Settings }>(this.api, settings);
  }
}
