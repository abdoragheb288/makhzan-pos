/**
 * Smart POS Router
 * Routes to the correct POS interface based on business type
 */

import { useAuthStore } from '../store';
import POS from '../pages/POS';
import RestaurantPOS from '../pages/RestaurantPOS';

export default function POSRouter() {
    // Get business type directly from store state for reactivity
    const businessType = useAuthStore(state => state.user?.businessType || 'retail');

    if (businessType === 'restaurant' || businessType === 'cafe') {
        return <RestaurantPOS />;
    }

    // Default to Retail POS
    return <POS />;
}
