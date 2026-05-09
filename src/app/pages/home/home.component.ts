import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'cu-home',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
