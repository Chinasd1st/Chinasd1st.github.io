<template>
  <div class="countdown-to-date">
      距 {{ targetDate }} 还有 {{ formattedDays }}{{ formattedTime }}
  </div>
</template>

<script>
export default {
  name: 'CountdownToDate',
  data() {
    return {
      // 设置目标日期和时间，注意月份从0开始计数（10月对应9）
      targetDate: '2025-10-18',
      targetTime: new Date('2025-10-18').getTime(), // 目标时间的时间戳
      now: Date.now(), // 当前时间的时间戳
      timer: null // 定时器对象
    }
  },
  computed: {
    // 计算剩余时间对象
    timeLeft() {
      const diff = this.targetTime - this.now
      if (diff <= 0) {
        return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
      }
      return {
        total: diff,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      }
    },
    // 格式化天数显示
    formattedDays() {
      return this.timeLeft.days > 0 ? `${this.timeLeft.days}天` : ''
    },
    // 格式化时间显示（小时:分钟:秒）
    formattedTime() {
      const h = String(this.timeLeft.hours).padStart(2, '0')
      const m = String(this.timeLeft.minutes).padStart(2, '0')
      const s = String(this.timeLeft.seconds).padStart(2, '0')
      return `${h}:${m}:${s}`
    }
  },
  mounted() {
    // 组件挂载后启动定时器，每秒更新一次
    this.timer = setInterval(() => {
      this.now = Date.now()
    }, 1000)
  },
  beforeDestroy() {
    // 组件销毁前清除定时器，防止内存泄漏
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
</script>

<style scoped>
.countdown-to-date {
  font-weight: bold;
  /* 可根据需要添加更多样式 */
}
</style>