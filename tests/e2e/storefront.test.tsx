import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/App';

describe('Rang e Rosh End-to-End Storefront & Admin User Flows', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renders homepage with Rang e Rosh branding, categories, @Final Designs suits, and official contacts', async () => {
    render(<App />);

    // Verify brand header & hero
    expect(screen.getAllByText(/Rang e Rosh/i).length).toBeGreaterThan(0);

    // Wait for categories and featured products to load
    await waitFor(() => {
      expect(screen.getByText(/Featured Collection/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Hazel — Cranberry Red Embroidered 2-Piece Suit/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Anna — Black Karandi Embroidered 2-Piece Suit/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Orchid — Rich Purple Embroidered Ensemble with Culottes/i)
      ).toBeInTheDocument();
    });

    // Verify official contact info in footer
    expect(screen.getAllByText(/\+923130888048/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+923200300552/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/rangerosh\.official@gmail\.com/i).length).toBeGreaterThan(0);
  });

  it('enforces size & color selection on Product Detail Page before adding to cart', async () => {
    window.history.pushState({}, '', '/product/hazel-cranberry-red-embroidered-2pc');
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Hazel — Cranberry Red Embroidered 2-Piece Suit/i })
      ).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Add to Shopping Bag/i });

    // Attempting to add without selecting size triggers accessible validation alert
    fireEvent.click(addBtn);
    expect(
      await screen.findByText(/Please select a clothing size before adding to your shopping bag/i)
    ).toBeInTheDocument();

    // Select Size "Medium" (Color "Cranberry Red" is auto-selected since it's the single color option)
    fireEvent.click(screen.getByRole('button', { name: 'Medium' }));

    fireEvent.click(addBtn);

    // Cart Drawer should open showing 1 item in Shopping Bag
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Shopping Bag \(1\)/i)).toBeInTheDocument();
    });
  });

  it('protects /admin routes and redirects unauthenticated visitors to /admin/login', async () => {
    window.history.pushState({}, '', '/admin/products');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Authorized Administrator Portal/i)).toBeInTheDocument();
    });
  });
});
