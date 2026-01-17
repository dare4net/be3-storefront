// About/Story Widget - Rich text content
export default function AboutWidget({ config }) {
    const {
        title = 'Our Story',
        content = '',
        image = ''
    } = config;

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    {image && (
                        <div className="rounded-2xl overflow-hidden shadow-xl">
                            <img
                                src={image}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <div className={!image ? 'md:col-span-2 max-w-4xl mx-auto' : ''}>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">{title}</h2>
                        <div
                            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
