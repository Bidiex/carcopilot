import React from 'react';
import ReactECharts from 'echarts-for-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { Users, Star, Car, Percent } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function Dashboard() {
  const {
    totalUsers,
    premiumUsers,
    totalVehicles,
    conversionRate,
    growthData,
    planDistribution,
    loading
  } = useDashboardMetrics();

  // Growth line chart options
  const growthChartOptions = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: growthData.map(d => d.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Nuevos Usuarios',
        type: 'line',
        smooth: true,
        data: growthData.map(d => d.count),
        itemStyle: { color: '#0ea5e9' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(14, 165, 233, 0.5)' },
              { offset: 1, color: 'rgba(14, 165, 233, 0)' }
            ]
          }
        }
      }
    ]
  };

  // Plan distribution donut chart options
  const planChartOptions = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: 'Distribución por Plan',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: planDistribution.map(d => ({
          value: d.value,
          name: d.name,
          // Custom colors: e.g. Free is gray/light blue, Pro is brand color
          itemStyle: { color: d.name === 'Pro' ? '#3b82f6' : d.name === 'Free' ? '#cbd5e1' : '#f59e0b' }
        }))
      }
    ]
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Métricas de Producto</h2>
        <p className="text-gray-500">Resumen del estado y crecimiento de CarCopilot.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalUsers}</h3>
              </div>
            </Card>

            <Card className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                <Star size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Usuarios Premium</p>
                <h3 className="text-2xl font-bold text-gray-900">{premiumUsers}</h3>
              </div>
            </Card>

            <Card className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <Percent size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tasa Conversión</p>
                <h3 className="text-2xl font-bold text-gray-900">{conversionRate}%</h3>
              </div>
            </Card>

            <Card className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                <Car size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Vehículos Registrados</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalVehicles}</h3>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento Mensual</h3>
              {growthData.length > 0 ? (
                <ReactECharts option={growthChartOptions} style={{ height: '350px', width: '100%' }} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">Sin datos de crecimiento</div>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Plan</h3>
              {planDistribution.length > 0 ? (
                <ReactECharts option={planChartOptions} style={{ height: '350px', width: '100%' }} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">Sin datos de planes</div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
