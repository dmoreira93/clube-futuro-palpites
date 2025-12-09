import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';

export const handleSubscription = async () => {
  if (Capacitor.isNativePlatform()) {
    // --- LÓGICA NATIVA (APP) ---
    // Chama o RevenueCat (IAP)
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        // Exibe tela de compra nativa ou processa pacote
        // await Purchases.purchasePackage(offerings.current.availablePackages[0]);
      }
    } catch (e) {
      console.error("Erro RevenueCat", e);
    }
  } else {
    // --- LÓGICA WEB (PWA) ---
    // Redireciona para Stripe ou Mercado Pago
    window.location.href = "https://seu-link-stripe-checkout.com";
  }
};