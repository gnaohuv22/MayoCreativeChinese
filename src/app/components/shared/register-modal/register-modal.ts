import { Component, inject, signal, computed, effect } from '@angular/core';
import { RegisterModalService } from '../../../services/register-modal.service';
import { RegistrationService } from '../../../services/registration.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-register-modal',
  imports: [],
  templateUrl: './register-modal.html',
  host: {
    '(document:keydown.escape)': 'onEscapeKey()'
  }
})
export class RegisterModalComponent {
  protected readonly modalService = inject(RegisterModalService);
  private readonly registrationService = inject(RegistrationService);
  protected readonly i18n = inject(I18nService);

  // Form Field Signals
  readonly fullName = signal('');
  readonly birthYear = signal('');
  readonly phoneNumber = signal('');
  readonly email = signal('');

  // Touched States
  readonly fullNameTouched = signal(false);
  readonly birthYearTouched = signal(false);
  readonly phoneNumberTouched = signal(false);
  readonly emailTouched = signal(false);

  // Submission States
  readonly isSubmitting = signal(false);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Dynamically populated birth years (from 1940 to 2026)
  readonly currentYear = 2026;
  readonly years: number[] = [];

  constructor() {
    for (let year = this.currentYear; year >= 1940; year--) {
      this.years.push(year);
    }

    // Reset form when modal opens
    effect(() => {
      if (this.modalService.isOpen()) {
        this.resetForm();
      }
    });
  }

  // Field Validation Rules
  readonly isFullNameValid = computed(() => {
    return this.fullName().trim().length >= 2;
  });

  readonly isBirthYearValid = computed(() => {
    const y = parseInt(this.birthYear(), 10);
    return !isNaN(y) && y >= 1940 && y <= this.currentYear;
  });

  readonly isPhoneNumberValid = computed(() => {
    const phone = this.phoneNumber().trim();
    // Validates standard Vietnamese phone formats (starts with 0 or +84, followed by 9 digits)
    return /^(0|\+84)[35789]\d{8}$/.test(phone);
  });

  readonly isEmailValid = computed(() => {
    const e = this.email().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  });

  // Derived Form Validity State
  readonly isFormValid = computed(() => {
    return (
      this.isFullNameValid() &&
      this.isBirthYearValid() &&
      this.isPhoneNumberValid() &&
      this.isEmailValid()
    );
  });

  // Handle value changes
  onInputChange(field: 'fullName' | 'phoneNumber' | 'email', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'fullName') this.fullName.set(value);
    if (field === 'phoneNumber') this.phoneNumber.set(value);
    if (field === 'email') this.email.set(value);
  }

  onSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.birthYear.set(value);
  }

  // Touch triggers
  markTouched(field: 'fullName' | 'birthYear' | 'phoneNumber' | 'email'): void {
    if (field === 'fullName') this.fullNameTouched.set(true);
    if (field === 'birthYear') this.birthYearTouched.set(true);
    if (field === 'phoneNumber') this.phoneNumberTouched.set(true);
    if (field === 'email') this.emailTouched.set(true);
  }

  // Submission
  onSubmit(event: Event): void {
    event.preventDefault();

    // Mark all as touched to display errors if any
    this.fullNameTouched.set(true);
    this.birthYearTouched.set(true);
    this.phoneNumberTouched.set(true);
    this.emailTouched.set(true);

    if (!this.isFormValid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.registrationService.register({
      fullName: this.fullName(),
      birthYear: this.birthYear(),
      phoneNumber: this.phoneNumber(),
      email: this.email()
    }).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        console.error('Registration failed:', err);
        this.isSubmitting.set(false);
        
        // Note: For Google Apps Script redirect behavior, sometimes a status of 0 or CORS block error is returned
        // even though Google Sheet has successfully recorded the data. We handle this case gracefully.
        if (err.status === 0 || err.status === 200) {
          // Typically successfully written since sheet responds to POST via redirect
          this.isSuccess.set(true);
        } else {
          this.errorMessage.set(this.i18n.translate()('register.error_msg'));
        }
      }
    });
  }

  // Reset form helper
  resetForm(): void {
    this.fullName.set('');
    this.birthYear.set('');
    this.phoneNumber.set('');
    this.email.set('');
    this.fullNameTouched.set(false);
    this.birthYearTouched.set(false);
    this.phoneNumberTouched.set(false);
    this.emailTouched.set(false);
    this.isSubmitting.set(false);
    this.isSuccess.set(false);
    this.errorMessage.set(null);
  }

  // Close modal
  closeModal(): void {
    this.modalService.close();
  }

  // Event handlers
  onEscapeKey(): void {
    if (this.modalService.isOpen()) {
      this.closeModal();
    }
  }
}
