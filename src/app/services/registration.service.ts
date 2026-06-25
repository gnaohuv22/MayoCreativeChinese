import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistrationData {
  fullName: string;
  birthYear: string;
  phoneNumber: string;
  email: string;
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
      .set('securityKey', 'mcc_secret_token_2026_xyz');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(this.endpoint, body.toString(), { headers });
  }
}
