import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, Renderer2, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart } from 'chart.js'; // Import Chart class and other necessary types
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  AvatarComponent,
  ButtonDirective,
  ButtonGroupComponent,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  ProgressBarDirective,
  ProgressComponent,
  RowComponent,
  TableDirective,
  TextColorDirective
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDropdownComponent } from '../widgets/widgets-dropdown/widgets-dropdown.component';
import { DashboardChartsData, IChartProps } from './dashboard-charts-data';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface IChartWithMaxValue extends IChartProps {
  maxValue: number; // Add maxValue as a property
  time: string; // Add time as a property
}

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    WidgetsDropdownComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent,
    ButtonDirective,
    ReactiveFormsModule,
    ButtonGroupComponent,
    ChartjsComponent,
    CardFooterComponent,
    ProgressBarDirective,
    ProgressComponent,
    WidgetsBrandComponent,
    CardHeaderComponent,
    TableDirective,
    AvatarComponent
  ]
})
export class DashboardComponent implements OnInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #document: Document = inject(DOCUMENT);
  readonly #renderer: Renderer2 = inject(Renderer2);
  readonly #chartsData: DashboardChartsData = inject(DashboardChartsData);

  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  public chart: Array<IChartProps> = [];
  public trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Month')
  });

  public displayedCharts: Array<IChartWithMaxValue> = [];
  private autoAppendCharts: boolean = false; // Boolean variable for automatic chart addition
  private savePath: string | null = null; // To store the selected directory path

  ngOnInit(): void {
    this.initCharts();
    Chart.register(zoomPlugin); // Register zoom plugin

    // Set interval to check the boolean variable every 1 second
    setInterval(() => {
      this.checkAndAppendChart();
    }, 1000); // 1-second interval
  }

  initCharts(): void {
    // Initial chart setup logic if needed
  }

  resetZoom(): void {
    this.mainChartRef.set(undefined);
    this.initCharts();
  }

  setTrafficPeriod(value: string): void {
    this.trafficRadioGroup.setValue({ trafficRadio: value });
    this.#chartsData.initMainChart(value);
    this.initCharts();
  }

  handleChartRef($chartRef: any) {
    if ($chartRef) {
      this.mainChartRef.set($chartRef);
    }
  }

  addChart(): void {
    const singleDataSet = [
      10, 15, 12, 9, 8, 20, 25, 30, 18, 14, 22, 19, 15, 12, 10,
      25, 20, 9, 18, 14, 22, 8, 30, 12, 19, 9, 15, 25, 8, 20, 18,
      10, 14, 30, 22, 12, 25, 19, 10, 9, 8, 20, 30, 15, 22, 14, 9,
      18, 19, 10, 12, 8, 25, 30, 15, 22, 9, 20, 14, 18, 10, 25, 30,
      19, 15, 12, 9, 8, 20, 14, 25, 18, 22, 9, 10, 15, 19, 30, 8,
      12, 18, 22, 9, 20, 10, 14, 30, 25, 19, 12, 9, 15, 8, 22, 20, 18,
    ];
    
    const chartData = {
      ...this.#chartsData.initMainChart('Month', singleDataSet),
      options: {
        ...this.#chartsData.initMainChart('Month', singleDataSet).options,
        scales: {
          y: {
            min: 0,
            max: Math.max(...singleDataSet) * 1.1,
          },
        },
      },
    };

    if (chartData.data && chartData.data.datasets && chartData.data.datasets.length > 0) {
      const dataset = chartData.data.datasets[0].data as (number | null)[]; 
      const maxValue = this.getMaxValue(dataset);
      const currentTime = new Date().toLocaleTimeString();

      this.displayedCharts.push({
        ...chartData,
        maxValue: maxValue,
        time: currentTime
      });
    } else {
      console.error("Chart data or datasets are undefined.");
    }
  }

  getMaxValue(dataSet: (number | null)[]): number {
    const numericValues = dataSet.filter((value): value is number => value !== null);
    return numericValues.length > 0 ? Math.max(...numericValues) : 0;
  }

  toggleAutoAppendCharts(value: boolean): void {
    this.autoAppendCharts = value;
  }

  checkAndAppendChart(): void {
    if (this.autoAppendCharts) {
      this.addChart();
    }
  }

  deleteCharts(): void {
    this.displayedCharts = [];
  }

  // Method to trigger directory selection
  selectDirectory(): void {
    const directoryInput = document.getElementById('directoryInput') as HTMLInputElement;
    directoryInput.click(); // Trigger the input click to open the file dialog
  }

  // Method to handle the directory selection
  onDirectorySelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      // Get the path of the first file in the selected directory
      this.savePath = files[0].webkitRelativePath.split('/')[0]; // Get the directory name from the file path
      console.log('Selected directory:', this.savePath);
    }
  }

  exportExcel(): void {
    const excelData = this.displayedCharts.map((chartData, index) => ({
      CYCLE: index + 1,
      'PEAK FORCE': chartData.maxValue,
      TIME: chartData.time // Use the stored time for each chart
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Charts Data');
  
    // Save to selected path or default to current directory
    const fileName = this.savePath ? `${this.savePath}/charts_data.xlsx` : 'charts_data.xlsx';
    XLSX.writeFile(workbook, fileName);
  }

  saveChartAsImage(): void {
    if (this.displayedCharts.length > 0) {
      const lastChartElement = document.querySelector('.chart-item:last-child') as HTMLElement;
  
      if (lastChartElement) {
        html2canvas(lastChartElement).then(canvas => {
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png'); // Convert canvas to image URL
          const fileName = this.savePath ? `${this.savePath}/chart_image.png` : 'chart_image.png';
          link.download = fileName; // Default file name for the image
          document.body.appendChild(link); // Append link to the body
          link.click(); // This triggers the save dialog
          document.body.removeChild(link); // Remove link from document after click
        });
      } else {
        console.error("Last chart element not found.");
      }
    } else {
      console.error("No charts to save.");
    }
  }
}
