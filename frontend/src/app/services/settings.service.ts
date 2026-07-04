// src/app/services/settings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Settings } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = 'http://localhost:5000/api/settings';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(this.api);
  }

  updateSettings(settings: Settings): Observable<{ message: string; settings: Settings }> {
    return this.http.put<{ message: string; settings: Settings }>(this.api, settings);
  }
}
