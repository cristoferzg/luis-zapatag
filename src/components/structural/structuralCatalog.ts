import { ProfileDefinition } from './structuralTypes';

export const STEEL_PROFILES: ProfileDefinition[] = [
  // IPE Series
  { id: 'ipe-140', name: 'IPE 140', type: 'IPE', weightKgM: 12.9, heightMm: 140, widthMm: 73, thicknessMm: 4.7, areaCm2: 16.4, IxCm4: 541, SxCm3: 77.3 },
  { id: 'ipe-160', name: 'IPE 160', type: 'IPE', weightKgM: 15.8, heightMm: 160, widthMm: 82, thicknessMm: 5.0, areaCm2: 20.1, IxCm4: 869, SxCm3: 109 },
  { id: 'ipe-200', name: 'IPE 200', type: 'IPE', weightKgM: 22.4, heightMm: 200, widthMm: 100, thicknessMm: 5.6, areaCm2: 28.5, IxCm4: 1943, SxCm3: 194 },
  { id: 'ipe-240', name: 'IPE 240', type: 'IPE', weightKgM: 30.7, heightMm: 240, widthMm: 120, thicknessMm: 6.2, areaCm2: 39.1, IxCm4: 3892, SxCm3: 324 },
  { id: 'ipe-300', name: 'IPE 300', type: 'IPE', weightKgM: 42.2, heightMm: 300, widthMm: 150, thicknessMm: 7.1, areaCm2: 53.8, IxCm4: 8356, SxCm3: 557 },
  { id: 'ipe-360', name: 'IPE 360', type: 'IPE', weightKgM: 57.1, heightMm: 360, widthMm: 170, thicknessMm: 8.0, areaCm2: 72.7, IxCm4: 16270, SxCm3: 904 },

  // W / H Series (AISC)
  { id: 'w-8x10', name: 'W 8x10', type: 'W', weightKgM: 14.9, heightMm: 200, widthMm: 100, thicknessMm: 4.3, areaCm2: 19.1, IxCm4: 1280, SxCm3: 128 },
  { id: 'w-10x15', name: 'W 10x15', type: 'W', weightKgM: 22.3, heightMm: 254, widthMm: 102, thicknessMm: 5.8, areaCm2: 28.4, IxCm4: 2870, SxCm3: 226 },
  { id: 'w-12x26', name: 'W 12x26', type: 'W', weightKgM: 38.7, heightMm: 310, widthMm: 165, thicknessMm: 6.6, areaCm2: 49.3, IxCm4: 8490, SxCm3: 547 },

  // Tubos Rectangulares y Cuadrados (Todas las familias con espesores claros)
  // --- Familia 2" x 1 1/2" / 30 x 50 mm (3 x 5 cm) ---
  { id: 'tub-rec-50x30x1.2', name: 'Tubo Rectangular 2" x 1 1/2" x 1.2mm (50 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 1.46, heightMm: 50, widthMm: 30, thicknessMm: 1.2, areaCm2: 1.86, IxCm4: 6.20, SxCm3: 2.48 },
  { id: 'tub-rec-50x30x1.5', name: 'Tubo Rectangular 2" x 1 1/2" x 1.5mm (50 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 1.81, heightMm: 50, widthMm: 30, thicknessMm: 1.5, areaCm2: 2.30, IxCm4: 7.55, SxCm3: 3.02 },
  { id: 'tub-rec-50x30x1.8', name: 'Tubo Rectangular 2" x 1 1/2" x 1.8mm (50 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 2.15, heightMm: 50, widthMm: 30, thicknessMm: 1.8, areaCm2: 2.74, IxCm4: 8.85, SxCm3: 3.54 },
  { id: 'tub-rec-50x30x2.0', name: 'Tubo Rectangular 2" x 1 1/2" x 2.0mm (50 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 2.38, heightMm: 50, widthMm: 30, thicknessMm: 2.0, areaCm2: 3.03, IxCm4: 9.68, SxCm3: 3.87 },
  { id: 'tub-rec-50x30x2.5', name: 'Tubo Rectangular 2" x 1 1/2" x 2.5mm (50 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 2.92, heightMm: 50, widthMm: 30, thicknessMm: 2.5, areaCm2: 3.72, IxCm4: 11.60, SxCm3: 4.64 },
  { id: 'tub-rec-50x30x3.0', name: 'Tubo Rectangular 2" x 1 1/2" x 3.0mm (50 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 3.38, heightMm: 50, widthMm: 30, thicknessMm: 3.0, areaCm2: 4.30, IxCm4: 13.20, SxCm3: 5.28 },

  // --- Familia 1 1/2" x 1" / 30 x 40 mm (3 x 4 cm) ---
  { id: 'tub-rec-40x30x1.2', name: 'Tubo Rectangular 1 1/2" x 1" x 1.2mm (40 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 1.27, heightMm: 40, widthMm: 30, thicknessMm: 1.2, areaCm2: 1.62, IxCm4: 3.80, SxCm3: 1.90 },
  { id: 'tub-rec-40x30x1.5', name: 'Tubo Rectangular 1 1/2" x 1" x 1.5mm (40 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 1.57, heightMm: 40, widthMm: 30, thicknessMm: 1.5, areaCm2: 2.00, IxCm4: 4.60, SxCm3: 2.30 },
  { id: 'tub-rec-40x30x1.8', name: 'Tubo Rectangular 1 1/2" x 1" x 1.8mm (40 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 1.87, heightMm: 40, widthMm: 30, thicknessMm: 1.8, areaCm2: 2.38, IxCm4: 5.35, SxCm3: 2.67 },
  { id: 'tub-rec-40x30x2.0', name: 'Tubo Rectangular 1 1/2" x 1" x 2.0mm (40 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 2.06, heightMm: 40, widthMm: 30, thicknessMm: 2.0, areaCm2: 2.62, IxCm4: 5.82, SxCm3: 2.91 },
  { id: 'tub-rec-40x30x2.5', name: 'Tubo Rectangular 1 1/2" x 1" x 2.5mm (40 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 2.52, heightMm: 40, widthMm: 30, thicknessMm: 2.5, areaCm2: 3.21, IxCm4: 6.90, SxCm3: 3.45 },
  { id: 'tub-rec-40x30x3.0', name: 'Tubo Rectangular 1 1/2" x 1" x 3.0mm (40 x 30 mm)', type: 'Tubo Rectangular', weightKgM: 2.95, heightMm: 40, widthMm: 30, thicknessMm: 3.0, areaCm2: 3.76, IxCm4: 7.80, SxCm3: 3.90 },

  // --- Familia 1 1/4" x 1 1/4" / 30 x 30 mm (3 x 3 cm) ---
  { id: 'tub-cuad-30x30x1.2', name: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 1.2mm (30 x 30 mm)', type: 'Tubo Cuadrado', weightKgM: 1.08, heightMm: 30, widthMm: 30, thicknessMm: 1.2, areaCm2: 1.38, IxCm4: 1.82, SxCm3: 1.21 },
  { id: 'tub-cuad-30x30x1.5', name: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 1.5mm (30 x 30 mm)', type: 'Tubo Cuadrado', weightKgM: 1.33, heightMm: 30, widthMm: 30, thicknessMm: 1.5, areaCm2: 1.70, IxCm4: 2.20, SxCm3: 1.47 },
  { id: 'tub-cuad-30x30x1.8', name: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 1.8mm (30 x 30 mm)', type: 'Tubo Cuadrado', weightKgM: 1.58, heightMm: 30, widthMm: 30, thicknessMm: 1.8, areaCm2: 2.01, IxCm4: 2.55, SxCm3: 1.70 },
  { id: 'tub-cuad-30x30x2.0', name: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 2.0mm (30 x 30 mm)', type: 'Tubo Cuadrado', weightKgM: 1.74, heightMm: 30, widthMm: 30, thicknessMm: 2.0, areaCm2: 2.22, IxCm4: 2.76, SxCm3: 1.84 },
  { id: 'tub-cuad-30x30x2.5', name: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 2.5mm (30 x 30 mm)', type: 'Tubo Cuadrado', weightKgM: 2.12, heightMm: 30, widthMm: 30, thicknessMm: 2.5, areaCm2: 2.70, IxCm4: 3.25, SxCm3: 2.17 },

  // --- Familia 2" x 1" / 50 x 25 mm ---
  { id: 'tub-rec-50x25x1.2', name: 'Tubo Rectangular 2" x 1" x 1.2mm (50 x 25 mm)', type: 'Tubo Rectangular', weightKgM: 1.36, heightMm: 50, widthMm: 25, thicknessMm: 1.2, areaCm2: 1.73, IxCm4: 5.62, SxCm3: 2.25 },
  { id: 'tub-rec-50x25x1.5', name: 'Tubo Rectangular 2" x 1" x 1.5mm (50 x 25 mm)', type: 'Tubo Rectangular', weightKgM: 1.68, heightMm: 50, widthMm: 25, thicknessMm: 1.5, areaCm2: 2.14, IxCm4: 6.84, SxCm3: 2.74 },
  { id: 'tub-rec-50x25x2', name: 'Tubo Rectangular 2" x 1" x 2.0mm (50 x 25 mm)', type: 'Tubo Rectangular', weightKgM: 2.19, heightMm: 50, widthMm: 25, thicknessMm: 2.0, areaCm2: 2.79, IxCm4: 8.65, SxCm3: 3.46 },

  // --- Familia 2 1/2" x 1 1/2" / 60 x 40 mm ---
  { id: 'tub-rec-60x40x1.2', name: 'Tubo Rectangular 2 1/2" x 1 1/2" x 1.2mm (60 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 1.82, heightMm: 60, widthMm: 40, thicknessMm: 1.2, areaCm2: 2.31, IxCm4: 12.8, SxCm3: 4.26 },
  { id: 'tub-rec-60x40x1.5', name: 'Tubo Rectangular 2 1/2" x 1 1/2" x 1.5mm (60 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 2.25, heightMm: 60, widthMm: 40, thicknessMm: 1.5, areaCm2: 2.87, IxCm4: 15.6, SxCm3: 5.20 },
  { id: 'tub-rec-60x40x1.8', name: 'Tubo Rectangular 2 1/2" x 1 1/2" x 1.8mm (60 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 2.68, heightMm: 60, widthMm: 40, thicknessMm: 1.8, areaCm2: 3.41, IxCm4: 18.2, SxCm3: 6.07 },
  { id: 'tub-rec-60x40x2', name: 'Tubo Rectangular 2 1/2" x 1 1/2" x 2.0mm (60 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 2.98, heightMm: 60, widthMm: 40, thicknessMm: 2.0, areaCm2: 3.79, IxCm4: 20.1, SxCm3: 6.70 },
  { id: 'tub-rec-60x40x2.5', name: 'Tubo Rectangular 2 1/2" x 1 1/2" x 2.5mm (60 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 3.65, heightMm: 60, widthMm: 40, thicknessMm: 2.5, areaCm2: 4.65, IxCm4: 24.1, SxCm3: 8.03 },
  { id: 'tub-rec-60x40x3', name: 'Tubo Rectangular 2 1/2" x 1 1/2" x 3.0mm (60 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 4.30, heightMm: 60, widthMm: 40, thicknessMm: 3.0, areaCm2: 5.48, IxCm4: 27.6, SxCm3: 9.20 },

  // --- Familia 3" x 1 1/2" / 75 x 38 mm ---
  { id: 'tub-rec-75x38x1.5', name: 'Tubo Rectangular 3" x 1 1/2" x 1.5mm (75 x 38 mm)', type: 'Tubo Rectangular', weightKgM: 2.58, heightMm: 75, widthMm: 38, thicknessMm: 1.5, areaCm2: 3.29, IxCm4: 23.4, SxCm3: 6.24 },
  { id: 'tub-rec-75x38x2', name: 'Tubo Rectangular 3" x 1 1/2" x 2.0mm (75 x 38 mm)', type: 'Tubo Rectangular', weightKgM: 3.39, heightMm: 75, widthMm: 38, thicknessMm: 2.0, areaCm2: 4.32, IxCm4: 30.1, SxCm3: 8.03 },
  { id: 'tub-rec-75x38x2.5', name: 'Tubo Rectangular 3" x 1 1/2" x 2.5mm (75 x 38 mm)', type: 'Tubo Rectangular', weightKgM: 4.18, heightMm: 75, widthMm: 38, thicknessMm: 2.5, areaCm2: 5.33, IxCm4: 36.2, SxCm3: 9.65 },

  // --- Familia 3 1/8" x 1 1/2" / 80 x 40 mm ---
  { id: 'tub-rec-80x40x1.2', name: 'Tubo Rectangular 3 1/8" x 1 1/2" x 1.2mm (80 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 2.20, heightMm: 80, widthMm: 40, thicknessMm: 1.2, areaCm2: 2.79, IxCm4: 24.2, SxCm3: 6.05 },
  { id: 'tub-rec-80x40x1.5', name: 'Tubo Rectangular 3 1/8" x 1 1/2" x 1.5mm (80 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 2.75, heightMm: 80, widthMm: 40, thicknessMm: 1.5, areaCm2: 3.51, IxCm4: 29.8, SxCm3: 7.45 },
  { id: 'tub-rec-80x40x1.8', name: 'Tubo Rectangular 3 1/8" x 1 1/2" x 1.8mm (80 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 3.20, heightMm: 80, widthMm: 40, thicknessMm: 1.8, areaCm2: 4.08, IxCm4: 35.1, SxCm3: 8.78 },
  { id: 'tub-rec-80x40x2', name: 'Tubo Rectangular 3 1/8" x 1 1/2" x 2.0mm (80 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 3.57, heightMm: 80, widthMm: 40, thicknessMm: 2.0, areaCm2: 4.55, IxCm4: 39.2, SxCm3: 9.8 },
  { id: 'tub-rec-80x40x2.5', name: 'Tubo Rectangular 3 1/8" x 1 1/2" x 2.5mm (80 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 4.41, heightMm: 80, widthMm: 40, thicknessMm: 2.5, areaCm2: 5.62, IxCm4: 47.3, SxCm3: 11.8 },
  { id: 'tub-rec-80x40x3', name: 'Tubo Rectangular 3 1/8" x 1 1/2" x 3.0mm (80 x 40 mm)', type: 'Tubo Rectangular', weightKgM: 5.20, heightMm: 80, widthMm: 40, thicknessMm: 3.0, areaCm2: 6.62, IxCm4: 54.8, SxCm3: 13.7 },

  // --- Familia 4" x 2" / 100 x 50 mm ---
  { id: 'tub-rec-100x50x1.5', name: 'Tubo Rectangular 4" x 2" x 1.5mm (100 x 50 mm)', type: 'Tubo Rectangular', weightKgM: 3.46, heightMm: 100, widthMm: 50, thicknessMm: 1.5, areaCm2: 4.41, IxCm4: 59.8, SxCm3: 11.9 },
  { id: 'tub-rec-100x50x2', name: 'Tubo Rectangular 4" x 2" x 2.0mm (100 x 50 mm)', type: 'Tubo Rectangular', weightKgM: 4.51, heightMm: 100, widthMm: 50, thicknessMm: 2.0, areaCm2: 5.75, IxCm4: 77.8, SxCm3: 15.6 },
  { id: 'tub-rec-100x50x2.5', name: 'Tubo Rectangular 4" x 2" x 2.5mm (100 x 50 mm)', type: 'Tubo Rectangular', weightKgM: 5.58, heightMm: 100, widthMm: 50, thicknessMm: 2.5, areaCm2: 7.11, IxCm4: 93.4, SxCm3: 18.7 },
  { id: 'tub-rec-100x50x3', name: 'Tubo Rectangular 4" x 2" x 3.0mm (100 x 50 mm)', type: 'Tubo Rectangular', weightKgM: 6.56, heightMm: 100, widthMm: 50, thicknessMm: 3.0, areaCm2: 8.36, IxCm4: 108.0, SxCm3: 21.6 },

  // --- Familia 6" x 2" / 150 x 50 mm ---
  { id: 'tub-rec-150x50x2', name: 'Tubo Rectangular 6" x 2" x 2.0mm (150 x 50 mm)', type: 'Tubo Rectangular', weightKgM: 6.12, heightMm: 150, widthMm: 50, thicknessMm: 2.0, areaCm2: 7.80, IxCm4: 210.0, SxCm3: 28.0 },
  { id: 'tub-rec-150x50x2.5', name: 'Tubo Rectangular 6" x 2" x 2.5mm (150 x 50 mm)', type: 'Tubo Rectangular', weightKgM: 7.55, heightMm: 150, widthMm: 50, thicknessMm: 2.5, areaCm2: 9.62, IxCm4: 256.0, SxCm3: 34.1 },
  { id: 'tub-rec-150x50x3', name: 'Tubo Rectangular 6" x 2" x 3.0mm (150 x 50 mm)', type: 'Tubo Rectangular', weightKgM: 8.92, heightMm: 150, widthMm: 50, thicknessMm: 3.0, areaCm2: 11.36, IxCm4: 301.0, SxCm3: 40.1 },

  // --- Familia 6" x 4" / 150 x 100 mm ---
  { id: 'tub-rec-150x100x2.5', name: 'Tubo Rectangular 6" x 4" x 2.5mm (150 x 100 mm)', type: 'Tubo Rectangular', weightKgM: 9.51, heightMm: 150, widthMm: 100, thicknessMm: 2.5, areaCm2: 12.12, IxCm4: 382.0, SxCm3: 50.9 },
  { id: 'tub-rec-150x100x3', name: 'Tubo Rectangular 6" x 4" x 3.0mm (150 x 100 mm)', type: 'Tubo Rectangular', weightKgM: 11.3, heightMm: 150, widthMm: 100, thicknessMm: 3.0, areaCm2: 14.4, IxCm4: 450.0, SxCm3: 60.0 },
  { id: 'tub-rec-150x100x4', name: 'Tubo Rectangular 6" x 4" x 4.0mm (150 x 100 mm)', type: 'Tubo Rectangular', weightKgM: 14.8, heightMm: 150, widthMm: 100, thicknessMm: 4.0, areaCm2: 18.9, IxCm4: 578.0, SxCm3: 77.1 },

  // --- Familia 8" x 4" / 200 x 100 mm ---
  { id: 'tub-rec-200x100x3', name: 'Tubo Rectangular 8" x 4" x 3.0mm (200 x 100 mm)', type: 'Tubo Rectangular', weightKgM: 13.7, heightMm: 200, widthMm: 100, thicknessMm: 3.0, areaCm2: 17.4, IxCm4: 935.0, SxCm3: 93.5 },
  { id: 'tub-rec-200x100x4', name: 'Tubo Rectangular 8" x 4" x 4.0mm (200 x 100 mm)', type: 'Tubo Rectangular', weightKgM: 18.0, heightMm: 200, widthMm: 100, thicknessMm: 4.0, areaCm2: 22.9, IxCm4: 1220.0, SxCm3: 122.0 },

  // --- Tubos Cuadrados (1 1/2"x1 1/2", 2"x2", 3"x3", 4"x4", 6"x6") ---
  { id: 'tub-cuad-40x40x1.5', name: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm (40 x 40 mm)', type: 'Tubo Cuadrado', weightKgM: 1.81, heightMm: 40, widthMm: 40, thicknessMm: 1.5, areaCm2: 2.31, IxCm4: 5.64, SxCm3: 2.82 },
  { id: 'tub-cuad-40x40x2', name: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 2.0mm (40 x 40 mm)', type: 'Tubo Cuadrado', weightKgM: 2.31, heightMm: 40, widthMm: 40, thicknessMm: 2.0, areaCm2: 2.94, IxCm4: 7.02, SxCm3: 3.51 },
  { id: 'tub-cuad-50x50x1.2', name: 'Tubo Cuadrado 2" x 2" x 1.2mm (50 x 50 mm)', type: 'Tubo Cuadrado', weightKgM: 1.83, heightMm: 50, widthMm: 50, thicknessMm: 1.2, areaCm2: 2.33, IxCm4: 9.15, SxCm3: 3.66 },
  { id: 'tub-cuad-50x50x1.5', name: 'Tubo Cuadrado 2" x 2" x 1.5mm (50 x 50 mm)', type: 'Tubo Cuadrado', weightKgM: 2.24, heightMm: 50, widthMm: 50, thicknessMm: 1.5, areaCm2: 2.85, IxCm4: 11.0, SxCm3: 4.40 },
  { id: 'tub-cuad-50x50x2', name: 'Tubo Cuadrado 2" x 2" x 2.0mm (50 x 50 mm)', type: 'Tubo Cuadrado', weightKgM: 2.93, heightMm: 50, widthMm: 50, thicknessMm: 2.0, areaCm2: 3.73, IxCm4: 13.9, SxCm3: 5.56 },
  { id: 'tub-cuad-50x50x2.5', name: 'Tubo Cuadrado 2" x 2" x 2.5mm (50 x 50 mm)', type: 'Tubo Cuadrado', weightKgM: 3.61, heightMm: 50, widthMm: 50, thicknessMm: 2.5, areaCm2: 4.60, IxCm4: 16.5, SxCm3: 6.60 },
  { id: 'tub-cuad-50x50x3', name: 'Tubo Cuadrado 2" x 2" x 3.0mm (50 x 50 mm)', type: 'Tubo Cuadrado', weightKgM: 4.22, heightMm: 50, widthMm: 50, thicknessMm: 3.0, areaCm2: 5.38, IxCm4: 18.7, SxCm3: 7.48 },
  { id: 'tub-cuad-75x75x1.5', name: 'Tubo Cuadrado 3" x 3" x 1.5mm (75 x 75 mm)', type: 'Tubo Cuadrado', weightKgM: 3.42, heightMm: 75, widthMm: 75, thicknessMm: 1.5, areaCm2: 4.35, IxCm4: 38.6, SxCm3: 10.3 },
  { id: 'tub-cuad-75x75x2', name: 'Tubo Cuadrado 3" x 3" x 2.0mm (75 x 75 mm)', type: 'Tubo Cuadrado', weightKgM: 4.51, heightMm: 75, widthMm: 75, thicknessMm: 2.0, areaCm2: 5.75, IxCm4: 49.5, SxCm3: 13.2 },
  { id: 'tub-cuad-75x75x2.5', name: 'Tubo Cuadrado 3" x 3" x 2.5mm (75 x 75 mm)', type: 'Tubo Cuadrado', weightKgM: 5.55, heightMm: 75, widthMm: 75, thicknessMm: 2.5, areaCm2: 7.07, IxCm4: 59.8, SxCm3: 15.9 },
  { id: 'tub-cuad-75x75x3', name: 'Tubo Cuadrado 3" x 3" x 3.0mm (75 x 75 mm)', type: 'Tubo Cuadrado', weightKgM: 6.56, heightMm: 75, widthMm: 75, thicknessMm: 3.0, areaCm2: 8.36, IxCm4: 69.4, SxCm3: 18.5 },
  { id: 'tub-cuad-75x75x4', name: 'Tubo Cuadrado 3" x 3" x 4.0mm (75 x 75 mm)', type: 'Tubo Cuadrado', weightKgM: 8.52, heightMm: 75, widthMm: 75, thicknessMm: 4.0, areaCm2: 10.85, IxCm4: 86.2, SxCm3: 23.0 },
  { id: 'tub-cuad-100x100x2', name: 'Tubo Cuadrado 4" x 4" x 2.0mm (100 x 100 mm)', type: 'Tubo Cuadrado', weightKgM: 6.08, heightMm: 100, widthMm: 100, thicknessMm: 2.0, areaCm2: 7.75, IxCm4: 120.0, SxCm3: 24.0 },
  { id: 'tub-cuad-100x100x2.5', name: 'Tubo Cuadrado 4" x 4" x 2.5mm (100 x 100 mm)', type: 'Tubo Cuadrado', weightKgM: 7.51, heightMm: 100, widthMm: 100, thicknessMm: 2.5, areaCm2: 9.57, IxCm4: 147.0, SxCm3: 29.4 },
  { id: 'tub-cuad-100x100x3', name: 'Tubo Cuadrado 4" x 4" x 3.0mm (100 x 100 mm)', type: 'Tubo Cuadrado', weightKgM: 8.92, heightMm: 100, widthMm: 100, thicknessMm: 3.0, areaCm2: 11.36, IxCm4: 172.0, SxCm3: 34.4 },
  { id: 'tub-cuad-100x100x4', name: 'Tubo Cuadrado 4" x 4" x 4.0mm (100 x 100 mm)', type: 'Tubo Cuadrado', weightKgM: 11.7, heightMm: 100, widthMm: 100, thicknessMm: 4.0, areaCm2: 14.88, IxCm4: 219.0, SxCm3: 43.8 },
  { id: 'tub-cuad-150x150x3', name: 'Tubo Cuadrado 6" x 6" x 3.0mm (150 x 150 mm)', type: 'Tubo Cuadrado', weightKgM: 13.6, heightMm: 150, widthMm: 150, thicknessMm: 3.0, areaCm2: 17.36, IxCm4: 615.0, SxCm3: 82.0 },
  { id: 'tub-cuad-150x150x4', name: 'Tubo Cuadrado 6" x 6" x 4.0mm (150 x 150 mm)', type: 'Tubo Cuadrado', weightKgM: 18.1, heightMm: 150, widthMm: 150, thicknessMm: 4.0, areaCm2: 23.0, IxCm4: 805.0, SxCm3: 107.0 },
  { id: 'tub-cuad-150x150x6', name: 'Tubo Cuadrado 6" x 6" x 6.0mm (150 x 150 mm)', type: 'Tubo Cuadrado', weightKgM: 26.5, heightMm: 150, widthMm: 150, thicknessMm: 6.0, areaCm2: 33.7, IxCm4: 1140.0, SxCm3: 152.0 },

  // Perfil C (Costanera / Correas de techo con variedad de espesores)
  { id: 'perfil-c-80x40x1.5', name: 'Perfil C 80x40x15x1.5mm', type: 'Perfil C (Costanera)', weightKgM: 2.15, heightMm: 80, widthMm: 40, thicknessMm: 1.5, areaCm2: 2.74, IxCm4: 27.8, SxCm3: 6.95 },
  { id: 'perfil-c-80x40x2', name: 'Perfil C 80x40x15x2.0mm', type: 'Perfil C (Costanera)', weightKgM: 2.82, heightMm: 80, widthMm: 40, thicknessMm: 2.0, areaCm2: 3.59, IxCm4: 36.1, SxCm3: 9.02 },
  { id: 'perfil-c-100x50x1.5', name: 'Perfil C 100x50x15x1.5mm', type: 'Perfil C (Costanera)', weightKgM: 2.62, heightMm: 100, widthMm: 50, thicknessMm: 1.5, areaCm2: 3.34, IxCm4: 53.6, SxCm3: 10.7 },
  { id: 'perfil-c-100x50x2', name: 'Perfil C 100x50x15x2.0mm', type: 'Perfil C (Costanera)', weightKgM: 3.45, heightMm: 100, widthMm: 50, thicknessMm: 2.0, areaCm2: 4.39, IxCm4: 70.2, SxCm3: 14.0 },
  { id: 'perfil-c-100x50x2.5', name: 'Perfil C 100x50x15x2.5mm', type: 'Perfil C (Costanera)', weightKgM: 4.25, heightMm: 100, widthMm: 50, thicknessMm: 2.5, areaCm2: 5.41, IxCm4: 85.3, SxCm3: 17.1 },
  { id: 'perfil-c-120x50x2', name: 'Perfil C 120x50x15x2.0mm', type: 'Perfil C (Costanera)', weightKgM: 3.76, heightMm: 120, widthMm: 50, thicknessMm: 2.0, areaCm2: 4.79, IxCm4: 109.5, SxCm3: 18.2 },
  { id: 'perfil-c-120x50x2.5', name: 'Perfil C 120x50x15x2.5mm', type: 'Perfil C (Costanera)', weightKgM: 4.64, heightMm: 120, widthMm: 50, thicknessMm: 2.5, areaCm2: 5.91, IxCm4: 133.4, SxCm3: 22.2 },
  { id: 'perfil-c-150x50x2', name: 'Perfil C 150x50x15x2.0mm', type: 'Perfil C (Costanera)', weightKgM: 4.23, heightMm: 150, widthMm: 50, thicknessMm: 2.0, areaCm2: 5.39, IxCm4: 175.0, SxCm3: 23.3 },
  { id: 'perfil-c-150x50x2.5', name: 'Perfil C 150x50x15x2.5mm', type: 'Perfil C (Costanera)', weightKgM: 5.25, heightMm: 150, widthMm: 50, thicknessMm: 2.5, areaCm2: 6.69, IxCm4: 215.0, SxCm3: 28.7 },
  { id: 'perfil-c-150x50x3', name: 'Perfil C 150x50x15x3.0mm', type: 'Perfil C (Costanera)', weightKgM: 6.22, heightMm: 150, widthMm: 50, thicknessMm: 3.0, areaCm2: 7.93, IxCm4: 252.0, SxCm3: 33.6 },
  { id: 'perfil-c-200x50x2.5', name: 'Perfil C 200x50x20x2.5mm', type: 'Perfil C (Costanera)', weightKgM: 6.43, heightMm: 200, widthMm: 50, thicknessMm: 2.5, areaCm2: 8.19, IxCm4: 472.0, SxCm3: 47.2 },
  { id: 'perfil-c-200x50x3', name: 'Perfil C 200x50x20x3.0mm', type: 'Perfil C (Costanera)', weightKgM: 7.64, heightMm: 200, widthMm: 50, thicknessMm: 3.0, areaCm2: 9.73, IxCm4: 554.0, SxCm3: 55.4 },

  // Ángulos Estructurales L
  { id: 'ang-1.5x1.5x3/16', name: 'Ángulo L 1 1/2" x 1 1/2" x 3/16"', type: 'Ángulo L', weightKgM: 2.59, heightMm: 38.1, widthMm: 38.1, thicknessMm: 4.76, areaCm2: 3.3, IxCm4: 4.37, SxCm3: 1.6 },
  { id: 'ang-2x2x3/16', name: 'Ángulo L 2" x 2" x 3/16"', type: 'Ángulo L', weightKgM: 3.48, heightMm: 50.8, widthMm: 50.8, thicknessMm: 4.76, areaCm2: 4.43, IxCm4: 10.8, SxCm3: 2.98 },
  { id: 'ang-2x2x1/4', name: 'Ángulo L 2" x 2" x 1/4"', type: 'Ángulo L', weightKgM: 4.57, heightMm: 50.8, widthMm: 50.8, thicknessMm: 6.35, areaCm2: 5.82, IxCm4: 13.9, SxCm3: 3.9 }
];

export const MATERIAL_SPECS: Record<string, { name: string; fyMPa: number; fuMPa: number; densityKgM3: number }> = {
  'A36': { name: 'Acero ASTM A36', fyMPa: 250, fuMPa: 400, densityKgM3: 7850 },
  'A500 Gr. B': { name: 'Acero Estructural Tubos ASTM A500 Gr. B', fyMPa: 315, fuMPa: 400, densityKgM3: 7850 },
  'A572 Gr. 50': { name: 'Acero Alta Resistencia ASTM A572 Gr. 50', fyMPa: 345, fuMPa: 450, densityKgM3: 7850 },
  'Galvanizado': { name: 'Acero Galvanizado en Caliente G90', fyMPa: 275, fuMPa: 380, densityKgM3: 7850 }
};

export const getProfileById = (id: string): ProfileDefinition => {
  const p = STEEL_PROFILES.find(item => item.id === id);
  if (p) return p;
  return STEEL_PROFILES[4]; // Default IPE 300
};

export interface AluzincCatalogItem {
  id: string;
  perfil: 'TR4' | 'TR5' | 'Ondulado' | string;
  calibre: string; // '0.30 mm', '0.35 mm', '0.40 mm', '0.45 mm', '0.50 mm'
  espesorMm: number;
  anchoComercialM: number;
  anchoUtilM: number;
  pesoKgM2: number;
  precioSolesM2: number;
  colores: string[];
}

export const ALUZINC_CATALOG: AluzincCatalogItem[] = [
  { id: 'aluzinc-tr4-030', perfil: 'TR4', calibre: '0.30 mm', espesorMm: 0.30, anchoComercialM: 1.08, anchoUtilM: 1.00, pesoKgM2: 2.85, precioSolesM2: 32.00, colores: ['Azul', 'Rojo Teja', 'Gris Zinc', 'Blanco', 'Verde'] },
  { id: 'aluzinc-tr4-035', perfil: 'TR4', calibre: '0.35 mm', espesorMm: 0.35, anchoComercialM: 1.08, anchoUtilM: 1.00, pesoKgM2: 3.32, precioSolesM2: 38.00, colores: ['Azul', 'Rojo Teja', 'Gris Zinc', 'Blanco', 'Verde'] },
  { id: 'aluzinc-tr4-040', perfil: 'TR4', calibre: '0.40 mm', espesorMm: 0.40, anchoComercialM: 1.08, anchoUtilM: 1.00, pesoKgM2: 3.80, precioSolesM2: 44.00, colores: ['Azul', 'Rojo Teja', 'Gris Zinc', 'Blanco', 'Verde'] },
  { id: 'aluzinc-tr4-045', perfil: 'TR4', calibre: '0.45 mm', espesorMm: 0.45, anchoComercialM: 1.08, anchoUtilM: 1.00, pesoKgM2: 4.28, precioSolesM2: 50.00, colores: ['Azul', 'Rojo Teja', 'Gris Zinc', 'Blanco', 'Verde'] },
  { id: 'aluzinc-tr4-050', perfil: 'TR4', calibre: '0.50 mm', espesorMm: 0.50, anchoComercialM: 1.08, anchoUtilM: 1.00, pesoKgM2: 4.75, precioSolesM2: 56.00, colores: ['Azul', 'Rojo Teja', 'Gris Zinc', 'Blanco', 'Verde'] },
  { id: 'aluzinc-tr5-035', perfil: 'TR5', calibre: '0.35 mm', espesorMm: 0.35, anchoComercialM: 1.05, anchoUtilM: 0.95, pesoKgM2: 3.45, precioSolesM2: 40.00, colores: ['Azul', 'Rojo Teja', 'Gris Zinc', 'Blanco'] },
  { id: 'aluzinc-tr5-040', perfil: 'TR5', calibre: '0.40 mm', espesorMm: 0.40, anchoComercialM: 1.05, anchoUtilM: 0.95, pesoKgM2: 3.95, precioSolesM2: 46.00, colores: ['Azul', 'Rojo Teja', 'Gris Zinc', 'Blanco'] },
  { id: 'aluzinc-tr5-050', perfil: 'TR5', calibre: '0.50 mm', espesorMm: 0.50, anchoComercialM: 1.05, anchoUtilM: 0.95, pesoKgM2: 4.90, precioSolesM2: 58.00, colores: ['Azul', 'Rojo Teja', 'Gris Zinc', 'Blanco'] },
  { id: 'eternit-gran-onda', perfil: 'Eternit Gran Onda', calibre: '4.0 mm', espesorMm: 4.0, anchoComercialM: 1.10, anchoUtilM: 1.05, pesoKgM2: 9.80, precioSolesM2: 29.50, colores: ['Gris Cemento', 'Rojo Terracota'] },
  { id: 'eternit-perfil-4', perfil: 'Eternit Perfil 4', calibre: '4.0 mm', espesorMm: 4.0, anchoComercialM: 1.10, anchoUtilM: 1.02, pesoKgM2: 8.90, precioSolesM2: 26.00, colores: ['Gris Cemento'] },
  { id: 'fibrocemento-teja-andina', perfil: 'Teja Andina Fibrocemento', calibre: '5.0 mm', espesorMm: 5.0, anchoComercialM: 1.14, anchoUtilM: 1.08, pesoKgM2: 11.20, precioSolesM2: 34.00, colores: ['Rojo Colonial', 'Marrón'] },
  { id: 'policarbonato-alveolar-6', perfil: 'Policarbonato Alveolar 6mm', calibre: '6.0 mm', espesorMm: 6.0, anchoComercialM: 2.10, anchoUtilM: 2.10, pesoKgM2: 1.30, precioSolesM2: 48.00, colores: ['Translúcido Cristal', 'Blanco Opalino', 'Bronce'] }
];

export interface TermoacusticoCatalogItem {
  id: string;
  nombre: string;
  nucleo: 'EPS' | 'PUR' | 'PIR' | 'Lana de Roca';
  espesorTotalMm: number;
  espesorAislamientoMm: number;
  anchoTotalM: number;
  anchoUtilM: number;
  pesoKgM2: number;
  precioSolesM2: number;
  resistenciaTermicaR: number; // m²·K/W
  colores: string[];
}

export const TERMOACUSTICO_CATALOG: TermoacusticoCatalogItem[] = [
  { id: 'panel-eps-30', nombre: 'Panel Termoacústico EPS 30mm', nucleo: 'EPS', espesorTotalMm: 30, espesorAislamientoMm: 30, anchoTotalM: 1.15, anchoUtilM: 1.00, pesoKgM2: 8.20, precioSolesM2: 72.00, resistenciaTermicaR: 0.78, colores: ['Blanco', 'Gris', 'Azul', 'Rojo Teja'] },
  { id: 'panel-eps-40', nombre: 'Panel Termoacústico EPS 40mm', nucleo: 'EPS', espesorTotalMm: 40, espesorAislamientoMm: 40, anchoTotalM: 1.15, anchoUtilM: 1.00, pesoKgM2: 8.60, precioSolesM2: 80.00, resistenciaTermicaR: 1.05, colores: ['Blanco', 'Gris', 'Azul', 'Rojo Teja'] },
  { id: 'panel-eps-50', nombre: 'Panel Termoacústico EPS 50mm (Estándar)', nucleo: 'EPS', espesorTotalMm: 50, espesorAislamientoMm: 50, anchoTotalM: 1.15, anchoUtilM: 1.00, pesoKgM2: 9.10, precioSolesM2: 88.00, resistenciaTermicaR: 1.32, colores: ['Blanco', 'Gris', 'Azul', 'Rojo Teja'] },
  { id: 'panel-eps-60', nombre: 'Panel Termoacústico EPS 60mm', nucleo: 'EPS', espesorTotalMm: 60, espesorAislamientoMm: 60, anchoTotalM: 1.15, anchoUtilM: 1.00, pesoKgM2: 9.60, precioSolesM2: 98.00, resistenciaTermicaR: 1.58, colores: ['Blanco', 'Gris', 'Azul', 'Rojo Teja'] },
  { id: 'panel-pur-50', nombre: 'Panel Termoacústico Poliuretano PUR 50mm', nucleo: 'PUR', espesorTotalMm: 50, espesorAislamientoMm: 50, anchoTotalM: 1.15, anchoUtilM: 1.00, pesoKgM2: 10.40, precioSolesM2: 120.00, resistenciaTermicaR: 2.17, colores: ['Blanco', 'Gris', 'Azul'] }
];

export interface CanaletaOption {
  id: string;
  nombre: string;
  material: string;
  desarrolloMm: number;
  capacidadLm: number;
  precioSolesM: number;
}

export const CANALETA_OPTIONS: CanaletaOption[] = [
  { id: 'can-aluzinc-150', nombre: 'Canaleta Aluzinc TR4 e=0.40mm (150x120mm)', material: 'Aluzinc prepintado', desarrolloMm: 330, capacidadLm: 18, precioSolesM: 45.00 },
  { id: 'can-aluzinc-200', nombre: 'Canaleta Industrial Aluzinc e=0.50mm (200x150mm)', material: 'Aluzinc prepintado', desarrolloMm: 450, capacidadLm: 30, precioSolesM: 65.00 },
  { id: 'can-pvc-125', nombre: 'Canaleta PVC Pluvial Reforzada (125mm)', material: 'PVC', desarrolloMm: 280, capacidadLm: 14, precioSolesM: 38.00 }
];

export interface BajanteOption {
  id: string;
  diametroPulg: string;
  material: string;
  precioSolesM: number;
}

export const BAJANTE_OPTIONS: BajanteOption[] = [
  { id: 'baj-pvc-3', diametroPulg: '3"', material: 'PVC Pluvial', precioSolesM: 24.00 },
  { id: 'baj-pvc-4', diametroPulg: '4"', material: 'PVC Pluvial (Estándar)', precioSolesM: 32.00 },
  { id: 'baj-pvc-6', diametroPulg: '6"', material: 'PVC Pluvial Industrial', precioSolesM: 52.00 },
  { id: 'baj-aluzinc-4', diametroPulg: '4"', material: 'Aluzinc Prepintado', precioSolesM: 42.00 }
];
