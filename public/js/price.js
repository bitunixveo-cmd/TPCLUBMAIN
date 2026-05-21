const priceNode = document.querySelector('[data-btc-price]');
const updatedNode = document.querySelector('[data-price-updated]');

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

async function updateBtcPrice() {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Ticker request failed: ${response.status}`);
    }

    const data = await response.json();
    const price = Number(data.price);

    if (!Number.isFinite(price)) {
      throw new Error('Ticker response did not include a valid price');
    }

    priceNode.textContent = formatter.format(price);
    priceNode.classList.remove('is-stale');

    if (updatedNode) {
      updatedNode.textContent = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (error) {
    priceNode.classList.add('is-stale');
    if (priceNode.dataset.fallback) {
      priceNode.setAttribute('title', priceNode.dataset.fallback);
    }
    if (updatedNode) {
      updatedNode.textContent = priceNode.dataset.fallback || updatedNode.textContent;
    }
  }
}

if (priceNode) {
  updateBtcPrice();
  window.setInterval(updateBtcPrice, 30000);
}
