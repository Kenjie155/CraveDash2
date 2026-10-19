"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE = exports.SAN_CARLOS_BOUNDARY_POLYGON = exports.CRAVEDASH_STORE_CONFIG = void 0;
exports.isWithinSanCarlosDeliveryArea = isWithinSanCarlosDeliveryArea;
/**
 * Temporary CraveDash Store location inside San Carlos City, Negros Occidental.
 * Easy-to-edit configuration.
 * Note: This represents a temporary demo location for demonstration purposes,
 * not a verified physical corporate address.
 */
exports.CRAVEDASH_STORE_CONFIG = {
    name: 'CraveDash Store',
    coordinate: {
        latitude: 10.4880,
        longitude: 123.4244,
    },
    address: 'San Carlos City Plaza Center, Negros Occidental (Demo Store Location)',
    description: 'Temporary CraveDash store / hub location in San Carlos City',
    isTemporaryDemo: true,
};
/**
 * Exact administrative boundary polygon of San Carlos City, Negros Occidental, Philippines
 * Derived from official OpenStreetMap boundary relation (osm_id: 10.3167°N - 10.6025°N, 123.1325°E - 123.5578°E).
 * Coordinates are formatted as [longitude, latitude] pairs.
 */
exports.SAN_CARLOS_BOUNDARY_POLYGON = [
    [123.1324518, 10.4113894],
    [123.2024352, 10.4377309],
    [123.2227646, 10.4358868],
    [123.2363832, 10.4309356],
    [123.2428659, 10.420653],
    [123.3357874, 10.382577],
    [123.4542161, 10.3167498],
    [123.4617878, 10.3479287],
    [123.4772458, 10.3763131],
    [123.5577767, 10.4681742],
    [123.4392018, 10.5086598],
    [123.4404248, 10.5178293],
    [123.4268756, 10.551186],
    [123.4229046, 10.5509962],
    [123.4168621, 10.5657849],
    [123.4046267, 10.5719984],
    [123.4012719, 10.5858332],
    [123.3838581, 10.5886601],
    [123.3690202, 10.6002271],
    [123.3500583, 10.6022997],
    [123.3364475, 10.5954703],
    [123.3339495, 10.5762364],
    [123.2648801, 10.5248553],
    [123.2577288, 10.5291319],
    [123.2486813, 10.5275439],
    [123.2403159, 10.523573],
    [123.2441461, 10.520862],
    [123.2412732, 10.5179706],
    [123.2249061, 10.5256025],
    [123.2242715, 10.5323317],
    [123.2137189, 10.5277056],
    [123.2039168, 10.5374054],
    [123.2005278, 10.5323201],
    [123.1935895, 10.5342583],
    [123.1324518, 10.4113894],
];
exports.SAN_CARLOS_DELIVERY_RESTRICTION_MESSAGE = 'Sorry, CraveDash currently delivers only within San Carlos City, Negros Occidental.';
/**
 * Validates whether a given coordinate falls within the official San Carlos City delivery boundary.
 * Uses the ray-casting point-in-polygon algorithm.
 */
function isWithinSanCarlosDeliveryArea(coord) {
    if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        return false;
    }
    const x = coord.longitude;
    const y = coord.latitude;
    const vs = exports.SAN_CARLOS_BOUNDARY_POLYGON;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0];
        const yi = vs[i][1];
        const xj = vs[j][0];
        const yj = vs[j][1];
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect)
            inside = !inside;
    }
    return inside;
}
