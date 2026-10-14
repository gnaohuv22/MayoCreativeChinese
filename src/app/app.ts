import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/shared/toast/toast';
import { AdminDockComponent } from './components/shared/admin-dock/admin-dock';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, AdminDockComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
