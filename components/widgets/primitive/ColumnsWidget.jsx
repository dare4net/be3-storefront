export default function ColumnsWidget({ config, children }) {
    const {
        count = 3,
        gap = '4',
        align = 'start' // start, center, end (vertical alignment)
    } = config;

    // Tailwind grid class mapping
    const gridCols = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
        6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
    };

    const alignClass = {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end'
    };

    return (
        <div className="py-4">
            <div className={`grid ${gridCols[count] || 'grid-cols-1 md:grid-cols-3'} gap-${gap} ${alignClass[align] || 'items-start'}`}>
                {children}
            </div>
        </div>
    );
}
