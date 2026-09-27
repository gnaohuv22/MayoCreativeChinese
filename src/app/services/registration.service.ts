import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistrationData {
  fullName: string;
  birthYear: string;
  phoneNumber: string;
  email: string;
  /** Khóa quan tâm — khi đăng ký từ trang khóa học */
  course?: string;
  /** 'online' | 'offline' | 'undecided' */
  studyMode?: string;
  /** 'register' | 'trial' */
  intent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private readonly http = inject(HttpClient);

  /**
   * Configure the target endpoint URL here.
   * - For Option 1 (Google Apps Script Web App): Paste the deployed Web App URL below.
   * - For Option 2 (GCP Service Account Serverless Proxy): Set to '/api/register'.
   */
  private readonly endpoint = 'https://script.google.com/macros/s/AKfycbyMRpwVWGaXYgj4x7qNkJWkph1xdorxXGBm3Vda3yuuzBtPikuQwrF_0mQjp4Kx35Fp/exec';

  register(data: RegistrationData): Observable<any> {
    // We format data as form urlencoded. This avoids CORS preflight (OPTIONS) triggers in browsers.
    const body = new HttpParams()
      .set('fullName', data.fullName)
      .set('birthYear', data.birthYear)
      .set('phoneNumber', data.phoneNumber)
      .set('email', data.email)
      // Cột mới (Apps Script cần ghi thêm các trường này): khóa quan tâm, hình thức, loại đăng ký
      .set('course', data.course ?? '')
      .set('studyMode', data.studyMode ?? '')
      .set('intent', data.intent ?? 'register')
      .set('securityKey', 'mcc_secret_token_2026_xyz');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(this.endpoint, body.toString(), { headers });
  }
}
