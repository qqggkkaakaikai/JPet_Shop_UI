/**
 * 与 pet_-shop static/js/common.js 中 calculateProductPrice 逻辑对齐（去掉调试输出）
 */
export function calculateProductPrice(product, specification, size) {
  if (!product) return 0

  let specPrices = product.specificationPrices
  if (!specPrices && product.attributes) {
    specPrices = product.attributes.specificationPrices
  }

  let sizePrices = product.sizePrices
  if (!sizePrices && product.attributes) {
    sizePrices = product.attributes.sizePrices
  }

  if (specification && specPrices && typeof specPrices === 'object' && specPrices !== null) {
    let price = specPrices[specification]
    if (price == null && Object.keys(specPrices).length > 0) {
      const matchingKey = Object.keys(specPrices).find(
        (key) =>
          key.toLowerCase() === specification.toLowerCase() || key.trim() === specification.trim(),
      )
      if (matchingKey) price = specPrices[matchingKey]
    }
    if (price != null && price !== undefined) {
      return parseFloat(price)
    }
  }

  if (size && sizePrices && typeof sizePrices === 'object' && sizePrices !== null) {
    let price = sizePrices[size]
    if (price == null && Object.keys(sizePrices).length > 0) {
      const matchingKey = Object.keys(sizePrices).find(
        (key) => key.toLowerCase() === size.toLowerCase() || key.trim() === size.trim(),
      )
      if (matchingKey) price = sizePrices[matchingKey]
    }
    if (price != null && price !== undefined) {
      return parseFloat(price)
    }
  }

  return parseFloat(product.price || 0)
}

export function calculateCartItemPrice(item) {
  const product = item.product || {}
  const selectedAttributes = item.selectedAttributes || {}

  let displayPrice = product.price != null ? product.price : (item.price || 0)

  let specPrices = product.specificationPrices || (product.attributes && product.attributes.specificationPrices)
  let sizePrices = product.sizePrices || (product.attributes && product.attributes.sizePrices)

  if (selectedAttributes.specification && specPrices && specPrices[selectedAttributes.specification]) {
    displayPrice = parseFloat(specPrices[selectedAttributes.specification])
  } else if (selectedAttributes.size && sizePrices && sizePrices[selectedAttributes.size]) {
    displayPrice = parseFloat(sizePrices[selectedAttributes.size])
  }

  return parseFloat(displayPrice) || 0
}

export function calculateTotal(cartItems) {
  return cartItems.reduce((sum, item) => {
    const price = calculateCartItemPrice(item)
    const quantity = Number(item.quantity) || 0
    return sum + price * quantity
  }, 0)
}

export function calculateTotalQuantity(cartItems) {
  return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
}
