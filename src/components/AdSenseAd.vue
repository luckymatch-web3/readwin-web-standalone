<template>
  <div class="adsense-ad" :class="size">
    <!-- AdSense广告容器 -->
    <div v-if="showAd">
      <ins class="adsbygoogle"
           :style="adStyle"
           data-ad-client="ca-pub-8148693514304068"
           :data-ad-slot="adSlot"
           :data-ad-format="adFormat"
           :data-full-width-responsive="fullWidthResponsive"></ins>
    </div>
    <!-- 占位符（当广告被屏蔽或未加载时显示） -->
    <div v-else class="ad-placeholder" :style="placeholderStyle">
      <div class="placeholder-content">
        <span class="ad-label">Advertisement</span>
        <div class="placeholder-text">Support us by viewing ads</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Props {
  adSlot?: string
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  size?: 'small' | 'medium' | 'large' | 'leaderboard'
  width?: string
  height?: string
  fullWidthResponsive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  adSlot: '1533988493',
  adFormat: 'auto',
  size: 'medium',
  width: '',
  height: '',
  fullWidthResponsive: true
})

const showAd = ref(true)
const adLoaded = ref(false)

// 根据size设置默认尺寸
const adStyle = computed(() => {
  const style: any = {
    display: 'block',
    textAlign: 'center'
  }
  
  if (props.width) style.width = props.width
  if (props.height) style.height = props.height
  
  // 如果没有指定尺寸，根据size设置默认
  if (!props.width && !props.height) {
    switch (props.size) {
      case 'small':
        style.width = '300px'
        style.height = '250px'
        break
      case 'medium':
        style.width = '728px'
        style.height = '90px'
        break
      case 'large':
        style.width = '970px'
        style.height = '250px'
        break
      case 'leaderboard':
        style.width = '728px'
        style.height = '90px'
        break
      default:
        style.width = '728px'
        style.height = '90px'
    }
  }
  
  return style
})

const placeholderStyle = computed(() => {
  return {
    width: adStyle.value.width || '728px',
    height: adStyle.value.height || '90px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  }
})

// 加载AdSense广告
const loadAd = () => {
  if (typeof (window as any).adsbygoogle === 'undefined') {
    console.warn('AdSense script not loaded')
    showAd.value = false
    return
  }

  try {
    // 等待一小段时间确保adsbygoogle已加载
    setTimeout(() => {
      if ((window as any).adsbygoogle && !adLoaded.value) {
        ;(window as any).adsbygoogle.push({})
        adLoaded.value = true
        console.log('AdSense ad loaded')
      }
    }, 100)
  } catch (error) {
    console.error('Error loading AdSense ad:', error)
    showAd.value = false
  }
}

// 检测广告是否被屏蔽
const checkAdBlock = () => {
  const testAd = document.createElement('div')
  testAd.className = 'adsbygoogle'
  testAd.style.cssText = 'height:1px!important;width:1px!important;position:absolute!important;left:-10000px!important;top:-1000px!important;'
  document.body.appendChild(testAd)
  
  setTimeout(() => {
    const blocked = testAd.offsetHeight === 0 || 
                    testAd.offsetWidth === 0 || 
                    testAd.style.display === 'none'
    if (blocked) {
      console.log('Ad blocker detected')
      showAd.value = false
    } else {
      loadAd()
    }
    document.body.removeChild(testAd)
  }, 100)
}

onMounted(() => {
  // 检查AdSense脚本是否已加载
  if (typeof (window as any).adsbygoogle === 'undefined') {
    // 如果未加载，等待脚本加载
    const checkScript = setInterval(() => {
      if (typeof (window as any).adsbygoogle !== 'undefined') {
        clearInterval(checkScript)
        checkAdBlock()
      }
    }, 100)
    
    // 10秒后超时
    setTimeout(() => {
      clearInterval(checkScript)
      if (typeof (window as any).adsbygoogle === 'undefined') {
        console.warn('AdSense script failed to load')
        showAd.value = false
      }
    }, 10000)
  } else {
    checkAdBlock()
  }
})

onUnmounted(() => {
  // 清理
  showAd.value = false
})
</script>

<style scoped>
.adsense-ad {
  margin: 20px auto;
  text-align: center;
}

.ad-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ad-label {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.placeholder-text {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .adsense-ad.medium,
  .adsense-ad.large,
  .adsense-ad.leaderboard {
    width: 100% !important;
    max-width: 320px;
  }
  
  .ad-placeholder {
    width: 100% !important;
    max-width: 320px;
    height: 100px !important;
  }
}
</style>