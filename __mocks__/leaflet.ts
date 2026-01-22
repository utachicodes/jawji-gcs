export default {
    Map: jest.fn(),
    TileLayer: jest.fn(),
    Marker: jest.fn(),
    Icon: jest.fn(),
    divIcon: jest.fn(() => ({})),
    marker: jest.fn(() => ({
        addTo: jest.fn(),
        on: jest.fn(),
        setLatLng: jest.fn(),
    })),
    map: jest.fn(() => ({
        setView: jest.fn(),
        on: jest.fn(),
        remove: jest.fn(),
        getCenter: jest.fn(() => ({ lat: 0, lng: 0 })),
        getZoom: jest.fn(() => 15),
    })),
    tileLayer: jest.fn(() => ({
        addTo: jest.fn(),
    })),
    polyline: jest.fn(() => ({
        addTo: jest.fn(),
        setLatLngs: jest.fn(),
    })),
    LayerGroup: jest.fn(() => ({
        addTo: jest.fn(),
        clearLayers: jest.fn(),
        addLayer: jest.fn(),
    })),
}
