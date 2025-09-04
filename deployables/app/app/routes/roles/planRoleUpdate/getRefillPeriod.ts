import { AllowanceInterval } from '@zodiac/schema'

export const getRefillPeriod = (interval: AllowanceInterval): bigint => {
  switch (interval) {
    case AllowanceInterval.Daily: {
      return 24n * 60n * 60n
    }
    case AllowanceInterval.Weekly: {
      return getRefillPeriod(AllowanceInterval.Daily) * 7n
    }
    case AllowanceInterval.Monthly: {
      return getRefillPeriod(AllowanceInterval.Daily) * 30n
    }
    case AllowanceInterval.Quarterly: {
      return getRefillPeriod(AllowanceInterval.Yearly) / 4n
    }
    case AllowanceInterval.Yearly: {
      return getRefillPeriod(AllowanceInterval.Daily) * 365n
    }
  }
}

export const parseRefillPeriod = (
  period: bigint,
): AllowanceInterval | bigint => {
  switch (period) {
    case getRefillPeriod(AllowanceInterval.Daily):
      return AllowanceInterval.Daily
    case getRefillPeriod(AllowanceInterval.Weekly):
      return AllowanceInterval.Weekly
    case getRefillPeriod(AllowanceInterval.Monthly):
      return AllowanceInterval.Monthly
    case getRefillPeriod(AllowanceInterval.Quarterly):
      return AllowanceInterval.Quarterly
    case getRefillPeriod(AllowanceInterval.Yearly):
      return AllowanceInterval.Yearly

    default:
      return period
  }
}
