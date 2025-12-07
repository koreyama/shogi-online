
// Detailed SVG Paths for World Regions (800x400 viewbox)
// These are stylized approximations but much more recognizable than boxes.

export const WORLD_PATHS: Record<string, string> = {
    // North America: Alaska, Canada, USA, Mexico
    'usa': `
        M 50,70 
        L 90,70 L 150,50 L 220,40 L 280,30 L 300,50 
        L 280,90 L 260,110 L 220,130 L 180,180 L 160,200 
        L 130,220 L 100,190 L 80,170 L 60,150 Z
        M 100,230 L 120,230 L 130,250 L 110,260 Z 
    `, // Main continent + Cuba/islands simplified

    // South America
    'south_america': `
        M 230,270 
        Q 260,260 290,280 
        L 320,310 L 300,380 L 270,430 L 250,450 
        L 230,400 L 220,350 L 210,300 Z
    `,

    // Europe: UK, Scandinavia, Mainland
    'europe': `
        M 380,100 L 390,80 L 410,70 L 430,75 L 420,90 
        M 430,100 L 450,100 L 460,120 L 440,140 L 420,145 L 400,140 L 390,130 Z
        M 400,60 L 410,50 L 425,50 L 415,70 Z 
        M 375,110 L 385,105 L 385,115 Z 
    `,

    // Russia & North Asia
    'russia': `
        M 460,90 
        L 500,80 L 600,70 L 700,75 L 750,80 L 780,100 
        L 760,140 L 700,150 L 650,155 L 550,140 L 500,135 L 470,120 Z
    `,

    // Africa (North): Sahara, West Africa
    'africa_north': `
        M 380,160 
        L 430,160 L 480,165 L 500,180 
        L 500,230 L 480,250 L 400,240 L 370,220 L 360,190 Z
    `,

    // Africa (South): Congo, South Africa, Madagascar
    'africa_south': `
        M 400,240 
        L 480,250 L 500,230 L 510,250 L 520,300 
        L 480,360 L 450,370 L 420,340 L 400,280 Z
        M 530,320 L 540,310 L 545,340 L 535,350 Z 
    `,

    // Middle East
    'middle_east': `
        M 470,130 
        L 520,130 L 550,140 L 560,160 
        L 540,180 L 510,180 L 490,170 Z
    `,

    // Asia (East): China, Japan, Korea
    'asia_east': `
        M 560,140 
        L 620,130 L 680,140 L 700,170 L 680,200 L 620,200 L 580,180 Z
        M 710,150 L 730,160 L 720,180 L 705,170 Z 
    `,

    // Asia (South): India
    'asia_south': `
        M 540,180 
        L 580,180 L 600,220 L 580,250 L 560,250 L 540,210 Z
    `,

    // SE Asia & Oceania: Thailand, Indonesia, Australia
    'asia_se': `
        M 620,200 
        L 660,200 L 680,220 L 670,260 
        M 660,270 L 700,270 L 720,290 L 700,310 L 650,300 Z 
        M 720,320 L 780,320 L 790,360 L 720,380 L 700,340 Z 
    `
};

export const REGION_CENTERS: Record<string, { x: number, y: number }> = {
    'usa': { x: 150, y: 120 },
    'south_america': { x: 260, y: 320 },
    'europe': { x: 420, y: 100 },
    'russia': { x: 600, y: 100 },
    'middle_east': { x: 510, y: 150 },
    'africa_north': { x: 430, y: 200 },
    'africa_south': { x: 460, y: 300 },
    'asia_east': { x: 640, y: 160 },
    'asia_south': { x: 570, y: 210 },
    'asia_se': { x: 730, y: 340 },
};

export const AIR_ROUTES = [
    ['usa', 'europe'],
    ['usa', 'asia_east'],
    ['europe', 'asia_east'],
    ['europe', 'africa_north'],
    ['asia_east', 'asia_se'],
    ['south_america', 'africa_north'],
];

export const SEA_ROUTES = [
    ['usa', 'asia_east'], // Pacific
    ['europe', 'usa'], // Atlantic
    ['asia_se', 'usa'],
    ['africa_south', 'south_america'],
    ['asia_south', 'middle_east'],
];
