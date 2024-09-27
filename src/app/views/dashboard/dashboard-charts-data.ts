import { Injectable } from '@angular/core';
import {
  ChartData,
  ChartDataset,
  ChartOptions,
  ChartType,
  PluginOptionsByType,
  ScaleOptions,
  TooltipLabelStyle
} from 'chart.js';
import { DeepPartial } from 'chart.js/dist/types/utils';
import { getStyle, hexToRgba } from '@coreui/utils';

export interface IChartProps {
  data?: ChartData;
  labels?: any;
  options?: ChartOptions;
  colors?: any;
  type: ChartType;
  legend?: false;

  [propName: string]: any;
}

@Injectable({
  providedIn: 'any'
})
export class DashboardChartsData {
  constructor() {
    this.initMainChart();
  }

  public mainChart: IChartProps = { type: 'line' };

  public random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  initMainChart(period: string = 'Month', customData: number[] = []): IChartProps {
    const brandInfo = getStyle('--cui-info') ?? '#20a8d8';
    const brandInfoBg = hexToRgba(brandInfo, 10);
  
    // Use custom data if provided, otherwise default to random data
    const data = customData.length ? customData : Array(12).fill(0).map(() => this.random(10, 30));
  
    const datasets: ChartDataset[] = [
      {
        data,
        label: '',
        backgroundColor: brandInfoBg,
        borderColor: brandInfo,
        pointHoverBackgroundColor: brandInfo,
        borderWidth: 2,
        fill: false
      }
    ];
  
    const labels = [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
      '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
      '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
      '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
      '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
      '61', '62', '63', '64', '65', '66', '67', '68', '69', '70',
      '71', '72', '73', '74', '75', '76', '77', '78', '79', '80',
      '81', '82', '83', '84', '85', '86', '87', '88', '89', '90',
      '91', '92', '93', '94', '95', '96', '97', '98', '99', '100',
    ];
  
    const scales = this.getScales();

    const plugins: DeepPartial<PluginOptionsByType<any>> = {

      legend: {
        display: false // Hide the legend (annotation)
      },
      tooltip: {
        enabled: false,
        // callbacks: {
        //   labelColor: (context) => ({ backgroundColor: context.dataset.borderColor } as TooltipLabelStyle)
        // }
      },
      

    };
  
    const options: ChartOptions = {
      maintainAspectRatio: false,
      plugins,
      scales,
      elements: {
        line: {
          tension: 0.4
        },
        point: {
          radius: 0,
          hitRadius: 10,
          hoverRadius: 4,
          hoverBorderWidth: 3
        }
      }
    };
  
    return {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options
    };
  }
  

  getScales() {
    const colorBorderTranslucent = getStyle('--cui-border-color-translucent');
    const colorBody = getStyle('--cui-body-color');
  
    const scales: ScaleOptions<any> = {
      x: {
        grid: {
          color: colorBorderTranslucent,
          drawOnChartArea: false
        },
        ticks: {
          color: colorBody
        }
      },
      y: {
        border: {
          color: colorBorderTranslucent
        },
        grid: {
          color: colorBorderTranslucent
        },
        beginAtZero: true, // Ensures y-axis starts at 0
        ticks: {
          color: colorBody,
          // Explicitly define the 'value' type as 'number'
          callback: (value: number) => value.toString() // Display values directly as is
        }
      }
    };

    return scales;
  }
  
  
}
