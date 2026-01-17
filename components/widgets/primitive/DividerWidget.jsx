export default function DividerWidget({ config }) {
    const {
        style = 'solid', // solid, dashed, dotted
        color = '#e5e7eb',
        height = '1px',
        width = '100%'
    } = config;

    const alignClass = 'mx-auto'; // Default centered

    return (
        <div className={`py-4 ${alignClass}`} style={{ width }}>
            <div
                style={{
                    borderTopStyle: style,
                    borderTopWidth: height,
                    borderTopColor: color,
                    width: '100%'
                }}
            />
        </div>
    );
}
