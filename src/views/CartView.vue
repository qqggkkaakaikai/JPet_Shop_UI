<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ShopHeader from '@/components/ShopHeader.vue'
import ShopNav from '@/components/ShopNav.vue'
import { getImagePath } from '@/utils/imagePath'
import { cartApi } from '@/api'
import { calculateCartItemPrice, calculateTotal, calculateTotalQuantity } from '@/utils/productPrice'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'
import { useAuthStore } from '@/stores/auth'
import { useCartBadgeStore } from '@/stores/cartBadge'

import '@/styles/legacy/common.css'
import '@/styles/legacy/cart.css'

const router = useRouter()
const auth = useAuthStore()
const cartBadge = useCartBadgeStore()

const currentCartItems = ref([])
/** @type {import('vue').Ref<number[]>} */
const selectedCartItemIds = ref([])
let selectionInitialized = false

function isItemSelected(id) {
  return selectedCartItemIds.value.includes(Number(id))
}

const loading = ref(true)

async function loadCartItems() {
  if (!auth.user?.id) {
    router.push('/login')
    return
  }
  loading.value = true
  try {
    const items = await cartApi.listUnpurchased(auth.user.id)
    currentCartItems.value = Array.isArray(items) ? items : []
    if (currentCartItems.value.length === 0) {
      selectedCartItemIds.value = []
      selectionInitialized = false
    } else {
      syncSelectionWithCart()
      if (!selectionInitialized) {
        selectedCartItemIds.value = currentCartItems.value.map((item) => Number(item.id))
        selectionInitialized = true
      }
    }
  } catch (e) {
    alert(e.message || '获取购物车失败，请稍后再试')
    currentCartItems.value = []
  } finally {
    loading.value = false
    await cartBadge.refresh()
  }
}

function syncSelectionWithCart() {
  const validIds = new Set(currentCartItems.value.map((item) => Number(item.id)))
  selectedCartItemIds.value = selectedCartItemIds.value.filter((id) => validIds.has(id))
}

function toggleSelectItem(cartItemId, checked) {
  const id = Number(cartItemId)
  if (checked) {
    if (!selectedCartItemIds.value.includes(id)) {
      selectedCartItemIds.value = [...selectedCartItemIds.value, id]
    }
  } else {
    selectedCartItemIds.value = selectedCartItemIds.value.filter((x) => x !== id)
  }
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedCartItemIds.value = currentCartItems.value.map((item) => Number(item.id))
  } else {
    selectedCartItemIds.value = []
  }
}

const selectAllState = computed(() => {
  const n = currentCartItems.value.length
  const s = selectedCartItemIds.value.length
  if (n === 0) return { checked: false, indeterminate: false, disabled: true }
  return {
    checked: s > 0 && s === n,
    indeterminate: s > 0 && s < n,
    disabled: false,
  }
})

const selectAllRef = ref(null)
watch(
  [selectAllState, currentCartItems],
  async () => {
    await nextTick()
    const el = selectAllRef.value
    if (el) el.indeterminate = selectAllState.value.indeterminate
  },
  { deep: true },
)

const totalItems = computed(() => calculateTotalQuantity(currentCartItems.value))
const totalAmount = computed(() => calculateTotal(currentCartItems.value))

const selectedItemsList = computed(() =>
  currentCartItems.value.filter((item) => selectedCartItemIds.value.includes(Number(item.id))),
)

const selectedQuantity = computed(() => calculateTotalQuantity(selectedItemsList.value))
const selectedAmount = computed(() => calculateTotal(selectedItemsList.value))

async function changeItemQuantity(cartItemId, delta, currentQuantity) {
  const nextQuantity = currentQuantity + delta
  if (nextQuantity <= 0) {
    await removeItem(cartItemId)
    return
  }
  try {
    await cartApi.updateQuantity(cartItemId, nextQuantity)
    await loadCartItems()
  } catch (e) {
    alert(e.message || '更新数量失败')
  }
}

async function removeItem(cartItemId) {
  if (!confirm('确定要删除该商品吗？')) return
  try {
    await cartApi.remove(cartItemId)
    await loadCartItems()
  } catch (e) {
    alert(e.message || '删除失败')
  }
}

async function clearCart() {
  if (!confirm('确定要清空购物车吗？')) return
  const ids = currentCartItems.value.map((item) => item.id)
  await Promise.all(ids.map((id) => cartApi.remove(id).catch(() => null)))
  await loadCartItems()
}

const orderModalOpen = ref(false)
const currentOrderItems = ref([])
const currentOrderTab = ref(0)
const receiverName = ref('')
const receiverPhone = ref('')
const receiverAddress = ref('')
const paymentMethod = ref('alipay')

function openOrderModal() {
  if (currentCartItems.value.length === 0) {
    alert('购物车是空的！')
    return
  }
  const itemsToPurchase = selectedItemsList.value
  if (!itemsToPurchase.length) {
    alert('请选择要购买的商品')
    return
  }
  currentOrderItems.value = itemsToPurchase
  currentOrderTab.value = 0
  loadOrderData()
  orderModalOpen.value = true
  lockBodyScroll()
}

function closeOrderModal() {
  orderModalOpen.value = false
  unlockBodyScroll()
}

const summaryTick = ref(0)

function switchOrderTab(tabIndex) {
  currentOrderTab.value = tabIndex
  if (tabIndex === 2) summaryTick.value += 1
}

function saveOrderStep(stepIndex) {
  try {
    const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}')
    if (stepIndex === 0) {
      if (!receiverName.value || !receiverPhone.value || !receiverAddress.value) {
        alert('请填写完整的收货地址信息')
        return false
      }
      orderData.address = {
        name: receiverName.value,
        phone: receiverPhone.value,
        address: receiverAddress.value,
      }
    } else if (stepIndex === 1) {
      orderData.paymentMethod = paymentMethod.value
    }
    sessionStorage.setItem('orderData', JSON.stringify(orderData))
    return true
  } catch {
    return false
  }
}

function loadOrderData() {
  try {
    const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}')
    if (orderData.address) {
      receiverName.value = orderData.address.name || ''
      receiverPhone.value = orderData.address.phone || ''
      receiverAddress.value = orderData.address.address || ''
    }
    if (orderData.paymentMethod) {
      paymentMethod.value = orderData.paymentMethod
    }
  } catch {
    /* ignore */
  }
}

const orderSummaryHtml = computed(() => {
  summaryTick.value
  const total = calculateTotal(currentOrderItems.value)
  const totalQuantity = calculateTotalQuantity(currentOrderItems.value)
  const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}')
  const paymentMethodNames = {
    alipay: '支付宝',
    wechat: '微信支付',
    bank: '银行卡',
  }
  return {
    total,
    totalQuantity,
    orderData,
    paymentMethodNames,
  }
})

async function submitOrder() {
  const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}')
  if (!orderData.address) {
    alert('请填写收货地址')
    switchOrderTab(0)
    return
  }
  if (!orderData.paymentMethod) {
    alert('请选择支付方式')
    switchOrderTab(1)
    return
  }
  const itemIds = currentOrderItems.value.map((item) => item.id)
  try {
    await Promise.all(itemIds.map((id) => cartApi.updatePurchased(id, true)))
    const total = calculateTotal(currentOrderItems.value)
    sessionStorage.removeItem('orderData')
    closeOrderModal()
    alert(`订单提交成功！\n订单总金额：¥${total.toFixed(2)}\n感谢您的购买！`)
    selectedCartItemIds.value = []
    selectionInitialized = false
    await loadCartItems()
  } catch (e) {
    alert('提交订单时出现问题，请稍后重试')
  }
}

function checkout() {
  openOrderModal()
}

onMounted(async () => {
  await auth.refresh()
  await loadCartItems()
})
</script>

<template>
  <div class="App">
    <ShopHeader />
    <ShopNav active="cart" />

    <div class="shopping-cart-box">
      <div class="shopping-cart-header">
        <h2 class="shopping-cart-header-text">购物车</h2>
        <button
          v-show="currentCartItems.length"
          id="clearCartBtn"
          type="button"
          class="shopping-cart-header-btn-clear"
          @click="clearCart"
        >
          清空购物车
        </button>
      </div>

      <div v-if="loading" class="empty-cart"><p>加载中...</p></div>
      <div v-else-if="!currentCartItems.length" id="cartList" class="shopping-cart-list">
        <div class="empty-cart">
          <p>购物车是空的</p>
          <p>快去选购商品吧！</p>
        </div>
      </div>
      <div v-else id="cartList" class="shopping-cart-list">
        <div
          v-for="item in currentCartItems"
          :key="item.id"
          class="shopping-cart-item"
          :class="{ selected: isItemSelected(item.id) }"
          :data-cart-item-id="item.id"
        >
          <label class="item-select-box">
            <input
              type="checkbox"
              class="item-select-input"
              :data-cart-item-id="item.id"
              :checked="isItemSelected(item.id)"
              @change="toggleSelectItem(item.id, $event.target.checked)"
            />
          </label>
          <img
            :src="getImagePath((item.product || {}).image || item.image || 'images/logo192.png')"
            :alt="(item.product || {}).name || item.name"
          />
          <div class="item-info">
            <h4 class="shopping-cart-item-name">
              {{ (item.product || {}).name || item.name || '未知商品' }}
            </h4>
            <p class="shopping-cart-item-description">
              {{ (item.product || {}).description || item.description || '' }}
              <template v-if="item.selectedAttributes">
                {{
                  [
                    item.selectedAttributes.color && `颜色：${item.selectedAttributes.color}`,
                    item.selectedAttributes.size && `尺寸：${item.selectedAttributes.size}`,
                    item.selectedAttributes.specification && `规格：${item.selectedAttributes.specification}`,
                  ]
                    .filter(Boolean)
                    .join(' | ')
                }}
              </template>
            </p>
          </div>
          <div class="item-actions">
            <span class="shopping-cart-item-price"
              >¥{{ calculateCartItemPrice(item).toFixed(2) }}</span
            >
            <div class="quantity-control">
              <button
                type="button"
                class="quantity-btn"
                @click="changeItemQuantity(item.id, -1, item.quantity)"
              >
                -
              </button>
              <span class="quantity">{{ item.quantity }}</span>
              <button
                type="button"
                class="quantity-btn"
                @click="changeItemQuantity(item.id, 1, item.quantity)"
              >
                +
              </button>
            </div>
            <span class="item-total"
              >小计：¥{{ (calculateCartItemPrice(item) * item.quantity).toFixed(2) }}</span
            >
            <button type="button" class="shopping-cart-item-btn-delete" @click="removeItem(item.id)">
              删除
            </button>
          </div>
        </div>
      </div>

      <div class="shopping-cart-footer">
        <div class="footer-left">
          <label class="select-all">
            <input
              id="selectAllCheckbox"
              ref="selectAllRef"
              type="checkbox"
              :checked="selectAllState.checked"
              :disabled="selectAllState.disabled"
              @change="toggleSelectAll($event.target.checked)"
            />
            <span>全选</span>
          </label>
          <span class="selected-info">
            已选 <span id="selectedItems">{{ selectedQuantity }}</span> 件商品，合计 ¥<span
              id="selectedAmount"
              >{{ selectedAmount.toFixed(2) }}</span
            >
          </span>
        </div>
        <div class="footer-right">
          <span class="total-items"
            >共 <span id="totalItems">{{ totalItems }}</span> 件商品，总金额：¥<span id="totalAmount">{{
              totalAmount.toFixed(2)
            }}</span></span
          >
          <button
            id="checkoutBtn"
            type="button"
            class="shopping-cart-footer-btn-buy"
            :disabled="selectedQuantity === 0"
            @click="checkout"
          >
            立即购买
          </button>
        </div>
      </div>
    </div>

    <div
      v-show="orderModalOpen"
      id="orderModal"
      class="order-modal-overlay"
      style="display: flex"
      @click="closeOrderModal"
    >
      <div class="order-modal-container" @click.stop>
        <div class="order-modal-header">
          <h2>订单信息</h2>
          <button type="button" class="order-modal-close" @click="closeOrderModal">✕</button>
        </div>
        <div class="order-tabs">
          <button
            id="tab-0"
            type="button"
            class="order-tab"
            :class="{ active: currentOrderTab === 0 }"
            @click="switchOrderTab(0)"
          >
            收货地址
          </button>
          <button
            id="tab-1"
            type="button"
            class="order-tab"
            :class="{ active: currentOrderTab === 1 }"
            @click="switchOrderTab(1)"
          >
            支付方式
          </button>
          <button
            id="tab-2"
            type="button"
            class="order-tab"
            :class="{ active: currentOrderTab === 2 }"
            @click="switchOrderTab(2)"
          >
            订单确认
          </button>
        </div>
        <div class="order-tab-content">
          <div id="panel-0" class="order-tab-panel" :class="{ active: currentOrderTab === 0 }">
            <div class="order-form-group">
              <label>收货人姓名</label>
              <input id="receiverName" v-model="receiverName" type="text" placeholder="请输入收货人姓名" />
            </div>
            <div class="order-form-group">
              <label>联系电话</label>
              <input id="receiverPhone" v-model="receiverPhone" type="tel" placeholder="请输入联系电话" />
            </div>
            <div class="order-form-group">
              <label>详细地址</label>
              <textarea id="receiverAddress" v-model="receiverAddress" rows="3" placeholder="请输入详细收货地址" />
            </div>
            <div class="order-form-actions">
              <button
                type="button"
                class="order-btn order-btn-primary"
                @click="saveOrderStep(0) && switchOrderTab(1)"
              >
                下一步
              </button>
            </div>
          </div>
          <div id="panel-1" class="order-tab-panel" :class="{ active: currentOrderTab === 1 }">
            <div class="payment-methods">
              <label class="payment-option">
                <input v-model="paymentMethod" type="radio" name="paymentMethod" value="alipay" />
                <span class="payment-icon">💰</span>
                <span>支付宝</span>
              </label>
              <label class="payment-option">
                <input v-model="paymentMethod" type="radio" name="paymentMethod" value="wechat" />
                <span class="payment-icon">💳</span>
                <span>微信支付</span>
              </label>
              <label class="payment-option">
                <input v-model="paymentMethod" type="radio" name="paymentMethod" value="bank" />
                <span class="payment-icon">🏦</span>
                <span>银行卡</span>
              </label>
            </div>
            <div class="order-form-actions">
              <button type="button" class="order-btn order-btn-secondary" @click="switchOrderTab(0)">
                上一步
              </button>
              <button
                type="button"
                class="order-btn order-btn-primary"
                @click="saveOrderStep(1) && switchOrderTab(2)"
              >
                下一步
              </button>
            </div>
          </div>
          <div id="panel-2" class="order-tab-panel" :class="{ active: currentOrderTab === 2 }">
            <div class="order-summary">
              <h3>订单详情</h3>
              <div id="orderSummaryContent">
                <div class="order-summary-item">
                  <span class="order-summary-label">商品数量：</span>
                  <span class="order-summary-value">{{ orderSummaryHtml.totalQuantity }} 件</span>
                </div>
                <template v-if="orderSummaryHtml.orderData.address">
                  <div class="order-summary-item">
                    <span class="order-summary-label">收货人：</span>
                    <span class="order-summary-value">{{ orderSummaryHtml.orderData.address.name }}</span>
                  </div>
                  <div class="order-summary-item">
                    <span class="order-summary-label">联系电话：</span>
                    <span class="order-summary-value">{{ orderSummaryHtml.orderData.address.phone }}</span>
                  </div>
                  <div class="order-summary-item">
                    <span class="order-summary-label">收货地址：</span>
                    <span class="order-summary-value">{{ orderSummaryHtml.orderData.address.address }}</span>
                  </div>
                </template>
                <div v-if="orderSummaryHtml.orderData.paymentMethod" class="order-summary-item">
                  <span class="order-summary-label">支付方式：</span>
                  <span class="order-summary-value">{{
                    orderSummaryHtml.paymentMethodNames[orderSummaryHtml.orderData.paymentMethod] ||
                    orderSummaryHtml.orderData.paymentMethod
                  }}</span>
                </div>
                <div class="order-summary-total">
                  <span>订单总额：</span>
                  <span>¥{{ orderSummaryHtml.total.toFixed(2) }}</span>
                </div>
              </div>
            </div>
            <div class="order-form-actions">
              <button type="button" class="order-btn order-btn-secondary" @click="switchOrderTab(1)">
                上一步
              </button>
              <button type="button" class="order-btn order-btn-primary" @click="submitOrder">提交订单</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
