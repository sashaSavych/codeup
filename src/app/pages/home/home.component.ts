import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'cu-home',
  standalone: true,
  imports: [ButtonModule, CardModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
