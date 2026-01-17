export default function SpacerWidget({ config }) {
    const { height = '32px' } = config;

    return <div style={{ height }} aria-hidden="true" />;
}
