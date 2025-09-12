import { format } from 'date-fns'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface MessariChartData {
  citationId: number
  entities: Array<{ entityType: string; entityId: string }>
  dataset: string
  metric: string
  start: string
  end: string
  tier: string
  granularity: string
  metricTimeseries: {
    point_schema: Array<{
      id: string
      name: string
      slug: string
      description: string
      is_timestamp: boolean
      format: string
    }>
    series: Array<{
      key: string
      entity: { id: string; name: string; symbol: string; slug: string }
      points: Array<Array<number>>
    }>
  }
}

interface MessariChartProps {
  chartData: MessariChartData
  index: number
  /** If you still see loops in dev, set this false to fully disable animation. */
  allowAnimation?: boolean
}

const MessariChartImpl = ({
  chartData,
  index,
  allowAnimation = true,
}: MessariChartProps) => {
  const seriesItem = chartData.metricTimeseries.series[0]

  const meta = useMemo(() => {
    const entityName = seriesItem?.entity?.name ?? 'Asset'
    const entitySymbol = seriesItem?.entity?.symbol ?? ''
    const metricName =
      chartData.metric.charAt(0).toUpperCase() + chartData.metric.slice(1)
    return { entityName, entitySymbol, metricName }
  }, [seriesItem, chartData.metric])

  const transformedData = useMemo(() => {
    if (!seriesItem?.points?.length) return []
    return seriesItem.points.map((point) => {
      const timestamp = point[0] // seconds
      const open = Number(point[1]) || 0
      const high = Number(point[2]) || 0
      const low = Number(point[3]) || 0
      const close = Number(point[4]) || 0
      const volume = Number(point[5]) || 0
      return {
        timestamp,
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
        value: close,
      }
    })
  }, [seriesItem])

  const { minPrice, maxPrice, padding } = useMemo(() => {
    const prices = transformedData.map((d) => d.value).filter((v) => v > 0)
    if (prices.length === 0) return { minPrice: 0, maxPrice: 1, padding: 0.05 }
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = Math.max(max - min, 1e-9)
    return { minPrice: min, maxPrice: max, padding: range * 0.05 }
  }, [transformedData])

  // Gate animation to a single mount-only run (prevents restarts on parent renders)
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    if (allowAnimation) setAnimate(true)
  }, [allowAnimation])

  const xTickFormatter = useCallback((value: string) => {
    // value is ISO yyyy-mm-dd we built above
    const date = new Date(value)
    return isNaN(date.getTime()) ? value : format(date, 'MMM dd')
  }, [])

  const yTickFormatter = useCallback((value: number) => {
    return `$${Number(value).toLocaleString()}`
  }, [])

  const tooltipFormatter = useCallback(
    (value: number) => {
      return [
        Number(value).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        meta.metricName,
      ] as [string, string]
    },
    [meta.metricName],
  )

  if (!transformedData.length) {
    return (
      <div className="my-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200 sm:h-80" />
        <div className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
          No data
        </div>
      </div>
    )
  }

  const startDate = format(
    new Date(transformedData[0].timestamp * 1000),
    'MMM dd, yyyy',
  )
  const endDate = format(
    new Date(transformedData[transformedData.length - 1].timestamp * 1000),
    'MMM dd, yyyy',
  )

  return (
    <div className="my-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col sm:flex-col sm:items-center sm:justify-between">
        <h4 className="mb-1 text-sm font-semibold text-gray-800 sm:mb-0">
          {meta.entityName} ({meta.entitySymbol}) {meta.metricName}
        </h4>
        <div className="text-xs text-gray-600">
          {startDate} - {endDate}
          <span className="ml-2 text-gray-500">
            ({transformedData.length} days)
          </span>
        </div>
      </div>

      <div className="h-64 w-full sm:h-80">
        {/* debounce to avoid resize thrash in ResponsiveContainer */}
        <ResponsiveContainer width="100%" height="100%" debounce={150}>
          <LineChart
            data={transformedData}
            margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="#666"
              interval="preserveStartEnd"
              tickFormatter={xTickFormatter}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="#666"
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              formatter={tooltipFormatter as any}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#374151"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#374151', strokeWidth: 2 }}
              isAnimationActive={animate}
              animationBegin={300}
              animationDuration={700}
              animationEasing="ease-out"
              // prevent animation restart if parent re-renders
              animationId={index}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-col justify-between border-t border-gray-100 pt-2 text-xs text-gray-500 sm:flex-row sm:items-center">
        <span>Data: {chartData.dataset}</span>
        <span className="mt-1 sm:mt-0">
          Granularity: {chartData.granularity}
        </span>
      </div>
    </div>
  )
}

export const MessariChart = memo(MessariChartImpl, (prev, next) => {
  // Only re-render if the data actually changed
  if (prev.index !== next.index) return false
  if (prev.allowAnimation !== next.allowAnimation) return false
  // Shallow-ish compare of chartData.series[0].points length + last value
  const p0 = prev.chartData.metricTimeseries.series[0]
  const n0 = next.chartData.metricTimeseries.series[0]
  const lp = p0?.points?.length ?? 0
  const ln = n0?.points?.length ?? 0
  if (lp !== ln) return false
  if (lp && ln) {
    const lastP = p0.points[lp - 1]?.[4]
    const lastN = n0.points[ln - 1]?.[4]
    if (lastP !== lastN) return false
  }
  return true
})
