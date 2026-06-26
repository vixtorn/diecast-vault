# Diecast Vault

Diecast Vault is a Vite + React + TypeScript browsing experiment for collectible die-cast toy cars. It uses local PNG assets, typed collection data, and Framer Motion to create a full-screen visual product wall with category filtering.

## Inspiration Credit

Interaction and layout inspiration: [Shoe Finder by Matthew Greenberg](https://shoe-finder-wine.vercel.app/)

Reference repository: [MatthewGreenberg/shoe-finder](https://github.com/MatthewGreenberg/shoe-finder)

This project is an original learning/personal implementation adapted for die-cast cars.

## Asset Audit

Run `npm run prepare-assets` to remove the baked checkerboard backgrounds from `public/cars` and write cropped, true-transparent PNGs to `public/cars-clean`. The app data points at the cleaned assets.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
