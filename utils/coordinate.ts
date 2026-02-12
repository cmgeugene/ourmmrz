import proj4 from 'proj4';

// WGS84 (Google Maps, GPS)
const WGS84 = 'EPSG:4326';

// KATECH (Naver Search API)
// Definition for KATECH (TM128) often used in Korea
// Note: Naver Search API returns coordinates that might need specific handling.
// The mapx/mapy from Naver Search API are integers (e.g., 300000, 500000).
// They are usually 1/1000000 or similar if they look like lat/long, BUT
// standard KATECH are largely different numbers (approx 300,000 / 550,000 range).
// However, Naver Search API (v1) `mapx`, `mapy` are actually KATECH coordinates * 10? No, let's assume standard KATECH first.
// Actually, Naver Search API docs say "mapx: x coordinate of KATECH... mapy: y coordinate".
// Valid KATECH definition:
const KATECH = '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43';

/**
 * Converts KATECH (TM128) coordinates to WGS84 (Latitude/Longitude).
 * @param mapx String or Number (KATECH X)
 * @param mapy String or Number (KATECH Y)
 * @returns { latitude: number, longitude: number }
 */
export const convertKATECHtoWGS84 = (mapx: string | number, mapy: string | number) => {
    try {
        const x = typeof mapx === 'string' ? parseFloat(mapx) : mapx;
        const y = typeof mapy === 'string' ? parseFloat(mapy) : mapy;

        // Check if coordinates are likely WGS84 scaled by 10,000,000
        // Longitude (x) for Korea is around 124~132. Scaled: 1,240,000,000 ~ 1,320,000,000
        // Latitude (y) for Korea is around 33~43. Scaled: 330,000,000 ~ 430,000,000
        // KATECH X is roughly 280,000 ~ 600,000
        // KATECH Y is roughly 200,000 ~ 600,000

        // If x > 100,000,000, assume it's scaled WGS84
        if (x > 10000000) {
            return {
                latitude: y / 10000000,
                longitude: x / 10000000
            };
        }

        const [longitude, latitude] = proj4(KATECH, WGS84, [x, y]);
        return { latitude, longitude };
    } catch (e) {
        console.error("Failed to convert coordinates", e);
        return { latitude: 0, longitude: 0 };
    }
};
