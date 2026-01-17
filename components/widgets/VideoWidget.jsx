// Video Widget - Embedded video
export default function VideoWidget({ config }) {
    const {
        title = '',
        videoUrl = '',
        description = ''
    } = config;

    if (!videoUrl) return null;

    // Extract YouTube ID if it's a YouTube URL
    const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYouTubeId(videoUrl);

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    {title && (
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">{title}</h2>
                    )}

                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl mb-6">
                        {youtubeId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <video
                                src={videoUrl}
                                controls
                                className="w-full h-full"
                            />
                        )}
                    </div>

                    {description && (
                        <p className="text-center text-gray-600 text-lg">{description}</p>
                    )}
                </div>
            </div>
        </section>
    );
}
