import React from 'react';
import { MapPin, Truck } from 'lucide-react';

export default function ProductLocation({ location, otherLocations }) {
    if (!location) return null;

    const formatLocation = (loc) => {
        if (!loc) return '';
        switch (loc.scope) {
            case 'worldwide':
                return 'Worldwide';
            case 'continent':
                return loc.continent || 'Continental';
            case 'country':
                return loc.country || 'Country-wide';
            case 'state':
                return `${loc.state}${loc.country ? ', ' + loc.country : ''}`;
            case 'city':
                return `${loc.city}${loc.state ? ', ' + loc.state : ''}${loc.country ? ', ' + loc.country : ''}`;
            case 'specific':
                return loc.city && loc.state
                    ? `${loc.city}, ${loc.state}`
                    : loc.address || 'Specific Location';
            default:
                return 'Location Available';
        }
    };

    return (
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Ships from: <strong>{formatLocation(location)}</strong></span>
            </div>
            {otherLocations && otherLocations.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4 mt-0.5" />
                    <span>
                        Can deliver: <strong>{otherLocations.map(l => formatLocation(l)).join(", ")}</strong>
                    </span>
                </div>
            )}
        </div>
    );
}
