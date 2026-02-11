// public/js/billing/entitlements.js
import { state, saveOwned } from "../state.js";

export function grantEntitlement(itemId) {
  // map itemId to owned bucket
  if (["stick", "light", "glove"].includes(itemId)) {
    if (!state.owned.hand.includes(itemId)) state.owned.hand.push(itemId);
  } else {
    if (!state.owned.foot.includes(itemId)) state.owned.foot.push(itemId);
  }
  saveOwned();
}
